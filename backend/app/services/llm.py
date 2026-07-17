import os
from openai import OpenAI
import json

class LLMService:
    def __init__(self):
        # We initialize the client using standard environment variables.
        # This makes it generic and compatible with OpenAI, Azure, or OSS endpoints.
        self.api_key = os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            raise RuntimeError("CRITICAL STARTUP ERROR: OPENAI_API_KEY is not set in the environment. The backend cannot start.")
            
        base_url = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
        is_google = "googleapis.com" in base_url
        headers = {}
        # Google's OpenAI-compatibility endpoint authenticates via x-goog-api-key header
        # and ignores the Bearer token, so we pass the real key there
        # and use a dummy placeholder for the openai client's Bearer requirement.
        if is_google:
            headers["x-goog-api-key"] = self.api_key

        self.client = OpenAI(
            api_key=self.api_key if not is_google else "not-used",
            base_url=base_url,
            default_headers=headers
        )
        # Using a very low temperature (0.2) to ensure the AI's reasoning is 
        # consistent and highly deterministic for identical inputs during demo.
        # We don't want the AI to invent wild new routes randomly if the 
        # sensory conditions haven't changed.
        self.temperature = 0.2
        self.model = os.getenv("OPENAI_MODEL_NAME", "gpt-4-turbo")
        
        print(f"LLM configured: model={self.model}, base_url={self.client.base_url}")

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
                print(f"LLM API Call Exception: {str(e)}")
                raise Exception(f"LLM API Call failed: {str(e)}")

llm_service = LLMService()
