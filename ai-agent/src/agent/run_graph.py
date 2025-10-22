import os

from langchain_core.runnables import RunnableConfig

from agent.core.configs import chat_name_graph_compiled

audio_path = "https://files.nikolanikolovski.com/test/download/test123.ogg"

# Configuration for graph invocation
config = RunnableConfig(recursion_limit=250)

# Invoke the graph with audio input
state = chat_name_graph_compiled.invoke(
    {
        "light_model": "google/gemini-2.5-flash",
        # "api_key": os.getenv("OPENROUTER_API_KEY"),
        "first_message": "Can you explain to me what docker is?",
    },
    config=config
)

# Output the enhanced transcript
print("Enhanced Transcript:", state.get("title"))
