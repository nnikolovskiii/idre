"""
Script to sync OpenRouter models to the GenerativeModel database table.
Fetches models from OpenRouter API and upserts them (Update or Insert).
"""
import asyncio
import requests
from typing import List, Set, Optional
from backend.databases.postgres_db import AsyncPostgreSQLDatabase
from backend.repositories.generative_model_repository import GenerativeModelRepository
from backend.services.generative_model_service import GenerativeModelService


def fetch_openrouter_models() -> List[str]:
    """
    Fetch all models from OpenRouter API.
    Returns a list of all model names.
    """
    try:
        url = "https://openrouter.ai/api/v1/models"
        response = requests.get(url, timeout=10)

        if response.status_code != 200:
            raise Exception(f"Failed to fetch models: {response.status_code} - {response.text}")

        data = response.json()

        if "data" not in data:
            raise Exception("Invalid response format from OpenRouter API")

        all_models = []

        for model in data["data"]:
            if "id" not in model:
                continue

            model_id = model["id"]
            all_models.append(model_id)

        return all_models

    except requests.RequestException as e:
        raise Exception(f"Network error while fetching models: {str(e)}")
    except Exception as e:
        raise Exception(f"Error processing OpenRouter response: {str(e)}")




async def sync_models_to_database(db_instance: Optional[AsyncPostgreSQLDatabase] = None):
    """
    Main function to sync OpenRouter models to the database.
    """
    # Use existing DB instance if provided (prevents memory leaks), else create new one
    db = db_instance if db_instance else AsyncPostgreSQLDatabase()

    # Create tables if they don't exist
    await db.create_tables()

    # Fetch models from OpenRouter
    print("Fetching models from OpenRouter API...", flush=True)
    try:
        all_models = fetch_openrouter_models()
        print(f"Found {len(all_models)} total models", flush=True)
    except Exception as e:
        print(f"Error fetching models: {e}", flush=True)
        return

    # Get session and initialize service
    session_factory = db.get_session_factory()
    async with session_factory() as session:
        repo = GenerativeModelRepository(session)
        service = GenerativeModelService(session, repo)

        # 1. Fetch ALL existing models from DB to create a lookup map
        existing_models = await service.get_all_models()

        # Map: (name, type) -> GenerativeModel Object
        existing_map = {(m.name, m.type): m for m in existing_models}

        print(f"Database currently has {len(existing_models)} models.", flush=True)

        added_count = 0

        # 2. Loop through OpenRouter models and add new ones
        for model_name in all_models:
            # We process both 'light' and 'heavy' variants for every OpenRouter model
            for m_type in ["light", "heavy"]:
                key = (model_name, m_type)

                if key not in existing_map:
                    # --- INSERT LOGIC ---
                    await service.create_model(
                        name=model_name,
                        model_type=m_type
                    )
                    added_count += 1

        print(f"\nSync complete!", flush=True)
        print(f"Total models processed from API: {len(all_models)}", flush=True)
        print(f"New models added: {added_count}", flush=True)
        print(f"Total models in DB: {len(existing_models) + added_count}", flush=True)


if __name__ == "__main__":
    asyncio.run(sync_models_to_database())