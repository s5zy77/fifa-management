import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
import json

from app.main import app
from app.database import get_session
from app.models.user import User
from app.models.profile import SensoryProfile
from app.models.feedback import Feedback
from app.services.llm import llm_service

# In-memory SQLite for testing
engine = create_engine("sqlite://", connect_args={"check_same_thread": False})

@pytest.fixture(name="session")
def session_fixture():
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session
    SQLModel.metadata.drop_all(engine)

@pytest.fixture(name="client")
def client_fixture(session: Session):
    def get_session_override():
        return session
    app.dependency_overrides[get_session] = get_session_override
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()

def test_feedback_loop_respects_downvote(client: TestClient, session: Session, monkeypatch):
    # Setup user
    user = User(email="test@example.com", hashed_password="pw")
    session.add(user)
    session.commit()
    session.refresh(user)
    
    # Setup profile
    profile = SensoryProfile(
        id="test-profile",
        sensitivity={"noise": 5, "light": 5, "crowd": 5, "movement": 5, "quietExit": False, "serviceAnimal": False}
    )
    session.add(profile)
    session.commit()

    # Submit negative feedback for GATE_N
    client.post("/api/feedback/", json={
        "zoneId": "GATE_N",
        "direction": "down",
        "user_id": user.id
    })

    # Mock the LLM call to return the recommended gate based on the prompt
    def mock_generate_json(system_prompt, user_prompt):
        if "historically_overwhelming_zones_to_avoid" in user_prompt:
            prompt_data = json.loads(user_prompt.split("Context: ")[1].split("\n")[0])
            avoid = prompt_data.get("historically_overwhelming_zones_to_avoid", [])
            # In our test, if GATE_N is in avoid, recommend GATE_S instead
            if "GATE_N" in avoid:
                return {"bestArrivalWindow": "12:00-12:30", "recommendedGate": "GATE_S", "nearestResetZone": "RESET_1", "explanation": "Avoided GATE_N based on your feedback."}
        return {"bestArrivalWindow": "12:00-12:30", "recommendedGate": "GATE_N", "nearestResetZone": "RESET_1", "explanation": "Default gate."}
        
    monkeypatch.setattr(llm_service, "generate_json_completion", mock_generate_json)

    # Call the plan API
    response = client.post("/api/plan", json={
        "profileId": "test-profile",
        "seatSection": "SEC_101",
        "userId": user.id
    })
    
    assert response.status_code == 200
    plan_data = response.json()["plan"]
    assert plan_data["recommendedGate"] != "GATE_N"
    assert plan_data["recommendedGate"] == "GATE_S"
