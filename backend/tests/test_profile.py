from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
import pytest
import sys
import os

# Ensure backend directory is in path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.main import app
from app.database import get_session

sqlite_url = "sqlite:///./test.db"
engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})

def get_session_override():
    with Session(engine) as session:
        yield session

app.dependency_overrides[get_session] = get_session_override

@pytest.fixture(name="client")
def client_fixture():
    SQLModel.metadata.create_all(engine)
    client = TestClient(app)
    yield client
    SQLModel.metadata.drop_all(engine)

def test_create_profile(client: TestClient):
    payload = {
        "preferredLanguage": "en",
        "sensitivity": {
            "noise": 8,
            "light": 5,
            "crowd": 9,
            "movement": 2,
            "quietExit": True,
            "serviceAnimal": False
        }
    }
    response = client.post("/api/profile/", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "id" in data
    assert data["preferredLanguage"] == "en"
    assert data["sensitivity"]["noise"] == 8

def test_get_profile(client: TestClient):
    payload = {
        "preferredLanguage": "fr",
        "sensitivity": {
            "noise": 2,
            "light": 2,
            "crowd": 2,
            "movement": 2,
            "quietExit": False,
            "serviceAnimal": True
        }
    }
    response = client.post("/api/profile/", json=payload)
    profile_id = response.json()["id"]

    response = client.get(f"/api/profile/{profile_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == profile_id
    assert data["preferredLanguage"] == "fr"
