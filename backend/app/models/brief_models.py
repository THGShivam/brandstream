"""
Pydantic models for creative brief analysis
"""
from typing import List, Literal, Optional
from pydantic import BaseModel, Field, ConfigDict


class FieldValue(BaseModel):
    """Represents a field with its value and source"""
    model_config = ConfigDict(frozen=False)

    value: str | List[str]
    source: Literal["extracted", "generated"]


class ProjectObjectives(BaseModel):
    """Project objectives section"""
    model_config = ConfigDict(frozen=False)

    business_objective: FieldValue
    marketing_objective: FieldValue
    communication_objective: FieldValue
    key_metrics: FieldValue
    key_indicators: FieldValue


class TargetAudience(BaseModel):
    """Target audience section"""
    model_config = ConfigDict(frozen=False)

    demographics: FieldValue
    psychographics: FieldValue
    needs_problems: FieldValue
    decision_behaviour: FieldValue


class BriefAnalysisResponse(BaseModel):
    """Response model for creative brief analysis"""
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


class BriefTextInput(BaseModel):
    """Model for text-based brief input"""
    text: str = Field(..., description="Creative brief text content")
