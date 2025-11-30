from backend.models.app_settings import AppSettings
from sqlalchemy.future import select

# Define the default settings you requested
DEFAULT_SETTINGS = {
    "heavy_model": "google/gemini-3-pro-preview",
    "light_model": "google/gemini-2.5-flash-lite"
}


async def sync_app_settings(db):
    """
    Populates the AppSettings table with default values if they don't exist.
    """
    print("INFO:     Startup: Checking AppSettings...", flush=True)

    session_factory = db.get_session_factory()

    async with session_factory() as session:
        async with session.begin():
            for key, value in DEFAULT_SETTINGS.items():
                # Check if the key already exists
                stmt = select(AppSettings).where(AppSettings.key == key)
                result = await session.execute(stmt)
                existing_setting = result.scalar_one_or_none()

                if not existing_setting:
                    # Create new entry if it doesn't exist
                    new_setting = AppSettings(key=key, value=value)
                    session.add(new_setting)
                    print(f"INFO:     Startup: Added missing AppSetting '{key}' -> '{value}'", flush=True)
                else:
                    # Do nothing if it exists (as per requirements)
                    pass

    print("INFO:     Startup: AppSettings check complete.", flush=True)