questioner_instruction = """ # Your task:
Analyze the context and the user message. Your goal is to identify ambiguities, missing information, or logical gaps.
Write a list of questions about the context that are not clear. These questions should help clarify the subject matter.
Also for each question, provide a short explanation of why it is important.

# User message:
{user_task}

# Context:
{context}

# Output format:
Provide a numbered list of questions.
"""