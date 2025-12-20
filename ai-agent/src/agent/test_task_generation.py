import os
from dotenv import load_dotenv
from langchain_core.runnables import RunnableConfig

# Import the compiled task generation graph
from agent.core.configs import task_generation_compiled_graph

# Load environment variables
load_dotenv()

# Configuration for graph invocation
config = RunnableConfig(recursion_limit=50)

# Test inputs for task generation
test_cases = [
    {
        "title": "Project Breakdown",
        "input": "Build a mobile app for food delivery with user authentication and payment integration"
    },
    {
        "title": "Goal Achievement",
        "input": "Learn machine learning and build a portfolio project in 3 months"
    },
    {
        "title": "Feature Development",
        "input": "Add real-time collaboration features to the existing document editor"
    },
    {
        "title": "Simple Task List",
        "input": "Plan a birthday party for 20 people"
    }
]

# Run test cases
for i, test_case in enumerate(test_cases, 1):
    print(f"\n{'='*60}")
    print(f"TEST CASE {i}: {test_case['title']}")
    print(f"{'='*60}")
    print(f"\n📝 INPUT:\n{test_case['input']}\n")

    # Invoke the graph
    state = task_generation_compiled_graph.invoke(
        {
            "text_input": test_case['input'],
            "user_id": "test-user-123",
            "notebook_id": "test-notebook-456",
            "number_of_tasks": 5,
            "task_context": "This is a test run for task generation",
            "light_model": "openrouter/meta-llama/llama-3.2-3b-instruct:free",
            "heavy_model": "openrouter/meta-llama/llama-3.1-70b-instruct",
            "use_online_model": False,
        },
        config=config
    )

    # Output the results
    print("\n" + "="*60)
    print("✨ GENERATED TASKS")
    print("="*60)

    if state.get("error"):
        print(f"❌ Error: {state['error']}")
    else:
        tasks = state.get("generated_tasks", [])
        print(f"Total tasks generated: {len(tasks)}\n")

        for j, task in enumerate(tasks, 1):
            print(f"\nTask {j}:")
            print(f"  📌 Title: {task.get('title', 'N/A')}")
            print(f"  📄 Description: {task.get('description', 'N/A')[:100]}..." if task.get('description') else "  📄 Description: N/A")
            print(f"  🎯 Priority: {task.get('priority', 'N/A')}")
            print(f"  📊 Status: {task.get('status', 'N/A')}")
            print(f"  🏷️  Tags: {', '.join(task.get('tags', [])) if task.get('tags') else 'None'}")

        # Print summary if available
        if "task_summary" in state:
            summary = state["task_summary"]
            print(f"\n📊 Summary:")
            print(f"  Total: {summary.get('total_tasks', 0)}")
            print(f"  High Priority: {summary.get('by_priority', {}).get('high', 0)}")
            print(f"  Medium Priority: {summary.get('by_priority', {}).get('medium', 0)}")
            print(f"  Low Priority: {summary.get('by_priority', {}).get('low', 0)}")

print("\n" + "="*60)
print("✅ All test cases completed!")
print("="*60)