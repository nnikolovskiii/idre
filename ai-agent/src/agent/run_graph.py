import os

from langchain_core.runnables import RunnableConfig

from agent.core.configs import graph

audio_path = "https://files.nikolanikolovski.com/test/download/test123.ogg"

# Configuration for graph invocation
config = RunnableConfig(recursion_limit=250)

# Invoke the graph with audio input
state = graph.invoke(
    {
        "audio_path": audio_path,
        "light_model": "google/gemini-2.5-flash",  # Optional: specify model
        "api_key": os.getenv("OPENROUTER_API_KEY")  # Optional: provide API key
    },
    config=config
)

# Output the enhanced transcript
print("Enhanced Transcript:", state.get("enhanced_transcript"))
