"""
Pydantic models for translation service
"""
from pydantic import BaseModel, Field


class CopyInput(BaseModel):
    """Structured copy input with headline, body_text, and call_to_action"""
    headline: str = Field(..., description="Headline text")
    body_text: str = Field(..., description="Body text content")
    call_to_action: str = Field(..., description="Call to action text")


class TranslationRequest(BaseModel):
    """Request model for translation"""
    copy_text: CopyInput = Field(..., description="Structured copy text to be translated")
    target_language: str = Field(..., description="Target language for translation (e.g., 'Spanish', 'French', 'German')")


class TranslatedCopy(BaseModel):
    """Translated copy structure"""
    headline: str = Field(..., description="Translated headline")
    body_text: str = Field(..., description="Translated body text")
    call_to_action: str = Field(..., description="Translated call to action")


class TranslationResponse(BaseModel):
    """Response model for translation"""
    translated_copy: TranslatedCopy = Field(..., description="The translated copy with structure maintained")
    translated_to: str = Field(..., description="The language the text was translated to")
