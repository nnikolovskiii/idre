import asyncio
import os

from langgraph_sdk import get_client
langgraph_url = os.getenv("LANGGRAPH_URL")


client = get_client(url=langgraph_url)

async def delete_message_from_thread(client, thread_id: str, message_id_to_delete: str):
    """
    Deletes a message from a thread by updating the thread's state.
    """
    print(f"Attempting to delete message '{message_id_to_delete}' from thread '{thread_id}'...")

    # 1. Get the current state of the thread

    current_state = await client.threads.get_state(thread_id=thread_id)
    current_messages = current_state.get('values', {}).get('messages', [])

