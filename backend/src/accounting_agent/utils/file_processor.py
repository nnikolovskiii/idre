import asyncio
import logging
import os
import traceback

from langgraph_sdk import get_client

from accounting_agent.models.file import File, ProcessingStatus
from accounting_agent.container import container

logger = logging.getLogger(__name__)


async def process_file(file_record: File) -> None:
    """
    Process a file using the LangGraph agent.

    Args:
        file_record: The file record to process
    """
    db_client = container.mdb()  # Initialize once at start

    logger.info(f"Starting file processing for file: {file_record.filename} (ID: {file_record.id})")

    try:
        # Update file status to PROCESSING
        file_record.processing_status = ProcessingStatus.PROCESSING
        await db_client.update_entry(file_record)
        logger.debug(f"Updated file status to PROCESSING for file: {file_record.filename}")

        # Connect to LangGraph client
        langgraph_url = os.getenv("LANGGRAPH_URL", "http://localhost:8123")
        langgraph_client = get_client(url=langgraph_url)
        logger.debug(f"Successfully connected to LangGraph client at {langgraph_url}")

        # Get the assistant
        assistant_refs = await langgraph_client.assistants.search()
        if not assistant_refs:
            error_details = f"No assistants found in LangGraph for file {file_record.filename}"
            logger.error(error_details)
            file_record.processing_status = ProcessingStatus.FAILED
            file_record.processing_result = {"error": error_details, "context": "LangGraph initialization"}
            await db_client.update_entry(file_record)
            return

        assistant_id = assistant_refs[0]["assistant_id"]
        logger.debug(f"Using assistant_id: {assistant_id}")

        # Check if this user already has a thread
        existing_files = await db_client.get_entries(
            File,
            doc_filter={"user_id": file_record.user_id, "thread_id": {"$ne": None}}
        )

        if existing_files:
            # Reuse existing thread for this user
            thread_id = existing_files[0].thread_id
            logger.info(f"Reusing existing thread for user {file_record.user_id}: {thread_id}")
        else:
            # Create a new thread for this user
            thread = await langgraph_client.threads.create()
            thread_id = thread["thread_id"]
            logger.info(f"Created new thread for user {file_record.user_id}: {thread_id}")

        # Get webhook URL from environment
        webhook_url = os.getenv("LANGGRAPH_WEBHOOK_URL")
        if not webhook_url:
            error_details = f"LANGGRAPH_WEBHOOK_URL environment variable is not set. " \
                            f"Cannot process file {file_record.filename} without webhook URL"
            logger.error(error_details)
            file_record.processing_status = ProcessingStatus.FAILED
            file_record.processing_result = {"error": error_details, "context": "Configuration"}
            await db_client.update_entry(file_record)
            return

        logger.debug(f"Using webhook URL: {webhook_url}")

        # Create a run with the file URL
        logger.info(f"Creating LangGraph run for file: {file_record.filename}")
        processing_response = await langgraph_client.runs.create(
            thread_id=thread_id,
            assistant_id=assistant_id,
            input={"file_url": file_record.url},
            webhook=webhook_url,
            metadata={"url": file_record.url, "user_id": file_record.user_id, "file_id": file_record.id},
        )

        run_id = processing_response.get("run_id")
        logger.info(f"Successfully created LangGraph run with run_id: {run_id}")

        # Save thread_id and run_id to the file record
        file_record.thread_id = thread_id
        file_record.run_id = run_id
        await db_client.update_entry(file_record)
        logger.debug(f"Updated file record with thread_id and run_id for file: {file_record.filename}")

    except Exception as e:
        error_details = f"Failed to process file {file_record.filename} (ID: {file_record.id})"
        logger.exception(f"{error_details}. Error: {str(e)}")
        file_record.processing_status = ProcessingStatus.FAILED
        file_record.processing_result = {
            "error": error_details,
            "details": str(e),
            "traceback": traceback.format_exc(),
            "context": "File processing"
        }
        await db_client.update_entry(file_record)


async def poll_for_results(file_record: File, max_retries: int = 30, retry_interval: int = 10) -> None:
    """
    Poll for results from the LangGraph agent.

    Args:
        file_record: The file record to poll for
        max_retries: Maximum number of retries
        retry_interval: Interval between retries in seconds
    """
    db_client = container.mdb()  # Initialize once at start

    logger.info(f"Starting polling for file: {file_record.filename} (ID: {file_record.id})")
    logger.info(f"Polling configuration: max_retries={max_retries}, retry_interval={retry_interval}s")

    try:
        langgraph_url = os.getenv("LANGGRAPH_URL", "http://localhost:8123")
        langgraph_client = get_client(url=langgraph_url)
        logger.debug(f"Successfully connected to LangGraph client for polling at {langgraph_url}")

        for attempt in range(max_retries):
            await asyncio.sleep(retry_interval)

            logger.debug(f"Polling attempt {attempt + 1}/{max_retries} for file: {file_record.filename}")

            if not file_record.thread_id or not file_record.run_id:
                error_details = f"Cannot poll for file {file_record.filename} - missing required IDs. " \
                                f"thread_id: {file_record.thread_id}, run_id: {file_record.run_id}"
                logger.error(error_details)
                file_record.processing_status = ProcessingStatus.FAILED
                file_record.processing_result = {
                    "error": error_details,
                    "context": "Polling validation",
                    "missing_fields": ["thread_id" if not file_record.thread_id else None,
                                       "run_id" if not file_record.run_id else None]
                }
                await db_client.update_entry(file_record)
                return

            # Get the run status
            processing_response = await langgraph_client.runs.join(
                thread_id=file_record.thread_id,
                run_id=file_record.run_id
            )

            run_status = processing_response.get("status")
            logger.debug(f"Run status for file {file_record.filename}: {run_status}")

            if run_status == "completed":
                processing_result = processing_response.get("response")
                file_record.processing_status = ProcessingStatus.COMPLETED
                file_record.processing_result = processing_result
                await db_client.update_entry(file_record)
                logger.info(f"File processing completed successfully: {file_record.filename}")
                logger.debug(f"Processing result: {processing_result}")
                return
            elif run_status in ["failed", "cancelled"]:
                error_details = f"LangGraph run {run_status} for file {file_record.filename}"
                logger.error(f"{error_details}. Full response: {processing_response}")
                file_record.processing_status = ProcessingStatus.FAILED
                file_record.processing_result = {
                    "error": error_details,
                    "status": run_status,
                    "details": processing_response,
                    "context": "LangGraph execution"
                }
                await db_client.update_entry(file_record)
                return
            elif run_status == "running":
                logger.debug(f"Run still in progress for file {file_record.filename}, waiting...")
            else:
                logger.warning(f"Unexpected run status '{run_status}' for file {file_record.filename}")

            logger.debug(f"Retrying in {retry_interval} seconds...")

        error_details = f"Maximum polling retries ({max_retries}) exceeded for file: {file_record.filename}"
        logger.error(error_details)
        file_record.processing_status = ProcessingStatus.FAILED
        file_record.processing_result = {
            "error": error_details,
            "context": "Timeout",
            "max_retries": max_retries,
            "retry_interval": retry_interval
        }
        await db_client.update_entry(file_record)

    except Exception as e:
        error_details = f"Unexpected error during polling for file {file_record.filename}"
        logger.exception(f"{error_details}. Error: {str(e)}")
        file_record.processing_status = ProcessingStatus.FAILED
        file_record.processing_result = {
            "error": error_details,
            "details": str(e),
            "traceback": traceback.format_exc(),
            "context": "Polling exception"
        }
        await db_client.update_entry(file_record)
