from fastapi import FastAPI
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

# Load environment variables FIRST, before importing routes/services
load_dotenv()

from .database import create_db_and_tables
from .routes import profile
from .routes import plan
from .routes import upload
from .routes import auth
from .routes import feedback

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB
    create_db_and_tables()
    yield

app = FastAPI(title="CalmGate API", lifespan=lifespan)

app.include_router(profile.router)
app.include_router(plan.router)
app.include_router(upload.router)
app.include_router(auth.router)
app.include_router(feedback.router)

@app.get("/health")
def health_check():
    return {"status": "ok"}
