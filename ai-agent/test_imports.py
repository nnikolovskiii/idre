# Test script to verify that the circular import issue is resolved
try:
    from agent.core.agent import Task, TaskList
    from agent.core.configs import graph
    from agent.core.state import State
    print("Imports successful! The circular import issue has been resolved.")
except ImportError as e:
    print(f"Import error: {e}")