import os
from dotenv import load_dotenv
from langchain_core.runnables import RunnableConfig
from langchain_core.messages import HumanMessage

# Import the compiled pros/cons graph
from agent.core.configs import pros_cons_compiled_graph

# Load environment variables (for OPENROUTER_API_KEY)
load_dotenv()

# Configuration for graph invocation
config = RunnableConfig(recursion_limit=50)

# 1. Define the decision or topic you want analyzed
topic = "Should I migrate my startup's monolithic application to a microservices architecture?"

# 2. (Optional) Add context if this is part of an existing conversation
# context_messages = [
#     HumanMessage(content="Our team is growing and deployment is getting slow."),
#     HumanMessage(content="We are currently using Python and Django.")
# ]

print(f"--- Starting Analysis for: '{topic}' ---")

# 3. Invoke the graph
state = pros_cons_compiled_graph.invoke(
    {
        "text_input": topic,
        # "messages": context_messages, # Optional context
        "heavy_model": "google/gemini-2.5-flash",
        "light_model": "google/gemini-2.5-flash",
        "web_search": False, # Set to True if you want real-time data
        # "api_key": os.getenv("OPENROUTER_API_KEY"), # Optional if env var is set
    },
    config=config
)

# 4. Output the results
print("\n" + "="*50)
print("✅ POSITIVE ANALYSIS (PROS)")
print("="*50)
print(state.get("positive_response"))

print("\n" + "="*50)
print("⚠️ NEGATIVE ANALYSIS (CONS)")
print("="*50)
print(state.get("negative_response"))

print("\n" + "="*50)
print("🎯 FINAL COMBINED REPORT")
print("="*50)
# The final combined response is added as the last message in the conversation history
if state.get("messages"):
    last_message = state["messages"][-1]
    print(last_message.content)
else:
    print("No final message generated.")