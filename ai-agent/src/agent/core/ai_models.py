import os

from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_groq import ChatGroq

load_dotenv()
api_key = os.getenv("GROQ_API_KEY")
kimi_llm = ChatGroq(
    model="moonshotai/kimi-k2-instruct",
    temperature=0,
    max_tokens=None,
    timeout=None,
    max_retries=2,
    api_key=api_key,
)

from langchain_together import ChatTogether

api_key = os.getenv("TOGETHER_API_KEY")

deepseek_llm = ChatTogether(
    model="deepseek-ai/DeepSeek-R1",
    temperature=0,
    max_tokens=1000000,
    timeout=None,
    max_retries=2,
    api_key=api_key,
)

api_key = os.getenv("GOOGLE_API_KEY")

gemini_flash_lite = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash-lite-preview-06-17",
    api_key=api_key,
)

from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate
from langchain.chains import LLMChain
from os import getenv
from dotenv import load_dotenv

load_dotenv()

template = """Question: {question}
Answer: Let's think step by step."""

prompt = PromptTemplate(template=template, input_variables=["question"])

model1 = "qwen/qwen3-coder:free"
model2 = "qwen/qwen3-235b-a22b-thinking-2507"
model3= "openai/gpt-oss-120b"
model4= "openai/gpt-5"
open_router_model = ChatOpenAI(
  api_key=getenv("OPENROUTER_API_KEY"),
  base_url="https://openrouter.ai/api/v1",
  model=model4
)

gpt5 = ChatOpenAI(
    model="gpt-4.1-2025-04-14",
    api_key=getenv("OPENAI_API_KEY"),
)
