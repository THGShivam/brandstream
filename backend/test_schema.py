import json
from app.models.brief_models import BriefAnalysisResponse

# Check what the schema looks like
schema = BriefAnalysisResponse.model_json_schema()
print("Generated schema:")
print(json.dumps(schema, indent=2))

# Check if $defs is present
if '$defs' in schema:
    print("\n$defs found in schema:")
    print(json.dumps(schema['$defs'], indent=2))