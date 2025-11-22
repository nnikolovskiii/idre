import os
from contextlib import asynccontextmanager

# --- 1. Add APScheduler Imports ---
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from backend.container import container
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.api.routes.auth_route import router as auth_router
from backend.api.routes.files_route import router as files_router
from backend.api.routes.webhook_route import router as webhook_router
from backend.api.routes.chat_route import router as chat_router
from backend.api.routes.model_api_route import router as model_api_router
from backend.api.routes.openrouter_models_route import router as openrouter_models_router
from backend.api.routes.generative_model_route import router as generative_models_router
from backend.api.routes.notebook_models_route import router as notebook_models_router
from backend.api.routes.chat_models_route import router as chat_models_router
from backend.api.routes.notebooks_route import router as notebooks_router
from backend.api.routes import propositions_route
from backend.api.routes import tasks_route

# --- Import the sync function ---
from backend.utils.populate_generative_models import sync_models_to_database

postgres_db = container.db()

# File size limit for middleware (100MB)
MAX_REQUEST_SIZE = 100 * 1024 * 1024  # 100MB

# --- 2. Initialize Scheduler & Define Task ---
scheduler = AsyncIOScheduler()


async def daily_model_update_task():
    """
    This function runs on the schedule defined below.
    It reuses the postgres_db connection from the main app.
    """
    print("INFO:     Scheduler: Starting periodic model update task...", flush=True)

    try:
        # Pass the existing database connection to avoid creating a new pool
        await sync_models_to_database(postgres_db)
        print("INFO:     Scheduler: Model update completed successfully.", flush=True)
    except Exception as e:
        print(f"ERROR:    Scheduler: Model update failed: {e}", flush=True)

    print("INFO:     Scheduler: Task finished.", flush=True)


async def file_size_middleware(request: Request, call_next):
    """
    Middleware to check Content-Length header and reject oversized requests.
    """
    content_length = request.headers.get('content-length')
    if content_length:
        try:
            size = int(content_length)
            if size > MAX_REQUEST_SIZE:
                return JSONResponse(
                    status_code=413,
                    content={
                        "detail": f"Request size {size} bytes exceeds maximum allowed size of {MAX_REQUEST_SIZE} bytes ({MAX_REQUEST_SIZE / (1024 * 1024):.0f} MB)"
                    }
                )
        except ValueError:
            # Malformed Content-Length header, proceed normally
            pass

    response = await call_next(request)
    return response


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Handles application startup and shutdown events.
    """
    # --- Startup ---
    print("INFO:     Application startup: Creating database tables...", flush=True)
    await postgres_db.create_tables()
    print("INFO:     Application startup: Database tables created/verified.", flush=True)

    # Initialize Redis client
    redis_client = container.redis_client()
    print("INFO:     Application startup: Redis client initialized.", flush=True)

    # --- Start Scheduler ---
    # PRODUCTION MODE: Run every day at Midnight (00:00)
    scheduler.add_job(daily_model_update_task, CronTrigger(hour=0, minute=0))
    scheduler.start()
    print("INFO:     Application startup: Scheduler started (Running daily at midnight).", flush=True)

    yield

    # --- Shutdown ---
    print("INFO:     Application shutdown: Shutting down Scheduler...", flush=True)
    scheduler.shutdown()

    print("INFO:     Application shutdown: Closing Redis connection...", flush=True)
    await redis_client.close()
    print("INFO:     Application shutdown: Disposing database engine.", flush=True)
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
        "https://gcf.nikolanikolovski.com",
        "https://idre.live"  # For Vite dev server
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
)

# Add file size middleware
app.middleware("http")(file_size_middleware)

# --- Manual Trigger Endpoint (Kept for manual updates/debugging) ---
@app.post("/system/sync-models", tags=["System"], include_in_schema=False)
async def manual_sync_models():
    """
    Manually triggers the model sync task. Useful for debugging.
    """
    print("INFO:     Manual Trigger: Starting model sync...", flush=True)
    await daily_model_update_task()
    return {"status": "success", "message": "Model sync triggered"}

# Include routers
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(files_router, prefix="/files", tags=["Files"])
app.include_router(webhook_router, prefix="/webhook", tags=["Webhook"])
app.include_router(chat_router, prefix="/chats", tags=["Chats"])
app.include_router(model_api_router, prefix="/model-api", tags=["Model API"])

app.include_router(notebook_models_router, prefix="/notebook-models", tags=["Notebook Model API"])
app.include_router(chat_models_router, prefix="/chat-models", tags=["Chat Model API"])

app.include_router(openrouter_models_router, prefix="/openrouter-models", tags=["OpenRouter Models"])

app.include_router(generative_models_router, prefix="/generative-models", tags=["Generative Models"])
app.include_router(notebooks_router, prefix="/notebooks", tags=["Notebooks"])

app.include_router(propositions_route.router, prefix="/propositions", tags=["Propositions"])
app.include_router(tasks_route.router, prefix="/tasks", tags=["Tasks"])


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