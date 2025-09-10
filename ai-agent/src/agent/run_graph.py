from langchain_core.messages import HumanMessage
from langchain_core.runnables import RunnableConfig

from agent.core.configs import graph

project_path = ""


user_task = """Hey how are you?"""



config = RunnableConfig(recursion_limit=250)

state = graph.invoke(
    {
        "text_input": "Tell me is this type of thinking good?"
    }
    ,
    config=config
)
