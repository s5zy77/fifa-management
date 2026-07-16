from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
import pytest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.main import app
from app.database import get_session
from app.services.llm import llm_service
from app.services.dataset import get_dataset, DatasetStore

sqlite_url = "sqlite:///./test_endpoints.db"
engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})

def get_session_override():
    with Session(engine) as session:
        yield session

def get_dataset_override():
    ds = DatasetStore()
    ds.match = {"matchId": "test-match"}
    ds.zones = [
        {"zoneId": "GATE-1", "type": "gate", "adjacentZones": ["CONC-1"]},
        {"zoneId": "CONC-1", "type": "concourse", "adjacentZones": ["GATE-1", "RESET-1"]},
        {"zoneId": "RESET-1", "type": "reset"}
    ]
    ds.signals = [
        {"zoneId": "GATE-1", "noiseDb": 80},
        {"zoneId": "CONC-1", "noiseDb": 90},
        {"zoneId": "RESET-1", "noiseDb": 40}
    ]
    return ds

app.dependency_overrides[get_session] = get_session_override
app.dependency_overrides[get_dataset] = get_dataset_override

@pytest.fixture(name="client_fixture")
def client_fixture_func():
    SQLModel.metadata.create_all(engine)
    client = TestClient(app)
    
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
    profile_id = response.json()["id"]
    
    yield client, profile_id
    SQLModel.metadata.drop_all(engine)

def test_plan_endpoint(client_fixture, monkeypatch):
    client, profile_id = client_fixture
    
    def mock_completion(sys_prompt, user_prompt):
        return {"bestArrivalWindow": "12:00", "recommendedGate": "GATE-1", "nearestResetZone": "RESET-1", "explanation": "Test"}
        
    monkeypatch.setattr(llm_service, "generate_json_completion", mock_completion)
    
    res = client.post("/api/plan", json={"profileId": profile_id, "seatSection": "SEC-1"})
    assert res.status_code == 200
    assert res.json()["plan"]["recommendedGate"] == "GATE-1"
    assert res.json()["source"] == "GenAI"

def test_graceful_degradation_plan(client_fixture, monkeypatch):
    client, profile_id = client_fixture
    
    def mock_completion_fail(sys_prompt, user_prompt):
        raise Exception("API Timeout")
        
    monkeypatch.setattr(llm_service, "generate_json_completion", mock_completion_fail)
    
    res = client.post("/api/plan", json={"profileId": profile_id, "seatSection": "SEC-1"})
    assert res.status_code == 503
    assert "LLM API temporarily unavailable" in res.json()["detail"]

def test_graceful_degradation_malformed_json(client_fixture, monkeypatch):
    client, profile_id = client_fixture
    
    def mock_completion_fail(sys_prompt, user_prompt):
        raise Exception("Malformed JSON after retry")
        
    monkeypatch.setattr(llm_service, "generate_json_completion", mock_completion_fail)
    
    res = client.post("/api/plan", json={"profileId": profile_id, "seatSection": "SEC-1"})
    assert res.status_code == 503
    assert "LLM API temporarily unavailable" in res.json()["detail"]

def test_reroute_endpoint(client_fixture, monkeypatch):
    client, profile_id = client_fixture
    
    def mock_completion(sys_prompt, user_prompt):
        return {"recommendedZone": "RESET-1", "explanation": "Too loud"}
        
    monkeypatch.setattr(llm_service, "generate_json_completion", mock_completion)
    
    res = client.post("/api/reroute", json={"profileId": profile_id, "currentZoneId": "CONC-1"})
    assert res.status_code == 200
    assert res.json()["reroute"]["recommendedZone"] == "RESET-1"

def test_quiet_zone_endpoint(client_fixture, monkeypatch):
    client, profile_id = client_fixture
    
    def mock_completion(sys_prompt, user_prompt):
        return {"targetZone": "RESET-1", "expectedWalkTimeSeconds": 60, "explanation": "Quiet"}
        
    monkeypatch.setattr(llm_service, "generate_json_completion", mock_completion)
    
    res = client.post("/api/quiet-zone", json={"profileId": profile_id, "currentZoneId": "CONC-1"})
    assert res.status_code == 200
    assert res.json()["quietZone"]["targetZone"] == "RESET-1"
