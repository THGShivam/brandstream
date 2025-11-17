"""
Service for generating creative assets using Google AI models
"""
import base64
import asyncio
import time
import tempfile
import io
from typing import List, Dict, Any
import vertexai
from vertexai.preview.vision_models import ImageGenerationModel, Image as VertexImage
from vertexai.generative_models import GenerativeModel
from google import genai
from google.genai.types import GenerateVideosConfig
import json
import google.generativeai as genai_sdk
from PIL import Image as PILImage

from app.models.ad_creative_models import (
    ImageGenerationConfig,
    GeneratedImage,
    VideoGenerationConfig,
    GeneratedVideo,
    CopyGenerationConfig,
    GeneratedCopy
)
from app.config import Config


class AssetGenerationService:
    """Service for generating creative assets using Google AI"""

    def __init__(self):
        self.imagen_models = {}  # Cache for different model versions
        self.gemini_models = {}  # Cache for Gemini models

    def _map_creativity_to_temperature(self, creativity_level: str) -> float:
        """Map creativity level to temperature parameter"""
        mapping = {
            "conservative": 0.2,
            "balanced": 0.4,
            "creative": 0.6,
            "experimental": 0.8
        }
        return mapping.get(creativity_level.lower(), 0.4)

    def _get_imagen_model(self, model_name: str):
        """Get or create Imagen model instance"""
        if model_name not in self.imagen_models:
            print(f"Loading Imagen model: {model_name}")
            self.imagen_models[model_name] = model_name
        return self.imagen_models[model_name]

    def _get_gemini_model(self, model_name: str) -> GenerativeModel:
        """Get or create Gemini model instance"""
        if model_name not in self.gemini_models:
            print(f"Loading Gemini model: {model_name}")
            self.gemini_models[model_name] = GenerativeModel(model_name)
        return self.gemini_models[model_name]

    def _bytes_to_base64(self, data_bytes: bytes) -> str:
        """Convert bytes to base64 string"""
        return base64.b64encode(data_bytes).decode('utf-8')

    async def generate_images(
        self,
        config: ImageGenerationConfig,
        product_sku_image: bytes
    ) -> List[GeneratedImage]:
        """Generate images using Gemini 2.5 Flash with image preview capability"""
        try:
            print(f"Using Gemini model: gemini-2.5-flash-image-preview")
            print(f"Generating {config.num_variations} image variations with reference image...")

            # Configure Gemini API
            genai_sdk.configure(api_key=Config.GEMINI_API_KEY)
            model = genai_sdk.GenerativeModel('gemini-2.5-flash-image-preview')

            # Convert product SKU image bytes to PIL Image
            product_image = PILImage.open(io.BytesIO(product_sku_image))

            generated_images = []

            # Generate images one at a time with the reference image
            for i in range(config.num_variations):
                print(f"Generating variation {i + 1}/{config.num_variations}...")

                # Create prompt that includes reference to the product image
                generation_prompt = f"""Generate a creative advertising image based on this product image and the following prompt:

{config.prompt}

Make sure to incorporate the product from the reference image into the creative scene. Create variation {i + 1} with unique styling while maintaining the product's appearance."""

                # Generate image with reference
                response = model.generate_content(
                    [generation_prompt, product_image],
                    generation_config={
                        "temperature": self._map_creativity_to_temperature(config.creativity_level),
                    }
                )

                # Extract generated image from response
                if response.candidates and len(response.candidates) > 0:
                    candidate = response.candidates[0]
                    if candidate.content and candidate.content.parts:
                        for part in candidate.content.parts:
                            if hasattr(part, 'inline_data') and part.inline_data:
                                # Get image bytes from inline data
                                image_bytes = part.inline_data.data
                                image_base64 = self._bytes_to_base64(image_bytes)

                                generated_images.append(
                                    GeneratedImage(
                                        image_base64=image_base64,
                                        variation_number=i + 1,
                                        mime_type=part.inline_data.mime_type or "image/png"
                                    )
                                )
                                print(f"✓ Successfully generated image variation {i + 1}")
                                break

            if not generated_images:
                raise ValueError("No images were generated")

            print(f"✓ Generated {len(generated_images)} images successfully with reference image")
            return generated_images

        except Exception as e:
            raise ValueError(f"Error generating images: {str(e)}")

    async def generate_video(
        self,
        config: VideoGenerationConfig,
        product_sku_image: bytes
    ) -> GeneratedVideo:
        """Generate video using Veo 3 with Google GenAI SDK"""
        print(f"Using Veo model: veo-3.1-generate-preview")

        try:
            # Initialize Google GenAI client
            client = genai.Client(
                vertexai=True,
                project=Config.PROJECT_ID,
                location="us-central1"
            )

            print(f"Generating {config.duration_seconds}s video with prompt: {config.prompt[:100]}...")

            # Start video generation operation - pass image bytes with MIME type
            # Note: Not using output_gcs_uri so the API returns video_bytes directly
            operation = client.models.generate_videos(
                model="veo-3.1-fast-generate-preview",
                prompt=config.prompt,  # Use user's prompt directly
                image=genai.types.Image(
                    image_bytes=product_sku_image,
                    mime_type="image/png"  # Specify MIME type
                ),
                config=GenerateVideosConfig(
                    aspect_ratio="16:9",
                ),
            )

            print("Video generation started, waiting for completion...")
            print(f"Operation type: {type(operation)}")
            print(f"Operation value: {operation}")

            max_wait_time = 600  # 10 minutes timeout
            start_time = time.time()

            # Handle operation - it might be a string (operation name) or an operation object
            try:
                if isinstance(operation, str):
                    operation_name = operation
                    print(f"Operation is a string: {operation_name}")
                else:
                    operation_name = str(operation.name) if hasattr(operation, 'name') else str(operation)
                    print(f"Extracted operation name: {operation_name}")
            except Exception as e:
                print(f"Error extracting operation name: {e}")
                raise ValueError(f"Failed to get operation name: {str(e)}")

            # Poll for completion using the operation object
            while True:
                try:
                    if time.time() - start_time > max_wait_time:
                        raise ValueError("Video generation timed out after 10 minutes")

                    # Get the current operation status - pass the operation object, not the string
                    current_operation = client.operations.get(operation)

                    # Safely check status
                    try:
                        status = current_operation.metadata if hasattr(current_operation, 'metadata') else 'polling...'
                        print(f"Video generation status: {status}")
                    except:
                        print("Polling...")

                    # Check if done
                    try:
                        is_done = current_operation.done if hasattr(current_operation, 'done') else False
                        if is_done:
                            operation = current_operation
                            break
                    except:
                        pass

                    # Update operation for next iteration
                    operation = current_operation

                    await asyncio.sleep(15)  # Wait 15 seconds between polls
                except Exception as e:
                    print(f"Error during polling: {e}")
                    raise

            # Check if we have a response
            try:
                print(f"Operation object: {operation}")
                print(f"Has response: {hasattr(operation, 'response')}")
                print(f"Response value: {operation.response if hasattr(operation, 'response') else 'N/A'}")
                print(f"Has result: {hasattr(operation, 'result')}")

                # Try to get the result
                if hasattr(operation, 'result') and operation.result:
                    result = operation.result
                    print(f"Result object: {result}")
                    print(f"Result type: {type(result)}")

                    # Check for generated_videos
                    if hasattr(result, 'generated_videos') and result.generated_videos:
                        video_result = result.generated_videos[0]
                        print(f"Video result: {video_result}")

                        # Check if we have video object
                        if hasattr(video_result, 'video') and video_result.video:
                            video_obj = video_result.video

                            # Try to get video URI first
                            video_uri = None
                            if hasattr(video_obj, 'uri') and video_obj.uri:
                                video_uri = video_obj.uri
                            elif hasattr(video_obj, 'url') and video_obj.url:
                                video_uri = video_obj.url

                            print(f"Video URI: {video_uri}")

                            # If we have a URI, process it
                            if video_uri:
                                # Check if it's a GCS URI or HTTP URL
                                if video_uri.startswith('gs://'):
                                    # Download video from GCS and convert to base64
                                    from google.cloud import storage
                                    storage_client = storage.Client()

                                    # Parse GCS URI (gs://bucket/path)
                                    uri_parts = video_uri.replace("gs://", "").split("/", 1)
                                    bucket_name = uri_parts[0]
                                    blob_path = uri_parts[1]

                                    bucket = storage_client.bucket(bucket_name)
                                    blob = bucket.blob(blob_path)

                                    # Generate a signed URL (valid for 1 hour)
                                    from datetime import timedelta
                                    video_url = blob.generate_signed_url(
                                        version="v4",
                                        expiration=timedelta(hours=1),
                                        method="GET"
                                    )

                                    print(f"✓ Successfully generated video with signed URL")
                                    return GeneratedVideo(
                                        video_url=video_url,
                                        mime_type="video/mp4",
                                        duration_seconds=float(config.duration_seconds)
                                    )
                                elif video_uri.startswith('http'):
                                    # It's already a URL, return it directly
                                    print(f"✓ Successfully generated video with URL")
                                    return GeneratedVideo(
                                        video_url=video_uri,
                                        mime_type="video/mp4",
                                        duration_seconds=float(config.duration_seconds)
                                    )

                            # If no URI, check for video_bytes
                            if hasattr(video_obj, 'video_bytes') and video_obj.video_bytes:
                                print(f"Video bytes found, converting to base64...")
                                video_bytes = video_obj.video_bytes
                                video_base64 = self._bytes_to_base64(video_bytes)

                                print(f"✓ Successfully generated video with base64 (size: {len(video_bytes)} bytes)")
                                return GeneratedVideo(
                                    video_base64=video_base64,
                                    mime_type="video/mp4",
                                    duration_seconds=float(config.duration_seconds)
                                )

                # If we get here, we couldn't find the video
                raise ValueError(f"Video generation completed but no video found. Operation: {operation}")

            except Exception as e:
                print(f"Error processing video result: {e}")
                import traceback
                print(f"Processing error traceback: {traceback.format_exc()}")
                raise ValueError(f"Failed to process video result: {str(e)}")

        except Exception as e:
            import traceback
            print(f"Full error traceback: {traceback.format_exc()}")
            raise ValueError(f"Error generating video: {str(e)}")

    async def generate_copy(
        self,
        config: CopyGenerationConfig,
        brief_context: str
    ) -> List[GeneratedCopy]:
        """Generate ad copy using Gemini"""
        try:
            model = self._get_gemini_model(config.model_name)
            temperature = self._map_creativity_to_temperature(config.creativity_level)

            print(f"Using Gemini model: {config.model_name}")
            print(f"Generating {config.num_variations} copy variations...")

            # Enhanced prompt for copy generation
            generation_prompt = f"""{config.prompt}

Generate {config.num_variations} different advertising copy variations.

For each variation, provide:
1. A compelling headline (max 60 characters)
2. Body text that tells the product story (100-150 words)
3. A strong call-to-action (max 30 characters)

Return the response as a JSON array with this structure:
[
  {{
    "headline": "...",
    "body_text": "...",
    "call_to_action": "..."
  }}
]

Brief Context:
{brief_context}"""

            response = model.generate_content(
                generation_prompt,
                generation_config={
                    "temperature": temperature,
                    "response_mime_type": "application/json"
                }
            )

            # Parse JSON response
            copy_data = json.loads(response.text)

            generated_copies = []
            for i, copy_item in enumerate(copy_data[:config.num_variations]):
                generated_copies.append(
                    GeneratedCopy(
                        headline=copy_item.get("headline", ""),
                        body_text=copy_item.get("body_text", ""),
                        call_to_action=copy_item.get("call_to_action", ""),
                        variation_number=i + 1
                    )
                )
                print(f"✓ Generated copy variation {i + 1}")

            return generated_copies

        except Exception as e:
            raise ValueError(f"Error generating copy: {str(e)}")

    async def generate_assets(
        self,
        image_config: ImageGenerationConfig = None,
        video_config: VideoGenerationConfig = None,
        copy_config: CopyGenerationConfig = None,
        product_sku_image: bytes = None,
        brief_context: str = None
    ) -> Dict[str, Any]:
        """
        Generate creative assets in parallel

        Args:
            image_config: Configuration for image generation
            video_config: Configuration for video generation
            copy_config: Configuration for copy generation
            product_sku_image: Product SKU image bytes
            brief_context: Brief context for copy generation

        Returns:
            Dictionary with generated assets
        """
        result = {}
        tasks = []
        task_types = []

        # Prepare parallel tasks
        if image_config and product_sku_image:
            tasks.append(self.generate_images(config=image_config, product_sku_image=product_sku_image))
            task_types.append('images')

        if video_config and product_sku_image:
            tasks.append(self.generate_video(config=video_config, product_sku_image=product_sku_image))
            task_types.append('video')

        if copy_config and brief_context:
            tasks.append(self.generate_copy(config=copy_config, brief_context=brief_context))
            task_types.append('copy_variations')

        # Run all generation tasks in parallel
        if tasks:
            print(f"🚀 Running {len(tasks)} generation tasks in parallel...")
            results = await asyncio.gather(*tasks, return_exceptions=True)

            # Process results
            for task_type, task_result in zip(task_types, results):
                if isinstance(task_result, Exception):
                    print(f"⚠ Error in {task_type} generation: {str(task_result)}")
                    # Continue with other tasks even if one fails
                else:
                    result[task_type] = task_result
                    print(f"✓ {task_type} generation completed successfully")

        return result
