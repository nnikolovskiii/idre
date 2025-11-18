idea_prop_prompt = """# Task: Based on the provided context, generate a comprehensive idea proposition with two key components: what and why.

# What: Describe the idea
- The core concept
- The main features
- The specific problem it addresses

# Why: Explain the importance
- Who this helps
- Why solving this problem is important
- The impact or benefit

# Response output:
{{what: "", why: ""}}

Context:
"{context}"
"""