from fastapi import FastAPI
from contextlib import asynccontextmanager
from .database import create_db_and_tables
from .routes import profile
from .routes import plan
from .routes import upload

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB
    create_db_and_tables()
    yield

app = FastAPI(title="CalmGate API", lifespan=lifespan)

app.include_router(profile.router)
app.include_router(plan.router)
app.include_router(upload.router)

@app.get("/health")
def health_check():
    return {"status": "ok"}
