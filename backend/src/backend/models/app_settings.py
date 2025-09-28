from sqlalchemy import (
    Column,
    Text,
)

from backend.databases.postgres_db import Base


class AppSettings(Base):
    """
    A simple key-value store for global application settings that can be
    changed at runtime by an administrator.
    """
    __tablename__ = 'app_settings'

    key = Column(Text, primary_key=True)

    value = Column(Text, nullable=False)

    def __repr__(self):
        return f"<AppSettings(key='{self.key}', value='{self.value}')>"
