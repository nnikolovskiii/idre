import os
import asyncio
from datetime import datetime, timedelta
from contextlib import asynccontextmanager

# --- 1. Add APScheduler Imports ---
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy import text, select

from backend.container import container
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
# --- ADD StreamingResponse HERE ---
from fastapi.responses import JSONResponse, StreamingResponse

# --- Router Imports ---
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
from backend.api.routes.folders_route import router as folders_router
from backend.api.routes import propositions_route
from backend.api.routes import tasks_route
from backend.api.routes import whiteboards_route

# --- Model Imports ---
from backend.models.app_settings import AppSettings

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


async def init_app_settings(db):
    """
    Populates the AppSettings table with default values if they don't exist.
    """
    defaults = {
        "heavy_model": "google/gemini-2.5-flash-lite",
        "light_model": "google/gemini-2.5-flash-lite"
    }

    print("INFO:     Startup: Verifying AppSettings...", flush=True)
    try:
        session_factory = db.get_session_factory()
        async with session_factory() as session:
            async with session.begin():
                for key, value in defaults.items():
                    # Check if the key already exists
                    stmt = select(AppSettings).where(AppSettings.key == key)
                    result = await session.execute(stmt)
                    existing_setting = result.scalar_one_or_none()

                    if not existing_setting:
                        # Create new entry if it doesn't exist
                        print(f"INFO:     Startup: Initializing setting '{key}' -> '{value}'", flush=True)
                        new_setting = AppSettings(key=key, value=value)
                        session.add(new_setting)
                    # If it exists, we do nothing
        print("INFO:     Startup: AppSettings verification complete.", flush=True)
    except Exception as e:
        print(f"ERROR:    Startup: Failed to initialize AppSettings: {e}", flush=True)


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
    try:
        await postgres_db.create_tables()
        print("INFO:     Application startup: Database tables created/verified.", flush=True)
    except Exception as e:
        print(f"ERROR:    Application startup: Database table creation failed: {e}", flush=True)

    # --- Initialize App Settings ---
    await init_app_settings(postgres_db)

    # Initialize Redis client
    try:
        redis_client = container.redis_client()
        print("INFO:     Application startup: Redis client initialized.", flush=True)
    except Exception as e:
        print(f"ERROR:    Application startup: Redis init failed: {e}", flush=True)

    # --- Start Scheduler ---

    # 1. Schedule the recurring task (Every day at Midnight)
    scheduler.add_job(daily_model_update_task, CronTrigger(hour=0, minute=0))

    # 2. Schedule the task to run SHORTLY AFTER startup (delayed by 10s)
    # This prevents DB contention during the critical boot/login phase
    start_delay = datetime.now() + timedelta(seconds=10)
    scheduler.add_job(daily_model_update_task, 'date', run_date=start_delay)

    scheduler.start()
    print(f"INFO:     Application startup: Scheduler started. Initial model sync scheduled for {start_delay}.",
          flush=True)

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


# --- Global Exception Handler ---
# Catches 500 errors and returns JSON, allowing CORSMiddleware to add headers
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"CRITICAL: Global exception handler caught: {exc}", flush=True)
    return JSONResponse(
        status_code=500,
        content={"message": "Internal Server Error", "detail": str(exc)},
    )


# --- Middleware Configuration ---
# Order of execution: Middleware added LAST is executed FIRST (outermost).

# 1. Add file size middleware (Inner Layer - executed second)
app.middleware("http")(file_size_middleware)

# 2. Configure CORS (Outer Layer - executed first)
# This ensures CORS headers are applied to ALL responses, including 413s and 500s.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://accuai.live",
        "http://localhost:3000",
        "http://localhost:5173",
        "https://gcf.nikolanikolovski.com",
        "https://idre.live",
        "https://k8s.idre.live"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
)


# --- Manual Trigger Endpoint (Kept for manual updates/debugging) ---
@app.post("/system/sync-models", tags=["System"], include_in_schema=False)
async def manual_sync_models():
    """
    Manually triggers the model sync task. Useful for debugging.
    """
    print("INFO:     Manual Trigger: Starting model sync...", flush=True)
    await daily_model_update_task()
    return {"status": "success", "message": "Model sync triggered"}


@app.get("/sse/{channel_id}")
async def sse_endpoint(channel_id: str, request: Request):
    """
    Generic Server-Sent Events endpoint that subscribes to a Redis channel.
    This enables real-time updates for Chats, Whiteboards, and File Processing.
    """

    async def event_generator():
        redis = container.redis_client()
        pubsub = redis.pubsub()
        await pubsub.subscribe(channel_id)
        try:
            while True:
                if await request.is_disconnected():
                    break

                # Check for new messages in Redis
                message = await pubsub.get_message(ignore_subscribe_messages=True)

                if message:
                    # FIX: Handle both bytes and str types safely
                    raw_data = message['data']

                    if isinstance(raw_data, bytes):
                        data = raw_data.decode('utf-8')
                    else:
                        # It is already a string (or int/other), just cast to str
                        data = str(raw_data)

                    # Send as SSE format
                    yield f"data: {data}\n\n"

                # Small sleep to prevent tight loop CPU usage
                await asyncio.sleep(0.05)
        except Exception as e:
            print(f"SSE Error on channel {channel_id}: {e}", flush=True)
        finally:
            await pubsub.unsubscribe(channel_id)
            await pubsub.close()

    return StreamingResponse(event_generator(), media_type="text/event-stream")


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
app.include_router(whiteboards_route.router, prefix="/whiteboards", tags=["Whiteboards"])
app.include_router(folders_router, prefix="/folders", tags=["Folders"])



@app.get("/")
async def root():
    return {
        "message": "Welcome to Accounting Agent API",
        "status": "online"
    }


@app.get("/health")
async def health_check():
    """
    Health check endpoint that verifies database connectivity.
    """
    db_status = "disconnected"
    try:
        # Create a temporary session just for the health check
        session_factory = postgres_db.get_session_factory()
        async with session_factory() as session:
            await session.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        print(f"Health check DB error: {e}")
        db_status = "disconnected"

    return {
        "status": "healthy",
        "database": db_status
    }


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "8001"))
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port, reload=True)