"""
Summarization service — Gemini implementation (google-genai SDK).

Requires GEMINI_API_KEY to be set in backend/.env:
    GEMINI_API_KEY=your_key_here

Get a free-tier key at: https://aistudio.google.com/apikey
"""
from __future__ import annotations
import json
import os
from typing import Any, Dict

from google import genai

_client: genai.Client | None = None


def _get_client() -> genai.Client:
    global _client
    if _client is None:
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            raise RuntimeError(
                "No GEMINI_API_KEY set. Add it to backend/.env:\n"
                "  GEMINI_API_KEY=your_key_here\n"
                "Get a free-tier key at https://aistudio.google.com/apikey"
            )
        _client = genai.Client(api_key=api_key)
    return _client


async def summarize_transcript(transcript: str) -> Dict[str, Any]:
    """
    Summarize a meeting transcript into an overview and action items.

    Args:
        transcript: Plain text of the full transcript.

    Returns:
        A dict with shape:
            {
                "overview": str,
                "action_items": [
                    {"text": str, "assignee": str | None},
                    ...
                ]
            }

    Raises:
        RuntimeError: If GEMINI_API_KEY is not set.
        json.JSONDecodeError: If the model does not return valid JSON.
    """
    client = _get_client()

    prompt = f"""Summarize this meeting/recording transcript. Return ONLY valid JSON,
no markdown formatting, no code fences, in this exact shape:
{{"overview": "2-3 sentence summary", "action_items": [{{"text": "...", "assignee": null}}]}}

Transcript:
{transcript}"""

    response = client.models.generate_content(
        model="gemini-3.5-flash",
        contents=prompt,
    )
    text = response.text.strip().removeprefix("```json").removesuffix("```").strip()
    return json.loads(text)