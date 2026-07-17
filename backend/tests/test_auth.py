import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from passlib.context import CryptContext

from app.main import app
from app.database import get_session
from app.models.user import User

# In-memory SQLite for testing
engine = create_engine("sqlite://", connect_args={"check_same_thread": False})
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

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

def test_signup_secure_password(client: TestClient, session: Session):
    response = client.post("/api/auth/signup", json={"email": "test@example.com", "password": "securepassword"})
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    
    # Verify password is not plaintext
    user = session.get(User, data["user_id"])
    assert user.hashed_password != "securepassword"
    assert pwd_context.verify("securepassword", user.hashed_password)
