positive_analysis_instruction = """# Task: Analyze specifically for Pros/Positive aspects.
User message: {user_task}
Context: {context}
Instructions: Focus on benefits, opportunities, and optimism.
"""

negative_analysis_instruction = """# Task: Analyze specifically for Cons/Negative aspects.
User message: {user_task}
Context: {context}
Instructions: Focus on risks, challenges, and caution.
"""

combine_responses_instruction = """# Task: Combine these perspectives.
Positive: {positive_response}
Negative: {negative_response}
Instructions: Present a balanced view. Structure with headers.
"""