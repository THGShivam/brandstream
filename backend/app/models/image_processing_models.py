"""
Pydantic models for image processing API
"""
from pydantic import BaseModel, Field
from typing import Optional


class ImageFilterRequest(BaseModel):
    """Request model for image filter endpoint"""
    image_base64: str = Field(..., description="Base64 encoded image data")
    mime_type: str = Field(..., description="MIME type of the image")
    filter_prompt: str = Field(..., description="Text prompt describing the desired filter effect")


class ImageFilterResponse(BaseModel):
    """Response model for image filter endpoint"""
    filtered_image_base64: str = Field(..., description="Base64 encoded filtered image")
    mime_type: str = Field(..., description="MIME type of the filtered image")
    filter_applied: str = Field(..., description="Description of the filter that was applied")


class ImageAdjustmentRequest(BaseModel):
    """Request model for image adjustment endpoint"""
    image_base64: str = Field(..., description="Base64 encoded image data")
    mime_type: str = Field(..., description="MIME type of the image")
    adjustment_prompt: str = Field(..., description="Text prompt describing the desired adjustment")


class ImageAdjustmentResponse(BaseModel):
    """Response model for image adjustment endpoint"""
    adjusted_image_base64: str = Field(..., description="Base64 encoded adjusted image")
    mime_type: str = Field(..., description="MIME type of the adjusted image")
    adjustment_applied: str = Field(..., description="Description of the adjustment that was applied")


class ImageProcessingError(BaseModel):
    """Error response model for image processing"""
    error: str = Field(..., description="Error message")
    detail: Optional[str] = Field(None, description="Detailed error information")