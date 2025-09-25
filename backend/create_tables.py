import asyncio
from backend.databases.postgres_db import AsyncPostgreSQLDatabase

async def main():
    db = AsyncPostgreSQLDatabase()
    await db.create_tables()
    print('Tables created successfully')

if __name__ == "__main__":
    asyncio.run(main())
