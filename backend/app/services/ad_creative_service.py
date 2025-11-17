"""
Service for ad creative evaluation and generation using Gemini AI
"""
import json
from typing import Dict, Any
from vertexai.generative_models import GenerativeModel, Part

from app.prompts import PromptLoader
from app.models.ad_creative_models import (
    AdCreativeEvaluationResponse,
    CreativeGenerationResponse,
    CreativeGenerationRequest
)


class AdCreativeService:
    """Service for evaluating and generating ad creatives using Gemini AI"""

    def __init__(self):
        self.model_name = 'gemini-2.5-pro'
        self.model = None

    def _get_model(self) -> GenerativeModel:
        """Lazy load the model when needed"""
        if self.model is None:
            self.model = GenerativeModel(self.model_name)
        return self.model

    def _get_creativity_label(self, level: int) -> str:
        """Convert creativity level to label"""
        if level <= 25:
            return "Conservative"
        elif level <= 50:
            return "Balanced"
        elif level <= 75:
            return "Creative"
        else:
            return "Experimental"

    async def evaluate_generated_image(
        self,
        image_data: bytes,
        image_mime_type: str,
        image_prompt: str
    ) -> Dict[str, Any]:
        """
        Evaluate a generated ad creative image using Gemini 2.5 Pro

        Args:
            image_data: The image file bytes
            image_mime_type: MIME type of the image
            image_prompt: The prompt used to generate this image

        Returns:
            Dictionary with conversion_score, retention_score, traffic_score, and engagement_score (0-10)

        Raises:
            ValueError: If evaluation fails
        """
        # Create evaluation prompt
        evaluation_prompt = f"""You are an expert ad creative evaluator. Analyze the generated ad creative image based on the prompt that was used to create it.

Generation Prompt: {image_prompt}

Evaluate the image on the following criteria and provide scores as decimal numbers from 1.0 to 10.0 (one decimal place):

1. **Conversion Score (1.0-10.0)**: How likely is this ad to drive conversions (purchases, sign-ups, etc.)? Consider:
   - Clear value proposition
   - Strong call-to-action visual cues
   - Persuasive elements
   - Trust signals

2. **Retention Score (1.0-10.0)**: How well does this ad support brand retention and loyalty? Consider:
   - Brand consistency
   - Memorable visual elements
   - Emotional connection
   - Brand recognition

3. **Traffic Score (1.0-10.0)**: How effective is this ad at driving traffic (clicks, visits)? Consider:
   - Visual appeal and stopping power
   - Clarity of offering
   - Curiosity generation
   - Click-worthiness

4. **Engagement Score (1.0-10.0)**: How likely is this ad to generate engagement (likes, shares, comments)? Consider:
   - Shareability
   - Emotional impact
   - Visual creativity
   - Relatability

Return ONLY a JSON object with these exact fields (scores must be decimal numbers from 1.0 to 10.0):
{{
  "conversion_score": <number 1.0-10.0>,
  "retention_score": <number 1.0-10.0>,
  "traffic_score": <number 1.0-10.0>,
  "engagement_score": <number 1.0-10.0>
}}"""

        try:
            model = self._get_model()

            # Prepare the image part
            image_part = Part.from_data(data=image_data, mime_type=image_mime_type)

            # Generate evaluation using Gemini 2.5 Pro
            response = model.generate_content(
                [evaluation_prompt, image_part],
                generation_config={
                    "response_mime_type": "application/json",
                    "temperature": 0.2  # Lower temperature for consistent scoring
                }
            )

            # Parse and validate the response
            evaluation_result = json.loads(response.text)

            # Validate the result has the required fields
            required_fields = ["conversion_score", "retention_score", "traffic_score", "engagement_score"]
            if not all(key in evaluation_result for key in required_fields):
                raise ValueError(f"Generated response missing required fields. Got: {list(evaluation_result.keys())}")

            # Ensure scores are floats and within range (1.0 to 10.0)
            for field in required_fields:
                score = evaluation_result[field]
                if not isinstance(score, (int, float)):
                    raise ValueError(f"{field} must be a number")
                # Clamp between 1.0 and 10.0, round to 1 decimal place
                evaluation_result[field] = round(min(10.0, max(1.0, float(score))), 1)

            return evaluation_result

        except Exception as e:
            raise ValueError(f"Error evaluating ad creative: {str(e)}")

    async def generate_creative_prompts(
        self,
        request
    ) -> Dict[str, Any]:
        """
        Generate creative prompts for image, copy, and video generation from brief data only

        Args:
            request: Creative generation request with brief data

        Returns:
            Dictionary with image_prompt, copy_prompt, and video_prompt (all strings)

        Raises:
            ValueError: If generation fails
        """
        try:
            # Get brief_data - should be a BriefData Pydantic model
            brief = request.brief_data

            # Debug: Print the brief data
            print(f"Brief type: {type(brief)}")
            print(f"Brief brand_name: {brief.brand_name}")
            print(f"Brief brand_name type: {type(brief.brand_name)}")
            print(f"Brief brand_name.value: {brief.brand_name.value}")
            print(f"Brief brand_name.value type: {type(brief.brand_name.value)}")

            # Extract channels as comma-separated string
            channels_value = brief.channels.value
            channels_str = ', '.join(channels_value) if isinstance(channels_value, list) else str(channels_value)

            # Load prompt template with all the brief data
            prompt = PromptLoader.load(
                "creative_generation",
                # Brand and campaign info
                brand_name=brief.brand_name.value,
                campaign_title=brief.campaign_title.value,
                brief_summary=brief.brief_summary.value,
                # Objectives
                business_objective=brief.project_objectives.business_objective.value,
                marketing_objective=brief.project_objectives.marketing_objective.value,
                communication_objective=brief.project_objectives.communication_objective.value,
                # Target audience
                demographics=brief.target_audience.demographics.value,
                psychographics=brief.target_audience.psychographics.value,
                needs_problems=brief.target_audience.needs_problems.value,
                decision_behaviour=brief.target_audience.decision_behaviour.value,
                # Creative elements
                key_message=brief.key_message.value,
                visual_style=brief.visual_style.value,
                channels=channels_str,
                usp=brief.usp.value
            )
        except AttributeError as e:
            raise ValueError(f"Invalid brief data structure: {str(e)}")

        print(prompt)

        try:
            model = self._get_model()
            print(model)

            # Let Gemini generate free-form JSON based on prompt instructions
            # The prompt already specifies the exact JSON format needed
            response = model.generate_content(
                prompt,
                generation_config={
                    "response_mime_type": "application/json"
                }
            )

            # Parse and validate the response
            generation_result = json.loads(response.text)

            # Validate the result has the required fields
            if not all(key in generation_result for key in ["image_prompt", "copy_prompt", "video_prompt"]):
                raise ValueError(f"Generated response missing required fields. Got: {list(generation_result.keys())}")

            return generation_result

        except Exception as e:
            raise ValueError(f"Error generating creative prompts: {str(e)}")
