import os
import requests
import json
import base64
from dotenv import load_dotenv

load_dotenv()
openrouter_api_key = os.getenv("OPENROUTER_API_KEY")


def transcribe_audio(audio_file_path: str):
    print(f"   > Attempting to transcribe audio file: {audio_file_path}")
    print(f"   > OpenRouter API key present: {bool(openrouter_api_key)}")

    # 1. Determine file extension (wav, mp3, etc.)
    file_extension = audio_file_path.split('.')[-1].lower()

    # 2. Read audio file and convert to Base64
    try:
        with open(audio_file_path, "rb") as audio_file:
            audio_data = audio_file.read()
            base64_audio = base64.b64encode(audio_data).decode("utf-8")
    except Exception as e:
        print(f"   > Error reading file: {e}")
        return None

    # 3. Construct the request
    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {openrouter_api_key}",
        "Content-Type": "application/json",
        # Optional: Add your site details here if needed
        # "HTTP-Referer": "<YOUR_SITE_URL>",
        # "X-Title": "<YOUR_SITE_NAME>",
    }

    payload = {
        "model": "google/gemini-2.5-flash-lite",
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        # We explicitly ask it to transcribe to ensure we get text back
                        "text": "Transcribe the audio."
                    },
                    {
                        "type": "input_audio",
                        "input_audio": {
                            "data": base64_audio,
                            "format": file_extension
                        }
                    }
                ]
            }
        ]
    }

    response = requests.post(url, headers=headers, data=json.dumps(payload))

    print(f"   > OpenRouter API response status: {response.status_code}")

    if response.status_code != 200:
        print(f"   > OpenRouter API error response: {response.text}")
        return None

    try:
        result = response.json()
        # Parse Chat Completion format
        transcription = result['choices'][0]['message']['content']
        print(f"   > OpenRouter Transcription: {transcription[:100]}...")  # Print first 100 chars
        return transcription
    except Exception as e:
        print(f"   > Error parsing OpenRouter response: {e}")
        print(f"   > Raw response: {response.text}")
        return None