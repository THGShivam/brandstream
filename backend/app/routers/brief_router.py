"""
API routes for creative brief analysis
"""
from typing import Optional
from fastapi import APIRouter, File, UploadFile, Form, HTTPException, Depends
from fastapi.responses import JSONResponse

from app.models.brief_models import BriefAnalysisResponse
from app.services.gemini_service import GeminiService
from app.utils.file_extractor import FileExtractor
from app.config import Config


router = APIRouter(prefix="/api", tags=["brief-analysis"])


def get_gemini_service() -> GeminiService:
    """Dependency to get Gemini service instance"""
    if not Config.is_configured():
        raise HTTPException(
            status_code=500,
            detail="Vertex AI not configured. Please set SERVICE_ACCOUNT_JSON and PROJECT_ID environment variables."
        )
    return GeminiService()


@router.post("/analyze-brief", response_model=BriefAnalysisResponse)
async def analyze_brief(
    file: Optional[UploadFile] = File(None, description="Creative brief file (PDF or DOCX)"),
    text: Optional[str] = Form(None, description="Creative brief as plain text"),
    gemini_service: GeminiService = Depends(get_gemini_service)
):
    """
    Analyze a creative brief and return structured information.

    Accepts either:
    - A file upload (PDF or DOCX format)
    - Plain text via form data

    Returns structured brief analysis with extracted and auto-generated fields.

    Args:
        file: Optional file upload (PDF or DOCX)
        text: Optional plain text brief
        gemini_service: Injected Gemini service

    Returns:
        BriefAnalysisResponse: Structured brief analysis

    Raises:
        HTTPException: If neither file nor text is provided, or if processing fails
    """
    # Validate input
    if not file and not text:
        raise HTTPException(
            status_code=400,
            detail="Either 'file' or 'text' must be provided"
        )

    if file and text:
        raise HTTPException(
            status_code=400,
            detail="Provide either 'file' or 'text', not both"
        )

    try:
        # Extract text from file or use provided text
        if file:
            brief_text = await _extract_text_from_file(file)
        else:
            brief_text = text

        # Validate brief text
        if not brief_text or not brief_text.strip():
            raise HTTPException(
                status_code=400,
                detail="Brief text is empty or could not be extracted"
            )

        # Analyze the brief using Gemini
        analysis_result = await gemini_service.analyze_creative_brief(brief_text)

        # Validate the response structure
        validated = BriefAnalysisResponse(**analysis_result)

        # Return as plain JSON dict to ensure mutability on frontend
        return JSONResponse(content=validated.model_dump(mode='json'))

    except ValueError as e:
        raise HTTPException(
            status_code=422,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing creative brief: {str(e)}"
        )


async def _extract_text_from_file(file: UploadFile) -> str:
    """
    Extract text from uploaded file

    Args:
        file: Uploaded file

    Returns:
        Extracted text content

    Raises:
        HTTPException: If file type is not supported
    """
    # Validate file type
    supported_types = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword"
    ]

    if file.content_type not in supported_types:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file.content_type}. Supported types: PDF, DOCX"
        )

    # Read file content
    file_content = await file.read()

    if not file_content:
        raise HTTPException(
            status_code=400,
            detail="File is empty"
        )

    # Extract text
    try:
        return await FileExtractor.extract_text(file_content, file.content_type)
    except ValueError as e:
        raise HTTPException(
            status_code=422,
            detail=str(e)
        )
