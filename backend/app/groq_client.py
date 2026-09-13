import json
import re
from typing import List, Dict

from groq import Groq

from .config import GROQ_API_KEY, GROQ_MODEL

_client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None


def _get_client() -> Groq:
    global _client
    if _client is None:
        if not GROQ_API_KEY:
            raise RuntimeError(
                "GROQ_API_KEY no configurada. Definila en backend/.env"
            )
        _client = Groq(api_key=GROQ_API_KEY)
    return _client


def chat_completion(messages: List[Dict[str, str]], temperature: float = 0.6) -> str:
    client = _get_client()
    completion = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=messages,
        temperature=temperature,
    )
    return completion.choices[0].message.content or ""


def extract_json(text: str) -> dict:
    """Extrae el primer bloque JSON válido de la respuesta del modelo."""
    text = text.strip()
    text = re.sub(r"^```(json)?", "", text)
    text = re.sub(r"```$", "", text).strip()
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if not match:
        raise ValueError(f"No se encontró JSON en la respuesta del modelo: {text[:200]}")
    return json.loads(match.group(0))
