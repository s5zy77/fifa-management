from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlmodel import Session
from typing import Optional

from app.database import get_session
from app.models.feedback import Feedback

router = APIRouter(prefix="/api/feedback", tags=["feedback"])

class FeedbackRequest(BaseModel):
    zoneId: str
    direction: str # "up" or "down"
    user_id: Optional[int] = None
    session_id: Optional[str] = None

@router.post("/")
def submit_feedback(req: FeedbackRequest, session: Session = Depends(get_session)):
    feedback = Feedback(
        zone_id=req.zoneId,
        direction=req.direction,
        user_id=req.user_id,
        session_id=req.session_id
    )
    session.add(feedback)
    session.commit()
    return {"status": "ok"}
