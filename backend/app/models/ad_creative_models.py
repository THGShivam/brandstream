"""
Pydantic models for ad creative evaluation and generation
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict


class AdCreativeEvaluationResponse(BaseModel):
    """Response model for ad creative evaluation"""
    model_config = ConfigDict(frozen=False)

    conversion_score: float = Field(..., ge=1.0, le=10.0, description="Conversion potential score from 1.0-10.0")
    retention_score: float = Field(..., ge=1.0, le=10.0, description="Retention potential score from 1.0-10.0")
    traffic_score: float = Field(..., ge=1.0, le=10.0, description="Traffic generation potential score from 1.0-10.0")
    engagement_score: float = Field(..., ge=1.0, le=10.0, description="Engagement potential score from 1.0-10.0")


class AdCreativeInput(BaseModel):
    """Input model for ad creative evaluation"""
    evaluation_criteria: str = Field(..., description="Criteria for evaluating the ad creative")
    ad_creative: str = Field(..., description="Description or context of the ad creative")


# Models for Creative Generation

class FieldValue(BaseModel):
    """Standard field with value and source"""
    model_config = ConfigDict(frozen=False)

    value: Any
    source: str


class ProjectObjectives(BaseModel):
    """Project objectives with nested fields"""
    model_config = ConfigDict(frozen=False)

    business_objective: FieldValue
    marketing_objective: FieldValue
    communication_objective: FieldValue
    key_metrics: Optional[FieldValue] = None
    key_indicators: Optional[FieldValue] = None


class TargetAudience(BaseModel):
    """Target audience with nested fields"""
    model_config = ConfigDict(frozen=False)

    demographics: FieldValue
    psychographics: FieldValue
    needs_problems: FieldValue
    decision_behaviour: FieldValue


class BriefData(BaseModel):
    """Brief analysis data from frontend"""
    model_config = ConfigDict(frozen=False)

    brand_name: FieldValue
    campaign_title: FieldValue
    brief_summary: FieldValue
    project_objectives: ProjectObjectives
    target_audience: TargetAudience
    key_message: FieldValue
    visual_style: FieldValue
    channels: FieldValue
    usp: FieldValue


class CreativeGenerationRequest(BaseModel):
    """Request model for creative generation - accepts only brief data"""
    model_config = ConfigDict(frozen=False)

    brief_data: BriefData


class AdCreativePrompt(BaseModel):
    """Individual ad creative prompt"""
    model_config = ConfigDict(frozen=False)

    prompt: str = Field(..., description="The generated prompt for asset creation")
    description: str = Field(..., description="Description of what this prompt will generate")


class CreativeGenerationResponse(BaseModel):
    """Response model for creative generation - returns editable prompts"""
    model_config = ConfigDict(frozen=False)

    image_prompt: str = Field(..., description="Prompt for image generation")
    copy_prompt: str = Field(..., description="Prompt for copy/script generation")
    video_prompt: str = Field(..., description="Prompt for video generation")


# Models for Asset Generation

class CreativityLevel(str):
    """Creativity level for asset generation"""
    CONSERVATIVE = "conservative"
    BALANCED = "balanced"
    CREATIVE = "creative"
    EXPERIMENTAL = "experimental"


class ImageGenerationConfig(BaseModel):
    """Configuration for image generation"""
    model_config = ConfigDict(frozen=False)

    prompt: str = Field(..., description="Image generation prompt")
    num_variations: int = Field(..., ge=1, le=5, description="Number of image variations to generate")
    creativity_level: str = Field(..., description="Creativity level: conservative, balanced, creative, experimental")
    model_name: str = Field(default="imagen-3.0-generate-001", description="Imagen model: imagen-3.0-generate-001 or imagen-4.0-generate-001")
    image_size: str = Field(default="1024x1024", description="Image size for generation")


class AssetGenerationRequest(BaseModel):
    """Request model for asset generation"""
    model_config = ConfigDict(frozen=False)

    image_config: Optional[ImageGenerationConfig] = None
    # copy_config and video_config will be added later


class GeneratedImage(BaseModel):
    """Generated image data"""
    model_config = ConfigDict(frozen=False)

    image_base64: str = Field(..., description="Base64 encoded image data")
    variation_number: int = Field(..., description="Variation number (1-based)")
    mime_type: str = Field(default="image/png", description="MIME type of the image")


class GeneratedVideo(BaseModel):
    """Generated video data"""
    model_config = ConfigDict(frozen=False)

    video_base64: Optional[str] = Field(None, description="Base64 encoded video data")
    video_url: Optional[str] = Field(None, description="URL to the video (e.g., GCS signed URL)")
    mime_type: str = Field(default="video/mp4", description="MIME type of the video")
    duration_seconds: Optional[float] = Field(None, description="Video duration in seconds")


class GeneratedCopy(BaseModel):
    """Generated copy/script data"""
    model_config = ConfigDict(frozen=False)

    headline: str = Field(..., description="Ad headline")
    body_text: str = Field(..., description="Main ad copy/body text")
    call_to_action: str = Field(..., description="Call to action text")
    variation_number: int = Field(..., description="Variation number (1-based)")


class VideoGenerationConfig(BaseModel):
    """Configuration for video generation"""
    model_config = ConfigDict(frozen=False)

    prompt: str = Field(..., description="Video generation prompt")
    creativity_level: str = Field(..., description="Creativity level: conservative, balanced, creative, experimental")
    model_name: str = Field(default="veo-3.0-generate-001", description="Veo model version")
    duration_seconds: int = Field(default=5, ge=3, le=8, description="Video duration in seconds")


class CopyGenerationConfig(BaseModel):
    """Configuration for copy generation"""
    model_config = ConfigDict(frozen=False)

    prompt: str = Field(..., description="Copy generation prompt")
    num_variations: int = Field(..., ge=1, le=5, description="Number of copy variations to generate")
    creativity_level: str = Field(..., description="Creativity level: conservative, balanced, creative, experimental")
    model_name: str = Field(default="gemini-2.0-flash-001", description="Gemini model version")


class AssetGenerationResponse(BaseModel):
    """Response model for asset generation"""
    model_config = ConfigDict(frozen=False)

    images: Optional[List[GeneratedImage]] = None
    video: Optional[GeneratedVideo] = None
    copy_variations: Optional[List[GeneratedCopy]] = None
