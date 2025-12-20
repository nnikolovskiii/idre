task_generation_prompt = """You are a Project Lead. Below is a project concept.

Content to analyze:
"{text_input}"

Extract the Key High-Level Deliverables from this content. Avoid breaking these down into daily actions; instead, focus on the 'Big Rocks'—the major components that make up the final result.

The tasks should be in this structure:
- Deliverable Title: Clear and distinct.
- Scope Summary: A broad description of what this component entails.
- Strategic Value: Why is this component essential to the project?
- Category Tag: (e.g., Development, Legal, Operations).
"""