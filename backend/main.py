"""
Brandstreams Backend API
Main application entry point
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Import modular components
from app.config import Config
from app.routers import brief_router, ad_creative_router, translation_router
from app.routers import brief_router, ad_creative_router, image_processing_router

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title=Config.API_TITLE,
    description=Config.API_DESCRIPTION,
    version=Config.API_VERSION
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(brief_router.router)
app.include_router(ad_creative_router.router)
app.include_router(translation_router.router)
app.include_router(image_processing_router.router)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to Brandstreams API",
        "status": "running",
        "version": Config.API_VERSION
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    vertex_ai_configured = Config.is_configured()
    return {
        "status": "healthy",
        "vertex_ai_configured": vertex_ai_configured
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
