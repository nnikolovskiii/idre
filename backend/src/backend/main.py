import os
from contextlib import asynccontextmanager  # 1. ADD THIS IMPORT

from backend.container import container
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.api.routes.auth import router as auth_router
from backend.api.routes.files import router as files_router
from backend.api.routes.webhook import router as webhook_router
from backend.api.routes.chat import router as chat_router
from backend.api.routes.ai_models import router as ai_models_router
from backend.api.routes.model_api import router as model_api_router
from backend.api.routes.openrouter_models import router as openrouter_models_router
from backend.api.routes.notebooks import router as notebooks_router

# The postgres_db instance is created here, which is fine
postgres_db = container.postgres_db()


# 2. REMOVE THE OLD SYNCHRONOUS CALL
# postgres_db.create_tables() # <--- THIS IS THE PROBLEM LINE, REMOVE IT

# 3. DEFINE THE LIFESPAN CONTEXT MANAGER
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Handles application startup and shutdown events.
    """
    # --- Startup ---
    print("INFO:     Application startup: Creating database tables...")
    # Call the async function correctly
    await postgres_db.create_tables()
    print("INFO:     Application startup: Database tables created/verified.")

    yield  # The application runs while the lifespan is in this 'yield' state

    # --- Shutdown ---
    # You can add cleanup code here if needed, like closing the engine pool
    print("INFO:     Application shutdown: Disposing database engine.")
    await postgres_db.engine.dispose()


# 4. ATTACH THE LIFESPAN TO THE APP INSTANCE
app = FastAPI(title="Accounting Agent API", lifespan=lifespan)

# Configure CORS with specific origins instead of wildcard
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://accuai.live",
        "http://localhost:3000",  # For local development
        "http://localhost:5173", 
        "https://gcf.nikolanikolovski.com" # For Vite dev server
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(files_router, prefix="/files", tags=["Files"])
app.include_router(webhook_router, prefix="/webhook", tags=["Webhook"])
app.include_router(chat_router, prefix="/chats", tags=["Chats"])
app.include_router(ai_models_router, prefix="/ai-models", tags=["AI Models"])
app.include_router(model_api_router, prefix="/model-api", tags=["Model API"])
app.include_router(openrouter_models_router, prefix="/openrouter-models", tags=["OpenRouter Models"])
app.include_router(notebooks_router, prefix="/notebooks", tags=["Notebooks"])


@app.get("/")
async def root():
    return {
        "message": "Welcome to Accounting Agent API",
        "status": "online"
    }


@app.get("/health")
async def health_check():
    return {
        "status": "healthy"
    }


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "8001"))
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port, reload=True)
