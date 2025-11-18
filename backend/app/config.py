"""
Configuration management for the application
"""
import os
import json
import tempfile
from dotenv import load_dotenv
import vertexai

# Load environment variables
load_dotenv()


class Config:
    """Application configuration"""

    # Vertex AI Configuration
    SERVICE_ACCOUNT_JSON = os.getenv("SERVICE_ACCOUNT_JSON", "")
    PROJECT_ID = os.getenv("PROJECT_ID", "")
    LOCATION = os.getenv("LOCATION", "us-central1")

    # Gemini API Configuration
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

    # API Configuration
    API_TITLE = "Brandstreams API"
    API_DESCRIPTION = "Creative brief analysis and ad creative evaluation API"
    API_VERSION = "0.2.0"

    @classmethod
    def initialize_vertex_ai(cls):
        """Initialize Vertex AI with service account credentials or ADC"""
        if not cls.PROJECT_ID:
            print("Warning: PROJECT_ID not configured")
            return False

        try:
            # If running on Cloud Run (or GCP), use Application Default Credentials
            # Otherwise, use SERVICE_ACCOUNT_JSON from .env for local development
            if cls.SERVICE_ACCOUNT_JSON:
                # Validate JSON
                json.loads(cls.SERVICE_ACCOUNT_JSON)

                # Create temporary credentials file
                with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.json') as temp_file:
                    temp_file.write(cls.SERVICE_ACCOUNT_JSON)
                    credentials_path = temp_file.name

                # Set credentials
                os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = credentials_path
                print("Using service account from environment variable")
            else:
                print("Using Application Default Credentials (ADC)")

            # Initialize Vertex AI
            vertexai.init(project=cls.PROJECT_ID, location=cls.LOCATION)
            print(f"Vertex AI initialized with project: {cls.PROJECT_ID}")
            return True

        except json.JSONDecodeError:
            print("Error: SERVICE_ACCOUNT_JSON is not valid JSON")
            return False
        except Exception as e:
            print(f"Error initializing Vertex AI: {str(e)}")
            return False

    @classmethod
    def is_configured(cls) -> bool:
        """Check if required configuration is available"""
        return bool(cls.PROJECT_ID)


# Initialize Vertex AI on module import
Config.initialize_vertex_ai()
