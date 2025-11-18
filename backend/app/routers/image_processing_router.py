"""
API routes for AI-powered image processing (filters and adjustments)
"""
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse

from app.models.image_processing_models import (
    ImageFilterRequest,
    ImageFilterResponse,
    ImageAdjustmentRequest,
    ImageAdjustmentResponse
)
from app.services.image_processing_service import ImageProcessingService
from app.config import Config


router = APIRouter(prefix="/api/image", tags=["image-processing"])


def get_image_processing_service() -> ImageProcessingService:
    """Dependency to get ImageProcessingService instance"""
    if not Config.is_configured():
        raise HTTPException(
            status_code=500,
            detail="Vertex AI not configured. Please set SERVICE_ACCOUNT_JSON and PROJECT_ID environment variables."
        )
    return ImageProcessingService()


@router.post("/filter", response_model=ImageFilterResponse)
async def apply_filter(
    request: ImageFilterRequest,
    image_processing_service: ImageProcessingService = Depends(get_image_processing_service)
):
    """
    Apply AI-powered filter to an image using Gemini 2.5 Flash Image Preview.
    
    This endpoint processes images with stylistic filters based on natural language prompts.
    Examples: "sepia", "vintage", "black and white", "warm tones", "cool blues", etc.
    
    Args:
        request: ImageFilterRequest containing image data and filter prompt
        image_processing_service: Injected ImageProcessingService
        
    Returns:
        ImageFilterResponse: Filtered image data with metadata
        
    Raises:
        HTTPException: If processing fails
    """
    try:
        # Validate input
        if not request.image_base64:
            raise HTTPException(
                status_code=400,
                detail="Image data is required"
            )
            
        if not request.filter_prompt.strip():
            raise HTTPException(
                status_code=400,
                detail="Filter prompt is required"
            )
        
        # Apply filter using the service
        filter_result = await image_processing_service.apply_filter(
            image_base64=request.image_base64,
            mime_type=request.mime_type,
            filter_prompt=request.filter_prompt
        )
        
        # Validate the response structure
        validated = ImageFilterResponse(**filter_result)
        
        # Return as plain JSON dict to ensure mutability on frontend
        return JSONResponse(content=validated.model_dump(mode='json'))
        
    except ValueError as e:
        raise HTTPException(
            status_code=422,
            detail=f"Validation error: {str(e)}"
        )
    except Exception as e:
        # Log the error for debugging
        import traceback
        print(f"Filter application error: {str(e)}")
        print(traceback.format_exc())
        
        raise HTTPException(
            status_code=500,
            detail=f"Error applying filter: {str(e)}"
        )


@router.post("/adjust", response_model=ImageAdjustmentResponse)
async def apply_adjustment(
    request: ImageAdjustmentRequest,
    image_processing_service: ImageProcessingService = Depends(get_image_processing_service)
):
    """
    Apply AI-powered adjustments to an image using Gemini 2.5 Flash Image Preview.
    
    This endpoint processes images with global adjustments based on natural language prompts.
    Examples: "make brighter", "increase contrast", "warmer colors", "more vibrant", etc.
    
    Args:
        request: ImageAdjustmentRequest containing image data and adjustment prompt
        image_processing_service: Injected ImageProcessingService
        
    Returns:
        ImageAdjustmentResponse: Adjusted image data with metadata
        
    Raises:
        HTTPException: If processing fails
    """
    try:
        # Validate input
        if not request.image_base64:
            raise HTTPException(
                status_code=400,
                detail="Image data is required"
            )
            
        if not request.adjustment_prompt.strip():
            raise HTTPException(
                status_code=400,
                detail="Adjustment prompt is required"
            )
        
        # Apply adjustment using the service
        adjustment_result = await image_processing_service.apply_adjustment(
            image_base64=request.image_base64,
            mime_type=request.mime_type,
            adjustment_prompt=request.adjustment_prompt
        )
        
        # Validate the response structure
        validated = ImageAdjustmentResponse(**adjustment_result)
        
        # Return as plain JSON dict to ensure mutability on frontend
        return JSONResponse(content=validated.model_dump(mode='json'))
        
    except ValueError as e:
        raise HTTPException(
            status_code=422,
            detail=f"Validation error: {str(e)}"
        )
    except Exception as e:
        # Log the error for debugging
        import traceback
        print(f"Adjustment application error: {str(e)}")
        print(traceback.format_exc())
        
        raise HTTPException(
            status_code=500,
            detail=f"Error applying adjustment: {str(e)}"
        )



@router.get("/health")
async def image_processing_health_check():
    """Health check endpoint for image processing service"""
    try:
        # Check if Vertex AI is configured
        vertex_ai_configured = Config.is_configured()
        
        if not vertex_ai_configured:
            return {
                "status": "unhealthy",
                "message": "Vertex AI not configured",
                "vertex_ai_configured": False
            }
        
        # Try to initialize the service
        service = ImageProcessingService()
        
        return {
            "status": "healthy",
            "message": "Image processing service is ready",
            "vertex_ai_configured": True
        }
        
    except Exception as e:
        return {
            "status": "unhealthy",
            "message": f"Service initialization failed: {str(e)}",
            "vertex_ai_configured": Config.is_configured()
        }