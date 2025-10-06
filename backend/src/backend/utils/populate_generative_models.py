"""
Script to sync OpenRouter models to the GenerativeModel database table.
Fetches models from OpenRouter API and adds them to the database.
"""
import asyncio
import requests
from typing import List, Set
from backend.databases.postgres_db import AsyncPostgreSQLDatabase
from backend.repositories.generative_model_repository import GenerativeModelRepository
from backend.services.generative_model_service import GenerativeModelService


def fetch_openrouter_models() -> tuple[List[str], Set[str]]:
    """
    Fetch all models and free models from OpenRouter API.
    Returns a tuple of (all_models, free_models_set).
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
        free_models = set()

        for model in data["data"]:
            if "id" not in model:
                continue

            model_id = model["id"]
            all_models.append(model_id)

            # Check if model is free
            pricing = model.get("pricing", {})
            if pricing.get("prompt") == "0" and pricing.get("completion") == "0":
                free_models.add(model_id)

        return all_models, free_models

    except requests.RequestException as e:
        raise Exception(f"Network error while fetching models: {str(e)}")
    except Exception as e:
        raise Exception(f"Error processing OpenRouter response: {str(e)}")


async def sync_models_to_database():
    """
    Main function to sync OpenRouter models to the database.
    """
    # Initialize database connection
    db = AsyncPostgreSQLDatabase()

    # Create tables if they don't exist
    await db.create_tables()

    # Fetch models from OpenRouter
    print("Fetching models from OpenRouter API...")
    all_models, free_models = fetch_openrouter_models()
    print(f"Found {len(all_models)} total models, {len(free_models)} free models")

    # Get session and initialize service
    session_factory = db.get_session_factory()
    async with session_factory() as session:
        repo = GenerativeModelRepository(session)
        service = GenerativeModelService(session, repo)

        # Get existing models from database
        existing_models = await service.get_all_models()
        existing_model_names = {model.name for model in existing_models}

        # Add new models
        added_count = 0
        updated_count = 0

        for model_name in all_models:
            is_free = model_name in free_models

            if model_name in existing_model_names:
                # Check if we need to update is_open_access
                existing_model = await service.get_model_by_name(model_name)
                if existing_model and existing_model.is_open_access != is_free:
                    await service.update_model(
                        str(existing_model.id),
                        {"is_open_access": is_free}
                    )
                    print(f"Updated: {model_name} (is_open_access={is_free})")
                    updated_count += 1
            else:
                # Create new model
                await service.create_model(
                    name=model_name,
                    is_open_access=is_free,
                    model_type="light"
                )

                await service.create_model(
                    name=model_name,
                    is_open_access=is_free,
                    model_type="heavy"
                )
                print(f"Added: {model_name} (is_open_access={is_free})")
                added_count += 1

        print(f"\nSync complete!")
        print(f"Added: {added_count} models")
        print(f"Updated: {updated_count} models")
        print(f"Total in database: {len(existing_model_names) + added_count}")


if __name__ == "__main__":
    asyncio.run(sync_models_to_database())