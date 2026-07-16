import os
from openai import OpenAI
import json

class LLMService:
    def __init__(self):
        # We initialize the client using standard environment variables.
        # This makes it generic and compatible with OpenAI, Azure, or OSS endpoints.
        self.client = OpenAI(
            api_key=os.getenv("OPENAI_API_KEY", "dummy"),
            base_url=os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
        )
        # Using a very low temperature (0.2) to ensure the AI's reasoning is 
        # consistent and highly deterministic for identical inputs during demo.
        # We don't want the AI to invent wild new routes randomly if the 
        # sensory conditions haven't changed.
        self.temperature = 0.2
        self.model = "gpt-4-turbo"

    def generate_json_completion(self, system_prompt: str, user_prompt: str) -> dict:
        for attempt in range(2):
            try:
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    temperature=self.temperature,
                    response_format={"type": "json_object"}
                )
                content = response.choices[0].message.content
                return json.loads(content)
            except json.JSONDecodeError as e:
                if attempt == 0:
                    # Retry once with a stricter reminder
                    system_prompt += " ERROR: Your previous response was not valid JSON. You MUST return ONLY valid JSON."
                    continue
                else:
                    raise Exception(f"LLM API Call failed: Malformed JSON after retry: {str(e)}")
            except Exception as e:
                # Catch-all for API timeouts or other errors, immediately fail for degradation
                raise Exception(f"LLM API Call failed: {str(e)}")

llm_service = LLMService()
