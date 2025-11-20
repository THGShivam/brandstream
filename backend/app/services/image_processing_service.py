"""
Image processing service using Google GenAI - matching reference implementation
"""
import base64
import asyncio
import io
from typing import Optional
import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold
from PIL import Image as PILImage
from app.config import Config


class ImageProcessingService:
    """Service for AI-powered image processing"""
    
    def __init__(self):
        """Initialize the service with Google GenAI API"""
        if not hasattr(Config, 'GEMINI_API_KEY') or not Config.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY not configured. Please set GEMINI_API_KEY environment variable.")
        
        # Configure Google GenAI
        genai.configure(api_key=Config.GEMINI_API_KEY)
    
    async def apply_filter(self, image_base64: str, mime_type: str, filter_prompt: str) -> dict:
        """
        Apply AI-powered filter to an image - based on generateFilteredImage from reference
        """
        try:
            # Define relaxed safety settings
            safety_settings = {
                HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
                HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
                HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_ONLY_HIGH,
                HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_ONLY_HIGH,
            }
            
            # Create model instance with relaxed safety settings
            model = genai.GenerativeModel(
                "gemini-2.5-flash-image",
                safety_settings=safety_settings
            )
            
            # Convert base64 to PIL Image (following working pattern)
            image_data = base64.b64decode(image_base64)
            image = PILImage.open(io.BytesIO(image_data))
            
            # Use safer, more descriptive prompt to avoid safety blocks
            prompt = f"""Apply a stylistic filter effect to this image. Make subtle adjustments to colors, lighting, and atmosphere to achieve: {filter_prompt}

Keep the original composition, subjects, and content unchanged. Only modify the visual style, color grading, lighting effects, or artistic treatment.

Return only the stylistically filtered image."""
            
            # Generate filtered image (following working asset generation pattern)
            response = await asyncio.to_thread(
                model.generate_content,
                [prompt, image]
            )
            
            # Handle response using reference implementation logic
            filtered_image_data = self._handle_api_response(response, "filter")
            
            # Extract base64 data from data URL
            if filtered_image_data.startswith('data:'):
                mime_type_from_response, base64_data = filtered_image_data.split(',', 1)
                output_mime_type = mime_type_from_response.split(';')[0].replace('data:', '')
            else:
                base64_data = filtered_image_data
                output_mime_type = mime_type
            
            return {
                "filtered_image_base64": base64_data,
                "mime_type": output_mime_type,
                "filter_applied": filter_prompt
            }
            
        except Exception as e:
            raise Exception(f"Filter application failed: {str(e)}")
    
    async def apply_adjustment(self, image_base64: str, mime_type: str, adjustment_prompt: str) -> dict:
        """
        Apply AI-powered adjustments to an image - based on generateAdjustedImage from reference
        """
        try:
            # Define relaxed safety settings
            safety_settings = {
                HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
                HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
                HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_ONLY_HIGH,
                HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_ONLY_HIGH,
            }
            
            # Create model instance with relaxed safety settings
            model = genai.GenerativeModel(
                "gemini-2.5-flash-image",
                safety_settings=safety_settings
            )
            
            # Convert base64 to PIL Image (following working pattern)
            image_data = base64.b64decode(image_base64)
            image = PILImage.open(io.BytesIO(image_data))
            
            # Use safer, more descriptive prompt for adjustments
            prompt = f"""Make natural photo adjustments to this image: {adjustment_prompt}

Apply the requested changes while maintaining photorealism. Keep the original composition and subject matter unchanged.

Return only the adjusted image."""
            
            # Generate adjusted image (following working asset generation pattern)
            response = await asyncio.to_thread(
                model.generate_content,
                [prompt, image]
            )
            
            # Handle response using reference implementation logic
            adjusted_image_data = self._handle_api_response(response, "adjustment")
            
            # Extract base64 data from data URL
            if adjusted_image_data.startswith('data:'):
                mime_type_from_response, base64_data = adjusted_image_data.split(',', 1)
                output_mime_type = mime_type_from_response.split(';')[0].replace('data:', '')
            else:
                base64_data = adjusted_image_data
                output_mime_type = mime_type
            
            return {
                "adjusted_image_base64": base64_data,
                "mime_type": output_mime_type,
                "adjustment_applied": adjustment_prompt
            }
            
        except Exception as e:
            raise Exception(f"Adjustment application failed: {str(e)}")
    
    def _handle_api_response(self, response, context: str) -> str:
        """
        Handle API response and extract image data - matching reference implementation
        """
        # Check for prompt blocking first (reference implementation)
        if hasattr(response, 'prompt_feedback') and response.prompt_feedback and hasattr(response.prompt_feedback, 'block_reason'):
            block_reason = response.prompt_feedback.block_reason
            block_message = getattr(response.prompt_feedback, 'block_reason_message', '')
            error_message = f"Request was blocked. Reason: {block_reason}. {block_message or ''}"
            raise Exception(error_message)
        
        # Try to find the image part (reference implementation logic)
        if hasattr(response, 'candidates') and response.candidates and len(response.candidates) > 0:
            candidate = response.candidates[0]
            if hasattr(candidate, 'content') and candidate.content and hasattr(candidate.content, 'parts'):
                for part in candidate.content.parts:
                    if hasattr(part, 'inline_data') and part.inline_data:
                        mime_type = part.inline_data.mime_type
                        # Get image bytes from inline data (following working pattern)
                        image_bytes = part.inline_data.data
                        # Convert bytes to base64 string (following working pattern)
                        image_base64 = base64.b64encode(image_bytes).decode('utf-8')
                        return f"data:{mime_type};base64,{image_base64}"
        
        # Check for other finish reasons (reference implementation)
        if (hasattr(response, 'candidates') and response.candidates and len(response.candidates) > 0):
            candidate = response.candidates[0]
            if hasattr(candidate, 'finish_reason') and candidate.finish_reason and candidate.finish_reason != "STOP":
                finish_reason = candidate.finish_reason
                error_message = f"Image generation for {context} stopped unexpectedly. Reason: {finish_reason}. This often relates to safety settings."
                raise Exception(error_message)
        
        # Check for text response (reference implementation)
        text_feedback = ''
        if hasattr(response, 'text') and response.text:
            text_feedback = response.text.strip()
        
        error_message = (
            f"The AI model did not return an image for the {context}. " +
            (f"The model responded with text: \"{text_feedback}\"" if text_feedback else 
             "This can happen due to safety filters or if the request is too complex. Please try rephrasing your prompt to be more direct.")
        )
        
        raise Exception(error_message)