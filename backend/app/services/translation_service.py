"""
Translation service using Gemini AI for context-aware translations
"""
import json
from typing import Dict, Any
from vertexai.generative_models import GenerativeModel

from app.prompts import PromptLoader
from app.models.translation_models import TranslationResponse


class TranslationService:
    """Service for translating copy text using Gemini AI with context maintenance"""

    def __init__(self):
        self.model_name = 'gemini-2.5-pro'
        self.model = None

    def _get_model(self) -> GenerativeModel:
        """Lazy load the model when needed"""
        if self.model is None:
            self.model = GenerativeModel(self.model_name)
        return self.model

    async def translate_copy(
        self,
        headline: str,
        body_text: str,
        call_to_action: str,
        target_language: str
    ) -> Dict[str, Any]:
        """
        Translate structured copy to target language while maintaining context

        Args:
            headline: The headline text to be translated
            body_text: The body text to be translated
            call_to_action: The call to action text to be translated
            target_language: The target language for translation

        Returns:
            Dictionary with translated_copy structure and translated_to fields

        Raises:
            ValueError: If translation fails
        """
        # Load prompt template
        prompt = PromptLoader.load(
            "translation",
            headline=headline,
            body_text=body_text,
            call_to_action=call_to_action,
            target_language=target_language
        )

        try:
            model = self._get_model()

            # Generate translation with JSON response
            response = model.generate_content(
                prompt,
                generation_config={
                    "response_mime_type": "application/json"
                }
            )

            # Parse and validate the response using Pydantic
            raw_result = json.loads(response.text)

            # Validate and convert to our Pydantic model
            validated_response = TranslationResponse.model_validate(raw_result)

            # Return as dict for the API response
            return validated_response.model_dump(mode='json', by_alias=False)

        except Exception as e:
            raise ValueError(f"Error translating copy: {str(e)}")
