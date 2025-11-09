generate_answer_instruction = """Answer the users question. Below is a context of previous conversation.
You can use it if you think is beneficial or skip if it is not useful.

User message:
{user_task}

Context:
{context}
"""

brainstorm_answer_instruction = """ # Your task:
Brainstorm ideas. Give various views and options. Below is a context of previous conversation.
You can use it if you think is beneficial or skip if it is not useful.

# User message:
{user_task}

# In the end this needs to be answered fully:
For [specific target audience] who struggle with [a specific problem], my idea is a [name or type of solution] that provides [the key benefit/value]. Unlike [the main competitor or current alternative], my solution [has this key differentiator].

# Context:
{context}
"""

get_conclusion_instruction = """Below is a user message and an AI response. Your job is to extract a quick summarization for the AI response.

# Important:
- Provide a concise and complete summary of the AI message.
- Never draw your own conclusions, or create new information.
- Your job is to only extract information.

User message:
{user_task}

AI message:
{ai_message}
"""