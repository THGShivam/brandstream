"""
API routes for copy translation
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import JSONResponse

from app.models.translation_models import TranslationRequest, TranslationResponse
from app.services.translation_service import TranslationService
from app.config import Config


router = APIRouter(prefix="/api", tags=["translation"])


def get_translation_service() -> TranslationService:
    """Dependency to get Translation service instance"""
    if not Config.is_configured():
        raise HTTPException(
            status_code=500,
            detail="Vertex AI not configured. Please set SERVICE_ACCOUNT_JSON and PROJECT_ID environment variables."
        )
    return TranslationService()


@router.post("/translate", response_model=TranslationResponse)
async def translate_copy(
    raw_request: Request,
    translation_service: TranslationService = Depends(get_translation_service)
):
    """
    Translate structured copy to a target language while maintaining context.

    Accepts a JSON payload with:
    - copy_text: Object containing headline, body_text, and call_to_action
    - target_language: The target language (e.g., 'Spanish', 'French', 'German')

    Returns structured translation with all components translated.

    Args:
        request: Translation request with copy_text and target_language
        translation_service: Injected Translation service

    Returns:
        TranslationResponse: Contains translated_copy and translated_to fields

    Raises:
        HTTPException: If translation fails or validation errors occur
    """
    try:
        # Parse and validate the request body
        body = await raw_request.json()
        request = TranslationRequest(**body)

        # Validate input
        if not request.copy_text.headline.strip():
            raise HTTPException(
                status_code=400,
                detail="headline cannot be empty"
            )

        if not request.copy_text.body_text.strip():
            raise HTTPException(
                status_code=400,
                detail="body_text cannot be empty"
            )

        if not request.copy_text.call_to_action.strip():
            raise HTTPException(
                status_code=400,
                detail="call_to_action cannot be empty"
            )

        if not request.target_language.strip():
            raise HTTPException(
                status_code=400,
                detail="target_language cannot be empty"
            )

        # Translate the copy using Translation service
        translation_result = await translation_service.translate_copy(
            headline=request.copy_text.headline,
            body_text=request.copy_text.body_text,
            call_to_action=request.copy_text.call_to_action,
            target_language=request.target_language
        )

        # Validate the response structure
        validated = TranslationResponse(**translation_result)

        # Return as JSON response
        return JSONResponse(content=validated.model_dump(mode='json'))

    except ValueError as e:
        raise HTTPException(
            status_code=422,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error translating copy: {str(e)}"
        )
