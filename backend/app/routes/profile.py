from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from ..database import get_session
from ..models.profile import SensoryProfile, SensoryProfileCreate, SensoryProfileRead

router = APIRouter(prefix="/api/profile", tags=["profile"])

@router.post("/", response_model=SensoryProfileRead)
def create_profile(profile_in: SensoryProfileCreate, session: Session = Depends(get_session)):
    db_profile = SensoryProfile(
        preferredLanguage=profile_in.preferredLanguage,
        sensitivity=profile_in.sensitivity.model_dump()
    )
    session.add(db_profile)
    session.commit()
    session.refresh(db_profile)
    return db_profile

@router.get("/{profile_id}", response_model=SensoryProfileRead)
def get_profile(profile_id: str, session: Session = Depends(get_session)):
    profile = session.get(SensoryProfile, profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile
