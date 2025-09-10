import asyncio
import os

from dotenv import load_dotenv
from langgraph_sdk import get_client
langgraph_url = os.getenv("LANGGRAPH_URL")

load_dotenv()
client = get_client(url=langgraph_url)

async def show_messages(client, thread_id: str):
    """
    Deletes a message from a thread by updating the thread's state.
    """
    # 1. Get the current state of the thread
    try:
        current_state = await client.threads.get_state(thread_id=thread_id)
        current_messages = current_state.get('values', {}).get('messages', [])

        for message in current_messages:
            print(f"{message["id"]}: {message['content']}")
    except Exception as e:
        print(f"An error occurred: {e}")



async def delete_message_from_thread(client, thread_id: str, message_id_to_delete: str):
    """
      Creates a new checkpoint that effectively "deletes" a message by setting the thread's
      state to a version from before the message was added.
      """
    """
    Deletes a message using a custom reducer that supports a "$replace" command.
    """
    print(f"Attempting to replace state via custom reducer for thread '{thread_id}'...")

    try:
        current_state = await client.threads.get_state(thread_id=thread_id)
        current_messages = current_state.get('values', {}).get('messages', [])

        new_messages_list = [msg for msg in current_messages if msg.get('id') != message_id_to_delete]

        # IMPORTANT: Wrap the new list in the special dictionary format
        update_payload = {"messages": {"$replace": new_messages_list}}

        response = await client.threads.update_state(
            thread_id=thread_id,
            values=update_payload
        )
        print("Successfully sent replace command to custom reducer.")
        print("New Checkpoint Info:", response['checkpoint'])

    except Exception as e:
        print(f"An error occurred: {e}")


asyncio.run(show_messages(
    client,
    "d6e46568-a0e3-4919-a62a-d0eb9734aaed",
 # ""
))
# asyncio.run(show_messages(client, "7828de20-4c5f-4820-93e7-24f6d3ce3166"))
