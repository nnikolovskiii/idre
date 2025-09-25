import asyncio

from langgraph_sdk import get_client

async def run():
    client = get_client(url="http://localhost:8123")  # or omit url for localhost
    threads = await client.threads.search()
    assistants = await client.assistants.search()

    thread_id = threads[0]["thread_id"]
    assistant_id = assistants[0]["assistant_id"]


    # response = await client.runs.create(thread_id, assistant_id, input={"file_url": "http://79.125.164.129:5001/test/download/Izvod_Za_Den_16.06.2025.pdf"})
    response = await client.runs.list(thread_id=thread_id)
    for res in response:
        print(res)
        print()
asyncio.run(run())

