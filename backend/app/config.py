"""
Startup configuration — validates required environment variables.
Any missing variable raises RuntimeError immediately (fail fast, never silently).
"""
from __future__ import annotations
import os


def _require(name: str) -> str:
    """Return the env var value, or raise a clear RuntimeError."""
    value = os.environ.get(name)
    if not value:
        raise RuntimeError(
            f"Missing required environment variable: {name}. "
            f"Add it to your .env file and restart the server."
        )
    return value


def load_cloudinary() -> None:
    """
    Configure the Cloudinary SDK from environment variables.

    Required env vars (add to backend/.env):
        CLOUDINARY_CLOUD_NAME=your_cloud_name
        CLOUDINARY_API_KEY=your_api_key
        CLOUDINARY_API_SECRET=your_api_secret

    Sign up at https://cloudinary.com (free tier is sufficient).
    Find these values in the Cloudinary Dashboard → Settings → API Keys.
    """
    import cloudinary  # type: ignore

    cloud_name = _require("CLOUDINARY_CLOUD_NAME")
    api_key = _require("CLOUDINARY_API_KEY")
    api_secret = _require("CLOUDINARY_API_SECRET")

    cloudinary.config(
        cloud_name=cloud_name,
        api_key=api_key,
        api_secret=api_secret,
        secure=True,
    )
