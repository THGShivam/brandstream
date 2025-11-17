"""
Gemini AI service for creative brief analysis
"""
import json
from typing import Dict, Any
from vertexai.generative_models import GenerativeModel

from app.prompts import PromptLoader
from app.models.brief_models import BriefAnalysisResponse


class GeminiService:
    """Service for interacting with Gemini AI models for brief analysis"""

    def __init__(self):
        self.model_name = 'gemini-2.5-pro'
        self.model = None

    def _get_model(self) -> GenerativeModel:
        """Lazy load the model when needed"""
        if self.model is None:
            self.model = GenerativeModel(self.model_name)
        return self.model


    async def analyze_creative_brief(self, brief_text: str) -> Dict[str, Any]:
        """
        Analyze creative brief and extract/generate structured information

        Args:
            brief_text: The creative brief text content

        Returns:
            Structured brief analysis with extracted and generated fields

        Raises:
            ValueError: If analysis fails
        """
        # Load prompt template
        prompt = PromptLoader.load("brief_analysis", brief_text=brief_text)

        try:
            model = self._get_model()

            # Option 1: Let Gemini generate free-form JSON, then validate with Pydantic
            response = model.generate_content(
                prompt,
                generation_config={
                    "response_mime_type": "application/json"
                }
            )

            # Parse and validate the response using Pydantic
            raw_result = json.loads(response.text)

            # Validate and convert to our Pydantic model
            validated_response = BriefAnalysisResponse.model_validate(raw_result)

            # Return as dict for the API response with proper JSON serialization
            return validated_response.model_dump(mode='json', by_alias=False)

        except Exception as e:
            raise ValueError(f"Error analyzing creative brief: {str(e)}")
