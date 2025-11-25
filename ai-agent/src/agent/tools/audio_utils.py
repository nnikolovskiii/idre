import os

import requests
from dotenv import load_dotenv

load_dotenv()
fireworks_api_key = os.getenv("FIREWORKS_API")
def transcribe_audio(audio_file_path: str):
    print(f"   > Attempting to transcribe audio file: {audio_file_path}")
    print(f"   > Fireworks API key present: {bool(fireworks_api_key)}")

    with open(audio_file_path, "rb") as f:
        response = requests.post(
            "https://audio-prod.api.fireworks.ai/v1/audio/transcriptions",
            headers={"Authorization": f"Bearer {fireworks_api_key}"},
            files={"file": f},
            data={
                "model": "whisper-v3",
                "temperature": "0",
                "vad_model": "silero"
            },
        )

    print(f"   > Fireworks API response status: {response.status_code}")
    if response.status_code != 200:
        print(f"   > Fireworks API error response: {response.text}")
        return None

    try:
        result = response.json()
        print(f"   > Fireworks API response: {result}")
        return result["text"]
    except Exception as e:
        print(f"   > Error parsing Fireworks response: {e}")
        print(f"   > Raw response: {response.text}")
        return None