from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

# Load .env in development (no-op in production where vars are set externally)
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # python-dotenv is optional — env vars can be set directly

from .database import Base, engine
from .routers import meetings, uploads

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Firelog API", version="1.0.0")

origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("static/audio", exist_ok=True)
app.mount("/audio", StaticFiles(directory="static/audio"), name="audio")

app.include_router(meetings.router)
app.include_router(uploads.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
