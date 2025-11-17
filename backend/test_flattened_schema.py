import json
from app.models.brief_models import BriefAnalysisResponse
from app.services.gemini_service import GeminiService

# Test the schema flattening
service = GeminiService()
original_schema = BriefAnalysisResponse.model_json_schema()
flattened_schema = service._flatten_schema(original_schema)

print("Original schema has $defs:", '$defs' in original_schema)
print("Flattened schema has $defs:", '$defs' in flattened_schema)

print("\nFlattened schema:")
print(json.dumps(flattened_schema, indent=2))