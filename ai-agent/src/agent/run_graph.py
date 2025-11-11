from typing import List

from langchain_core.runnables import RunnableConfig

from agent.core.configs import chat_name_graph_compiled, idea_proposition_compiled_graph
from agent.core.idea_proposition_graph import MessageResponse

audio_path = "https://files.nikolanikolovski.com/test/download/test123.ogg"

# Configuration for graph invocation
config = RunnableConfig(recursion_limit=250)

conversation_messages: List[MessageResponse] = [
    MessageResponse(
        id="msg_1",
        type="human",
        content="I have an idea for a mobile app that helps home cooks reduce food waste."
    ),
    MessageResponse(
        id="msg_2",
        type="ai",
        content="That sounds interesting! Who would be the primary users of this app?"
    ),
    MessageResponse(
        id="msg_3",
        type="human",
        content="It's for busy families and environmentally-conscious individuals who buy groceries weekly but struggle to use everything before it spoils."
    ),
    MessageResponse(
        id="msg_4",
        type="ai",
        content="I see. What is the core problem they face that your app will solve?"
    ),
    MessageResponse(
        id="msg_5",
        type="human",
        content="The main problem is that people forget what's in their fridge and pantry. This leads to them buying duplicate items and, ultimately, throwing away expired food, which wastes money and is bad for the environment."
    ),
    MessageResponse(
        id="msg_6",
        type="ai",
        content="And what makes your solution unique compared to just setting reminders?"
    ),
    MessageResponse(
        id="msg_7",
        type="human",
        content="Our app will be unique because it will use AI to scan grocery receipts to automatically log items and their typical shelf life. Then, it will proactively suggest recipes using ingredients that are about to expire, turning a reminder into an actionable plan."
    )
]

# Invoke the graph with audio input
state = idea_proposition_compiled_graph.invoke(
    {
        "light_model": "google/gemini-2.5-flash",
        # "api_key": os.getenv("OPENROUTER_API_KEY"),
        "messages": conversation_messages,
    },
    config=config
)

# Output the enhanced transcript
print("Enhanced Transcript:", state.get("idea_proposition"))
