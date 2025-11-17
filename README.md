# Brandstreams POC

A full-stack application for AI-powered brand creative analysis and generation using Google Vertex AI.

## Project Structure

```
Brandstreams Poc/
├── backend/          # FastAPI backend server
├── frontend/         # Next.js frontend application
├── .gitignore
└── README.md
```

## Prerequisites

Before you begin, ensure you have the following installed:

- **Python 3.14** or higher
- **Node.js 18** or higher
- **npm** or **yarn**
- **Git**
- **Google Cloud credentials** (for Vertex AI)

## Backend Setup

### 1. Navigate to Backend Directory

```bash
cd backend
```

### 2. Create Python Virtual Environment

```bash
python3 -m venv .venv
```

### 3. Activate Virtual Environment

**macOS/Linux:**
```bash
source .venv/bin/activate
```

**Windows:**
```bash
.venv\Scripts\activate
```

### 4. Install Dependencies

 using uv
```bash
uv pip install -r pyproject.toml
```

### 5. Configure Environment Variables

Create a `.env` file in the `backend/` directory:

```bash
cp .env.example .env  # if example exists, or create manually
```

Add the following variables to `.env`:

```env
# Google Cloud / Vertex AI Configuration
SERVICE_ACCOUNT_JSON=service_account.json
PROJECT_ID=your-project-id
LOCATION=your-location
GEMINI_API_KEY=your-gemini-api-key  

# API Configuration
API_TITLE=Brandstreams API
API_DESCRIPTION=AI-powered brand creative analysis
API_VERSION=1.0.0
```

### 6. Run Backend Server

```bash
python main.py
```

Or using uvicorn directly:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The backend API will be available at: **http://localhost:8000**

API Documentation (Swagger): **http://localhost:8000/docs**

## Frontend Setup

### 1. Navigate to Frontend Directory

```bash
cd frontend
```

### 2. Install Dependencies

Using npm:
```bash
npm install
```

Using yarn:
```bash
yarn install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the `frontend/` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 4. Run Development Server

Using npm:
```bash
npm run dev
```

Using yarn:
```bash
yarn dev
```

The frontend application will be available at: **http://localhost:3000**

## Running Both Frontend and Backend

### Option 1: Using Separate Terminals

**Terminal 1 - Backend:**
```bash
cd backend
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
python main.py
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Option 2: Using Background Process

**macOS/Linux:**
```bash
# Start backend in background
cd backend && source .venv/bin/activate && python main.py &

# Start frontend
cd ../frontend && npm run dev
```

## Available Scripts

### Backend

- `python main.py` - Start the development server with auto-reload
- `uvicorn main:app --reload` - Alternative way to start the server
- `pytest` - Run tests (if configured)

### Frontend

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## API Endpoints

- `GET /` - Welcome message
- `GET /health` - Health check endpoint
- `POST /analyze-brief` - Analyze brand brief
- `POST /generate-creatives` - Generate ad creatives
- `POST /evaluate-creatives` - Evaluate ad creatives

For complete API documentation, visit: **http://localhost:8000/docs**

## Tech Stack

### Backend
- FastAPI
- Python 3.14
- Google Vertex AI / Generative AI
- Pydantic
- Uvicorn

### Frontend
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Redux Toolkit
- Radix UI Components

## Troubleshooting

### Backend Issues

**Port already in use:**
```bash
# Find and kill process on port 8000
lsof -ti:8000 | xargs kill -9
```

**Python version mismatch:**
```bash
python --version  # Check your Python version
```

**Vertex AI authentication errors:**
- Ensure `GOOGLE_APPLICATION_CREDENTIALS` points to valid credentials
- Check that the service account has necessary permissions

### Frontend Issues

**Port 3000 already in use:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

**Module not found errors:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**API connection errors:**
- Verify backend is running on port 8000
- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Ensure CORS is properly configured in backend

## Development Workflow

1. Start the backend server first
2. Start the frontend development server
3. Make changes to code (hot reload enabled)
4. Test endpoints using Swagger UI at `/docs`
5. Test UI at `http://localhost:3000`

## Production Build

### Backend
```bash
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Frontend
```bash
cd frontend
npm run build
npm run start
```

## License

[Add your license here]

## Contributors

[Add contributors here]
