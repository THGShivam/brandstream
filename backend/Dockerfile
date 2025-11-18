# Use Python 3.12 as base image (3.14 not yet available in official images)
FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Install uv for faster package installation
RUN pip install uv

# Copy dependency files
COPY pyproject.toml uv.lock ./

# Install dependencies using uv
RUN uv pip install --system -r pyproject.toml

# Copy application code
COPY . .

# Expose port
EXPOSE 8080

# Set environment variables for Cloud Run
ENV PORT=8080
ENV PYTHONUNBUFFERED=1

# Run the application
CMD exec uvicorn main:app --host 0.0.0.0 --port ${PORT}