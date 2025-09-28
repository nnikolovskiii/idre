from typing import List, Optional, Dict, Any
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.models.app_settings import AppSettings


class AppSettingsRepository:
    """
    Handles data access logic for the AppSettings entity.
    """
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, key: str, value: str) -> AppSettings:
        """Creates a new AppSettings object and adds it to the session."""
        app_setting = AppSettings(key=key, value=value)
        self.session.add(app_setting)
        await self.session.flush()
        return app_setting

    async def get_by_key(self, key: str) -> Optional[AppSettings]:
        """Retrieves an app setting by its key."""
        return await self.session.get(AppSettings, key)

    async def get_value(self, key: str) -> Optional[str]:
        """Gets the value of an app setting by key."""
        setting = await self.get_by_key(key)
        return setting.value if setting else None

    async def list_all(self) -> List[AppSettings]:
        """Retrieves all app settings."""
        stmt = select(AppSettings)
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def update(self, key: str, value: str) -> Optional[AppSettings]:
        """Updates an app setting value by key."""
        setting = await self.get_by_key(key)
        if setting:
            setting.value = value
            await self.session.flush()
        return setting

    async def update_or_create(self, key: str, value: str) -> AppSettings:
        """Updates an existing setting or creates a new one if it doesn't exist."""
        setting = await self.get_by_key(key)
        if setting:
            setting.value = value
        else:
            setting = await self.create(key, value)
        await self.session.flush()
        return setting

    async def delete_by_key(self, key: str) -> bool:
        """Deletes an app setting by its key."""
        setting = await self.get_by_key(key)
        if setting:
            await self.session.delete(setting)
            await self.session.flush()
            return True
        return False

    async def exists(self, key: str) -> bool:
        """Checks if an app setting with the given key exists."""
        setting = await self.get_by_key(key)
        return setting is not None
