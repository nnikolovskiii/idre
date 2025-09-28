from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from backend.models.app_settings import AppSettings
from backend.repositories.app_settings_repository import AppSettingsRepository


class AppSettingsService:
    """
    Orchestrates business logic for AppSettings entities.
    """
    def __init__(self, session: AsyncSession, app_settings_repository: AppSettingsRepository):
        self.session = session
        self.repo = app_settings_repository

    async def create_setting(self, key: str, value: str) -> AppSettings:
        """Creates an app setting and commits the transaction."""
        app_setting = await self.repo.create(key=key, value=value)
        await self.session.commit()
        await self.session.refresh(app_setting)
        return app_setting

    async def update_setting(self, key: str, value: str) -> Optional[AppSettings]:
        """Updates an app setting and commits the transaction."""
        app_setting = await self.repo.update(key, value)
        if app_setting:
            await self.session.commit()
            await self.session.refresh(app_setting)
        return app_setting

    async def update_or_create_setting(self, key: str, value: str) -> AppSettings:
        """Updates an existing setting or creates a new one and commits the transaction."""
        app_setting = await self.repo.update_or_create(key, value)
        await self.session.commit()
        await self.session.refresh(app_setting)
        return app_setting

    async def delete_setting(self, key: str) -> bool:
        """Deletes an app setting and commits the transaction."""
        was_deleted = await self.repo.delete_by_key(key)
        if was_deleted:
            await self.session.commit()
        return was_deleted

    async def get_setting_by_key(self, key: str) -> Optional[AppSettings]:
        """Gets an app setting by key."""
        return await self.repo.get_by_key(key)

    async def get_value(self, key: str) -> Optional[str]:
        """Gets the value of an app setting by key."""
        return await self.repo.get_value(key)

    async def get_all_settings(self) -> List[AppSettings]:
        """Gets all app settings."""
        return await self.repo.list_all()

    async def setting_exists(self, key: str) -> bool:
        """Checks if an app setting exists."""
        return await self.repo.exists(key)

    async def get_setting_with_default(self, key: str, default_value: str) -> str:
        """Gets a setting value or returns a default if it doesn't exist."""
        value = await self.get_value(key)
        return value if value is not None else default_value
