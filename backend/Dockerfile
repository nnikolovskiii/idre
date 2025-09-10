FROM python:3.10-slim

WORKDIR /app

# Install Poetry
RUN pip install poetry

# Configure Poetry to not create a virtual environment
RUN poetry config virtualenvs.create false


# === Dependency Layer ===
# Copy only the files needed to install dependencies
COPY pyproject.toml poetry.lock* ./

# Install dependencies ONLY. This layer will be cached by Docker,
# making subsequent builds much faster if your dependencies don't change.
RUN poetry install --only=main --no-root


# === Application Layer ===
# Now copy the rest of your application code
COPY . .

# Tell Python to also look for modules in the /app/src directory
ENV PYTHONPATH="${PYTHONPATH}:/app/src"

# Expose the port the app runs on
EXPOSE 8000

# This command will now work because PYTHONPATH points to the src directory
CMD ["uvicorn", "accounting_agent.main:app", "--host", "0.0.0.0", "--port", "8000"]