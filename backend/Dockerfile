# ===== Build Stage =====
FROM python:3.10-slim as builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Poetry
RUN pip install poetry

# Configure Poetry to create a virtual environment
RUN poetry config virtualenvs.create true
RUN poetry config virtualenvs.in-project true

# Copy dependency files
COPY pyproject.toml poetry.lock* ./

# Update lock file first (since we changed pyproject.toml)
RUN poetry lock

# Install dependencies to the isolated virtual environment
RUN poetry install --only=main --no-root


# ===== Runtime Stage =====
FROM python:3.10-slim

WORKDIR /app

# Install runtime dependencies AND ffmpeg
# ffmpeg is crucial for audio format conversion (webm -> wav)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Copy virtual environment from builder stage
COPY --from=builder /app/.venv /app/.venv

# Copy application code
COPY . .

# Tell Python to also look for modules in the /app/src directory
ENV PYTHONPATH="${PYTHONPATH}:/app/src"
# Use the virtual environment
ENV PATH="/app/.venv/bin:$PATH"

# Expose the port the app runs on
EXPOSE 8000

# This command will now work because PYTHONPATH points to the src directory
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8001"]