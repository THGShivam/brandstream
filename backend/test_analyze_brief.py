"""
Test script for the analyze-brief endpoint
"""
import asyncio
from app.config import Config
from app.services.gemini_service import GeminiService
from app.models.brief_models import BriefAnalysisResponse


# Ensure config is initialized
Config.initialize_vertex_ai()


async def test_brief_analysis():
    """Test the brief analysis with sample text"""

    sample_brief = """
    Brand: MyProtein
    Campaign: Whey Too Spooky

    We are launching a limited-edition chocolate-orange protein bar for Halloween.
    The goal is to drive product trial and create buzz around this seasonal flavor.

    Target Audience: Ages 18-34, urban fitness enthusiasts, active on social media

    Key Message: Get Fit, Get Spooky

    Visual Style: Dark, playful Halloween theme with gym atmosphere

    Channels: Instagram, YouTube

    We want to work with fitness influencers to create Halloween-themed content
    that showcases the product in fun, festive ways.
    """

    print("Testing Creative Brief Analysis...")
    print("=" * 60)
    print("\nInput Brief:")
    print(sample_brief)
    print("\n" + "=" * 60)

    try:
        gemini_service = GeminiService()
        result = await gemini_service.analyze_creative_brief(sample_brief)

        print("\n✅ Analysis Complete!")
        print("\n" + "=" * 60)
        print("Structured Output:")
        print("=" * 60)

        # Create response model to validate structure
        response = BriefAnalysisResponse(**result)

        # Pretty print key fields
        print(f"\n📌 Brand: {response.brand_name.value} ({response.brand_name.source})")
        print(f"📌 Campaign: {response.campaign_title.value} ({response.campaign_title.source})")
        print(f"\n📝 Summary: {response.brief_summary.value}")
        print(f"   Source: {response.brief_summary.source}")

        print("\n🎯 Project Objectives:")
        print(f"   Business: {response.project_objectives.business_objective.value}")
        print(f"   Marketing: {response.project_objectives.marketing_objective.value}")
        print(f"   Communication: {response.project_objectives.communication_objective.value}")

        print("\n👥 Target Audience:")
        print(f"   Demographics: {response.target_audience.demographics.value}")
        print(f"   Psychographics: {response.target_audience.psychographics.value}")

        print(f"\n💬 Key Message: {response.key_message.value} ({response.key_message.source})")
        print(f"🎨 Visual Style: {response.visual_style.value} ({response.visual_style.source})")
        print(f"📱 Channels: {', '.join(response.channels.value)} ({response.channels.source})")
        print(f"⭐ USP: {response.usp.value} ({response.usp.source})")

        if response.missing_fields:
            print(f"\n⚠️  Missing Fields: {', '.join(response.missing_fields)}")

        print("\n" + "=" * 60)
        print("✅ Test Passed! Response validated successfully.")

    except Exception as e:
        print(f"\n❌ Test Failed: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(test_brief_analysis())
