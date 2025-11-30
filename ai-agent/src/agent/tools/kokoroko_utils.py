import os
import time
import uuid
import tempfile
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()


class TTSService:
    def __init__(self, s3_client):
        self.s3_client = s3_client
        self.bucket_name = os.getenv("BUCKET_NAME", "my-local-bucket")
        self.s3_endpoint = os.getenv("S3_ENDPOINT_URL", "http://seaweedfs:8333")

        # Initialize DeepInfra client
        api_key = os.getenv("DEEPINFRA_API_KEY")
        self.ai_client = OpenAI(
            base_url="https://api.deepinfra.com/v1/openai",
            api_key=api_key
        )

    def _generate_audio(self, text_input: str, output_path: str):
        """Generates audio from text using DeepInfra."""
        with self.ai_client.audio.speech.with_streaming_response.create(
                model="hexgrad/Kokoro-82M",
                voice="af_bella",
                input=text_input,
                response_format="mp3",
        ) as response:
            response.stream_to_file(output_path)

    def _generate_unique_filename(self, extension: str = "mp3") -> str:
        unique_id = f"{int(time.time())}_{uuid.uuid4().hex}"
        return f"{unique_id}.{extension}"

    def _upload_to_s3(self, file_path: str, filename: str) -> str:
        """Uploads file to S3 and returns the internal URL."""
        # 1. Ensure bucket exists
        try:
            self.s3_client.head_bucket(Bucket=self.bucket_name)
        except Exception:
            try:
                self.s3_client.create_bucket(Bucket=self.bucket_name)
            except Exception as e:
                print(f"Warning: Bucket creation check failed: {e}")

        # 2. Upload
        with open(file_path, "rb") as f:
            self.s3_client.upload_fileobj(
                f,
                self.bucket_name,
                filename,
                ExtraArgs={'ContentType': "audio/mpeg"}
            )

        return f"{self.s3_endpoint}/{self.bucket_name}/{filename}"

    async def text_to_speech_upload_file(self, text_input: str) -> str:
        """
        Orchestrates generation and upload.
        Returns the unique filename (compatible with frontend proxy).
        """
        unique_filename = self._generate_unique_filename("mp3")

        with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as temp_file:
            temp_file_path = temp_file.name

        try:
            self._generate_audio(text_input, temp_file_path)
            file_url = self._upload_to_s3(temp_file_path, unique_filename)
            print(f"TTS generated and uploaded to: {file_url}")
            return unique_filename
        finally:
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)