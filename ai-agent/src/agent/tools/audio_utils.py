import os

import requests
from dotenv import load_dotenv

load_dotenv()
fireworks_api_key = os.getenv("FIREWORKS_API")
def transcribe_audio(audio_file_path: str):
    with open(audio_file_path, "rb") as f:
        response = requests.post(
            "https://audio-prod.us-virginia-1.direct.fireworks.ai/v1/audio/transcriptions",
            headers={"Authorization": f"Bearer {fireworks_api_key}"},
            files={"file": f},
            data={
                "model": "whisper-v3",
                "temperature": "0",
                "vad_model": "silero"
            },
        )

    if response.status_code == 200:
        return response.json()["text"]
    return None