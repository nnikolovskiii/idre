"""
Test script to verify thread creation per user functionality.
This script demonstrates that each user gets their own thread for processing documents.
"""

import asyncio
import logging
from accounting_agent.models.file import File, ProcessingStatus
from accounting_agent.container import container
from accounting_agent.utils.file_processor import process_file

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_thread_per_user():
    """Test that each user gets their own thread."""
    db_client = container.mdb()
    
    # Create test files for different users
    test_files = [
        File(
            user_id="user_123",
            url="https://example.com/file1.pdf",
            filename="document1.pdf",
            processing_status=ProcessingStatus.PENDING
        ),
        File(
            user_id="user_456",
            url="https://example.com/file2.pdf",
            filename="document2.pdf",
            processing_status=ProcessingStatus.PENDING
        ),
        File(
            user_id="user_123",  # Same user as first file
            url="https://example.com/file3.pdf",
            filename="document3.pdf",
            processing_status=ProcessingStatus.PENDING
        )
    ]
    
    # Add test files to database
    file_ids = []
    for file in test_files:
        file_id = await db_client.add_entry(file)
        file.id = file_id
        file_ids.append(file_id)
        logger.info(f"Created test file: {file.filename} for user {file.user_id}")
    
    # Process files and check thread assignment
    logger.info("\n=== Processing files and checking thread assignment ===")
    
    for file in test_files:
        try:
            await process_file(file)
            logger.info(f"File: {file.filename} (User: {file.user_id}) -> Thread: {file.thread_id}")
        except Exception as e:
            logger.error(f"Error processing {file.filename}: {e}")
    
    # Verify thread reuse for same user
    logger.info("\n=== Verifying thread reuse ===")
    
    user_threads = {}
    for file in test_files:
        if file.user_id not in user_threads:
            user_threads[file.user_id] = file.thread_id
            logger.info(f"User {file.user_id} -> Thread {file.thread_id}")
        else:
            if user_threads[file.user_id] == file.thread_id:
                logger.info(f"✓ Thread reused for user {file.user_id}: {file.thread_id}")
            else:
                logger.warning(f"✗ Different thread for same user {file.user_id}: {file.thread_id}")
    
    # Cleanup test files
    logger.info("\n=== Cleaning up test files ===")
    for file_id in file_ids:
        await db_client.db.File.delete_one({"_id": file_id})
        logger.info(f"Cleaned up test file: {file_id}")

if __name__ == "__main__":
    asyncio.run(test_thread_per_user())
