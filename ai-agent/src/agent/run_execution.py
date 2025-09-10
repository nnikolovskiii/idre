# from langchain_core.messages import HumanMessage
# from langchain_core.runnables import RunnableConfig
#
# from agent import get_project_structure_as_string
# from agent.core.configs import graph
# from agent.run_graph import user_task, project_path
# from agent.tools.file_utils import read_file
#
# config = RunnableConfig(recursion_limit=250)
#
# project_structure = get_project_structure_as_string(project_path)
# print(project_structure)
# context = read_file("/home/nnikolovskii/PycharmProjects/langgraph-demo/src/agent/context.txt")
# plan = read_file("/home/nnikolovskii/PycharmProjects/langgraph-demo/src/agent/example.md")
#
# state = graph.invoke(
#     {
#         "user_task": user_task,
#         "project_path": project_path,
#         "messages": HumanMessage(content=user_task),
#         "context": context,
#         "project_structure": project_structure,
#         "plan": plan,
#     }
#     ,
#     config=config
# )
