import os
from dotenv import load_dotenv
from langchain_core.runnables import RunnableConfig

# Import the compiled content rewriter graph
from agent.core.configs import content_rewriter_compiled_graph

# Load environment variables
load_dotenv()

# Configuration for graph invocation
config = RunnableConfig(recursion_limit=50)

# 1. Define the content to be rewritten
# Providing a wordy, passive-voice sentence to test the agent's ability to make it clear and precise.
input_text = (
    "The utilization of the methodology regarding the implementation of the "
    "new software update was executed in a manner that was deemed satisfactory "
    "by the majority of the stakeholders involved in the aforementioned project."
)

print(f"--- Starting Content Rewrite Process ---")
print(f"\n📝 ORIGINAL CONTENT:\n{input_text}")

# 2. Invoke the graph
state = content_rewriter_compiled_graph.invoke(
    {
        "original_content": input_text,
        "light_model": "google/gemini-2.5-flash",
        # "api_key": os.getenv("OPENROUTER_API_KEY"), # Optional if env var is set
    },
    config=config
)

# 3. Output the results
print("\n" + "="*50)
print("✨ REWRITTEN CONTENT")
print("="*50)
print(state.get("rewritten_content"))