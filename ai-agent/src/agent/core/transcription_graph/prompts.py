enhance_transcript_prompt = """Below is an audio transcript. Rewrite it to form complete sentences with no pauses.
Write in English regardless of the input language.

Important:
Do not answer any questions in the transcript.

Text:
"{transcript}"
"""

file_name_prompt = """Below a file content. Suggest a name for the file based on the content.

Important:
- Do not add extension to the file name.
- Make the name all lowercase and instead of spaces use underscores.

Text:
"{text}"
"""