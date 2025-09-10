import logging
import os
from copy import deepcopy

from bson import ObjectId
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional, Any, List, Dict, TypeVar, AsyncGenerator
from typing import Type as TypingType
from dotenv import load_dotenv
from pymongo.errors import DuplicateKeyError, ConnectionFailure


class MongoEntry(BaseModel):
    id: Optional[str] = None


T = TypeVar('T', bound=MongoEntry)


class MongoDBDatabase:
    client: AsyncIOMotorClient

    def __init__(self, database_name: str = "general-chat-db", url: Optional[str] = None):
        load_dotenv()
        url = os.getenv("MONGO_URL") if url is None else url
        print(f"Connecting to MongoDB at {url}")
        self.client = AsyncIOMotorClient(url)
        self.db = self.client[database_name]

    async def ping(self) -> bool:
        try:
            await self.client.admin.command("ping")
            return True
        except ConnectionFailure as e:
            raise ConnectionFailure(f"Could not connect to MongoDB: {e}")

    async def add_entry(
            self,
            entity: T,
            collection_name: Optional[str] = None,
            metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        collection_name = entity.__class__.__name__ if collection_name is None else collection_name
        collection = self.db[collection_name]
        entry = entity.model_dump()
        if "id" in entry:
            entry.pop("id")
        if metadata:
            entry.update(metadata)

        result = await collection.insert_one(entry)
        return str(result.inserted_id)

    async def update_entry(
            self,
            updated_entry: T,
            collection_name: Optional[str] = None
    ) -> bool:
        """
        Updates an existing entry in the database.

        Args:
            updated_entry: The entry with updated data. Must have an 'id' field.
            collection_name: Optional collection name. If not provided, uses the class name.

        Returns:
            bool: True if the entry was successfully updated, False if no entry was found.

        Raises:
            ValueError: If the entry doesn't have an 'id' field.
        """
        if not updated_entry.id:
            raise ValueError("Entry must have an 'id' field to be updated")

        collection_name = updated_entry.__class__.__name__ if collection_name is None else collection_name
        collection = self.db[collection_name]

        # Convert the entry to dict and remove the id for the update data
        entry_data = updated_entry.model_dump()
        entry_id = entry_data.pop("id")

        # Update the document
        result = await collection.update_one(
            {"_id": ObjectId(entry_id)},
            {"$set": entry_data}
        )

        return result.matched_count > 0

    async def get_entries(
            self,
            class_type: TypingType[T],
            doc_filter: Dict[str, Any] = None,
            collection_name: Optional[str] = None,
    ) -> List[T]:
        collection_name = class_type.__name__ if collection_name is None else collection_name
        collection = self.db[collection_name]

        cursor = collection.find(doc_filter or {})
        results = []
        async for doc in cursor:
            doc['id'] = str(doc.pop('_id'))
            entry = class_type.model_validate(doc)
            results.append(entry)

        return results

    async def get_entry_from_col_values(
            self,
            columns: Dict[str, Any],
            class_type: TypingType[T],
            collection_name: Optional[str] = None
    ) -> Optional[T]:
        collection_name = class_type.__name__ if collection_name is None else collection_name
        collection = self.db[collection_name]

        doc = await collection.find_one(columns)
        if doc is None:
            return None

        doc['id'] = str(doc.pop('_id'))
        return class_type.model_validate(doc)

    async def get_entry(
            self,
            entry_id: str,
            class_type: TypingType[T],
            collection_name: Optional[str] = None
    ) -> Optional[T]:
        """
        Retrieve a single entry by its ObjectId.

        Args:
            entry_id: The hex-string representation of the document’s _id.
            class_type: The Pydantic model that represents the entry.
            collection_name: Optional collection name. Defaults to class_type.__name__.

        Returns:
            The validated Pydantic instance, or None if no document is found.
        """
        collection_name = class_type.__name__ if collection_name is None else collection_name
        collection = self.db[collection_name]

        doc = await collection.find_one({"_id": ObjectId(entry_id)})
        if doc is None:
            return None

        doc["id"] = str(doc.pop("_id"))
        return class_type.model_validate(doc)
