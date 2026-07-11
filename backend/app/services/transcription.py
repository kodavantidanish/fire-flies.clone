# File: services/transcription.py
#
# Uses Gemini's native audio understanding to transcribe AND diarize
# (label speakers) in a single call — no separate diarization model needed.
#
# Requires GEMINI_API_KEY in backend/.env (same key used for summarize/chat).

from __future__ import annotations

import os
import tempfile
import time

from google import genai

_client: genai.Client | None = None

# Max time to wait for Gemini to finish processing an uploaded audio file
# before giving up (large files take longer to become ACTIVE).
_MAX_PROCESSING_WAIT_SECONDS = 120
_POLL_INTERVAL_SECONDS = 2

DIARIZATION_PROMPT = """Transcribe this audio recording completely and accurately.

Identify each distinct speaker and label them consistently as "Speaker 1",
"Speaker 2", "Speaker 3", etc. — use the same label for the same person every
time they speak, throughout the whole recording. If you can confidently infer
a speaker's real name from context (e.g. someone is addressed by name, or
introduces themselves), use that name instead of "Speaker N" for the rest of
the transcript.

For each speaker turn, prefix it with your best estimate of the timestamp
(minutes:seconds from the start of the recording) in square brackets, in the
exact format [MM:SS]. Estimate this from the audio itself — track elapsed
time as the recording progresses. These are estimates, not exact — do your
best to keep them roughly accurate and steadily increasing throughout.

Format the output as plain text, one speaker turn per paragraph, like this:

[00:00] Speaker 1: Hey everyone, thanks for joining.
[00:04] Speaker 2: Of course, glad to be here.
[00:07] Speaker 1: Let's get started with the agenda.

Only output the transcript in this exact format. No preamble, no summary,
no markdown formatting, no extra commentary before or after."""


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


async def transcribe_audio(audio_bytes: bytes, filename: str) -> str:
    """
    Transcribes audio with speaker labels using Gemini's native audio input.

    Returns plain text like:
        Speaker 1: ...
        Speaker 2: ...

    Raises:
        RuntimeError: If GEMINI_API_KEY is missing, or if Gemini fails to
                      process the uploaded audio file.
    """
    client = _get_client()

    suffix = os.path.splitext(filename)[1] or ".mp3"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name

    uploaded_file = None
    try:
        # Files API handles large audio well (vs. inlining raw bytes in the prompt)
        uploaded_file = client.files.upload(file=tmp_path)

        # Audio files are processed asynchronously on Google's side before
        # they can be referenced in a generate_content call — poll until ready.
        waited = 0
        while uploaded_file.state.name == "PROCESSING":
            if waited >= _MAX_PROCESSING_WAIT_SECONDS:
                raise RuntimeError(
                    "Timed out waiting for Gemini to process the audio file."
                )
            time.sleep(_POLL_INTERVAL_SECONDS)
            waited += _POLL_INTERVAL_SECONDS
            uploaded_file = client.files.get(name=uploaded_file.name)

        if uploaded_file.state.name == "FAILED":
            raise RuntimeError("Gemini failed to process the uploaded audio file.")

        response = client.models.generate_content(
            model="gemini-3.5-flash",
            contents=[DIARIZATION_PROMPT, uploaded_file],
        )
        return response.text.strip()

    finally:
        os.unlink(tmp_path)
        if uploaded_file is not None:
            try:
                client.files.delete(name=uploaded_file.name)
            except Exception:
                pass  # cleanup is best-effort; don't fail the request over it