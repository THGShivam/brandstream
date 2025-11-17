"""
API routes for ad creative evaluation and generation
"""
from fastapi import APIRouter, File, UploadFile, Form, HTTPException, Depends
from fastapi.responses import JSONResponse

from app.models.ad_creative_models import (
    AdCreativeEvaluationResponse,
    CreativeGenerationRequest,
    CreativeGenerationResponse,
    ImageGenerationConfig,
    VideoGenerationConfig,
    CopyGenerationConfig,
    AssetGenerationResponse,
    GeneratedImage
)
from app.services.ad_creative_service import AdCreativeService
from app.services.asset_generation_service import AssetGenerationService
from app.config import Config


router = APIRouter(prefix="/api", tags=["ad-creative"])


def get_ad_creative_service() -> AdCreativeService:
    """Dependency to get AdCreativeService instance"""
    if not Config.is_configured():
        raise HTTPException(
            status_code=500,
            detail="Vertex AI not configured. Please set SERVICE_ACCOUNT_JSON and PROJECT_ID environment variables."
        )
    return AdCreativeService()


def get_asset_generation_service() -> AssetGenerationService:
    """Dependency to get AssetGenerationService instance"""
    if not Config.is_configured():
        raise HTTPException(
            status_code=500,
            detail="Vertex AI not configured. Please set SERVICE_ACCOUNT_JSON and PROJECT_ID environment variables."
        )
    return AssetGenerationService()


@router.post("/evaluate-ad-creative", response_model=AdCreativeEvaluationResponse)
async def evaluate_ad_creative(
    image: UploadFile = File(..., description="The generated ad creative image to evaluate"),
    image_prompt: str = Form(..., description="The prompt used to generate this image"),
    ad_creative_service: AdCreativeService = Depends(get_ad_creative_service)
):
    """
    Evaluate a generated ad creative image using Gemini 2.5 Pro.

    Accepts:
    - A generated image file (the ad creative)
    - The prompt that was used to generate the image

    Returns scores for conversion, retention, traffic, and engagement (0-10 scale).

    Args:
        image: The generated ad creative image file
        image_prompt: The prompt used to generate this image
        ad_creative_service: Injected AdCreativeService

    Returns:
        AdCreativeEvaluationResponse: Scores for conversion, retention, traffic, and engagement

    Raises:
        HTTPException: If processing fails
    """
    # Validate image file
    supported_image_types = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "image/gif"
    ]

    if image.content_type not in supported_image_types:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported image type: {image.content_type}. Supported types: JPEG, PNG, WebP, GIF"
        )

    try:
        # Read the image file
        image_data = await image.read()

        if not image_data:
            raise HTTPException(
                status_code=400,
                detail="Image file is empty"
            )

        # Evaluate the ad creative using the service
        evaluation_result = await ad_creative_service.evaluate_generated_image(
            image_data=image_data,
            image_mime_type=image.content_type,
            image_prompt=image_prompt
        )

        # Validate the response structure
        validated = AdCreativeEvaluationResponse(**evaluation_result)

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
            detail=f"Error evaluating ad creative: {str(e)}"
        )


@router.post("/generate-creative", response_model=CreativeGenerationResponse)
async def generate_creative_prompts(
    request: CreativeGenerationRequest,
    ad_creative_service: AdCreativeService = Depends(get_ad_creative_service)
):
    """
    Generate creative prompts for image, copy, and video generation.

    Accepts:
    - Brief data from the analyzed creative brief
    - Generation settings (creativity level, variations, etc.)

    Returns structured creative prompts for each asset type.

    Args:
        request: Creative generation request with brief data and settings
        ad_creative_service: Injected AdCreativeService

    Returns:
        CreativeGenerationResponse: Prompts for image, copy, and video generation

    Raises:
        HTTPException: If generation fails
    """
    try:
        # Debug: Print the incoming request
        print(f"Received request type: {type(request)}")
        print(f"Request brief_data type: {type(request.brief_data)}")

        # Generate creative prompts using the service
        generation_result = await ad_creative_service.generate_creative_prompts(request)

        # Validate the response structure
        validated = CreativeGenerationResponse(**generation_result)

        # Return as plain JSON dict to ensure mutability on frontend
        return JSONResponse(content=validated.model_dump(mode='json'))

    except ValueError as e:
        import traceback
        print(f"ValueError: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=422,
            detail=str(e)
        )
    except Exception as e:
        import traceback
        print(f"Exception: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Error generating creative prompts: {str(e)}"
        )


@router.post("/generate-assets", response_model=AssetGenerationResponse)
async def generate_assets(
    product_sku: UploadFile = File(..., description="Product SKU image"),
    # Image generation parameters
    image_prompt: str = Form(None, description="Image generation prompt"),
    image_variations: int = Form(None, ge=1, le=5, description="Number of image variations"),
    image_model: str = Form("Imagen 3", description="Image model: Imagen 3 or Imagen 4"),
    # Video generation parameters
    video_prompt: str = Form(None, description="Video generation prompt"),
    video_model: str = Form("Veo 3", description="Video model: Veo 3"),
    video_duration: int = Form(5, ge=3, le=8, description="Video duration in seconds"),
    # Copy generation parameters
    copy_prompt: str = Form(None, description="Copy generation prompt"),
    copy_variations: int = Form(None, ge=1, le=5, description="Number of copy variations"),
    copy_model: str = Form("Gemini 2.0 Flash", description="Copy model"),
    # Common parameters
    creativity_level: str = Form(None, description="Creativity level: conservative, balanced, creative, experimental"),
    brief_context: str = Form(None, description="Brief context for copy generation"),
    asset_generation_service: AssetGenerationService = Depends(get_asset_generation_service)
):
    """
    Generate creative assets (images, copy, video) based on prompts and product SKU.

    Currently supports:
    - Image generation using Imagen 3

    Accepts:
    - Product SKU image (required)
    - Image generation prompt and settings (optional)

    Returns generated asset URLs.

    Args:
        product_sku: Product SKU image file
        image_prompt: Prompt for image generation
        image_variations: Number of image variations to generate (1-5)
        creativity_level: Creativity level for generation
        asset_generation_service: Injected AssetGenerationService

    Returns:
        AssetGenerationResponse: Generated assets with URLs

    Raises:
        HTTPException: If generation fails
    """
    # Validate product SKU image
    supported_image_types = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp"
    ]

    if product_sku.content_type not in supported_image_types:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported image type: {product_sku.content_type}. Supported types: JPEG, PNG, WebP"
        )

    try:
        # Read the product SKU image
        sku_image_data = await product_sku.read()

        if not sku_image_data:
            raise HTTPException(
                status_code=400,
                detail="Product SKU image file is empty"
            )

        # Prepare configs for generation
        img_config = None
        vid_config = None
        cp_config = None

        # Image generation config
        if image_prompt and image_variations and creativity_level:
            model_name_mapping = {
                "Imagen 3": "imagen-3.0-generate-001",
                "Imagen 4": "imagen-4.0-generate-001"
            }
            model_name = model_name_mapping.get(image_model, "imagen-3.0-generate-001")

            img_config = ImageGenerationConfig(
                prompt=image_prompt,
                num_variations=image_variations,
                creativity_level=creativity_level,
                model_name=model_name,
                image_size="1024x1024"
            )

        # Video generation config
        if video_prompt and creativity_level:
            video_model_mapping = {
                "Veo 3": "veo-3.1-generate-preview"
            }
            vid_model_name = video_model_mapping.get(video_model, "veo-3.1-generate-preview")

            vid_config = VideoGenerationConfig(
                prompt=video_prompt,
                creativity_level=creativity_level,
                model_name=vid_model_name,
                duration_seconds=video_duration
            )

        # Copy generation config
        if copy_prompt and copy_variations and creativity_level:
            copy_model_mapping = {
                "Gemini 2.0 Flash": "gemini-2.0-flash-001",
                "Gemini 1.5 Pro": "gemini-1.5-pro-002"
            }
            cp_model_name = copy_model_mapping.get(copy_model, "gemini-2.0-flash-001")

            cp_config = CopyGenerationConfig(
                prompt=copy_prompt,
                num_variations=copy_variations,
                creativity_level=creativity_level,
                model_name=cp_model_name
            )

        # Generate all assets in parallel
        print(f"🚀 Starting parallel generation...")
        generated_assets = await asset_generation_service.generate_assets(
            image_config=img_config,
            video_config=vid_config,
            copy_config=cp_config,
            product_sku_image=sku_image_data,
            brief_context=brief_context
        )

        # Validate the response structure
        validated = AssetGenerationResponse(**generated_assets)

        # Return as plain JSON dict
        return JSONResponse(content=validated.model_dump(mode='json'))

    except ValueError as e:
        import traceback
        print(f"ValueError: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=422,
            detail=str(e)
        )
    except Exception as e:
        import traceback
        print(f"Exception: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Error generating assets: {str(e)}"
        )
