from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional
import json
import string
import random

from ..services.dataset import get_dataset, DatasetStore
from ..services.llm import llm_service
from ..models.profile import SensoryProfile
from ..models.feedback import Feedback
from ..models.shared_plan import SharedPlan
from ..database import get_session
from sqlmodel import Session, select

router = APIRouter(prefix="/api", tags=["reasoning"])

class PlanRequest(BaseModel):
    profileId: str
    seatSection: str
    companionProfile: Optional[Dict[str, Any]] = None
    userId: Optional[int] = None

class RerouteRequest(BaseModel):
    profileId: str
    currentZoneId: str

class QuietZoneRequest(BaseModel):
    profileId: str
    currentZoneId: str

class ShareRequest(BaseModel):
    gate_name: str
    arrival_window: str
    reset_zone_name: str
    reasoning: str
    userId: Optional[int] = None

@router.post("/plan")
def generate_plan(req: PlanRequest, session: Session = Depends(get_session), dataset: DatasetStore = Depends(get_dataset)):
    profile = session.get(SensoryProfile, req.profileId)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
        
    system_prompt = "You are CalmGate AI, a reasoning engine that helps fans with sensory sensitivities navigate stadium environments. Output ONLY strict JSON."
    
    past_feedback = []
    if req.userId:
        fb_records = session.exec(select(Feedback).where(Feedback.user_id == req.userId, Feedback.direction == "down")).all()
        past_feedback = [fb.zone_id for fb in fb_records]

    # Deterministic Data Assembly
    context = {
        "match": dataset.match,
        "gates": [z for z in dataset.zones if z.get("type") == "gate"],
        "seat": req.seatSection,
        "user_profile": {
            "sensitivity": profile.sensitivity,
            "preferredLanguage": profile.preferredLanguage
        },
        "companion_profile": req.companionProfile,
        "historically_overwhelming_zones_to_avoid": past_feedback
    }
    
    user_prompt = f"""Given the following stadium data and user sensory profile, generate a personalized visit plan.
    Context: {json.dumps(context)}
    
    Return a JSON object with:
    - bestArrivalWindow (e.g. '12:00-12:30')
    - recommendedGate (zoneId)
    - nearestResetZone (zoneId)
    - explanation (A clear explanation of why this plan was chosen based on the user's specific sensitivities, the companion's profile if any, any historically overwhelming zones to avoid, and predicted gate congestion. Write in their preferred language).
    """
    
    try:
        # GenAI Call
        result = llm_service.generate_json_completion(system_prompt, user_prompt)
        return {"plan": result, "source": "GenAI"}
    except Exception as e:
        print(f"ERROR calling LLM API: {e}")
        raise HTTPException(status_code=503, detail="LLM API temporarily unavailable. Please try again later.")

@router.post("/reroute")
def generate_reroute(req: RerouteRequest, session: Session = Depends(get_session), dataset: DatasetStore = Depends(get_dataset)):
    profile = session.get(SensoryProfile, req.profileId)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
        
    system_prompt = "You are CalmGate AI. You suggest alternative routes when a user's sensory limits are breached. Output ONLY strict JSON."
    
    current_zone = dataset.get_zone(req.currentZoneId)
    if not current_zone:
        raise HTTPException(status_code=400, detail="Invalid current zone")
        
    current_signal = dataset.get_current_signal(req.currentZoneId)
    
    adjacent = []
    adj_signals = {}
    for z_id in current_zone.get("adjacentZones", []):
        z = dataset.get_zone(z_id)
        if z:
            adjacent.append(z)
            adj_signals[z_id] = dataset.get_current_signal(z_id)
    
    # Deterministic Data Assembly
    context = {
        "current_zone": current_zone,
        "current_conditions": current_signal,
        "adjacent_options": adjacent,
        "adjacent_conditions": adj_signals,
        "user_profile": {
            "sensitivity": profile.sensitivity,
            "preferredLanguage": profile.preferredLanguage
        }
    }
    
    user_prompt = f"""The user is currently in a zone experiencing a sensory spike. Recommend the best alternative adjacent zone to move to.
    Context: {json.dumps(context)}
    
    Return a JSON object with:
    - recommendedZone (zoneId)
    - explanation (Reasoning for this choice based on the user's sensitivities and the conditions of the adjacent zones, in their preferred language).
    """
    
    try:
        # GenAI Call
        result = llm_service.generate_json_completion(system_prompt, user_prompt)
        return {"reroute": result, "source": "GenAI"}
    except Exception as e:
        print(f"ERROR calling LLM API: {e}")
        raise HTTPException(status_code=503, detail="LLM API temporarily unavailable.")

@router.post("/quiet-zone")
def find_quiet_zone(req: QuietZoneRequest, session: Session = Depends(get_session), dataset: DatasetStore = Depends(get_dataset)):
    profile = session.get(SensoryProfile, req.profileId)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
        
    system_prompt = "You are CalmGate AI. You find the best path to a quiet/reset zone. Output ONLY strict JSON."
    
    current_zone = dataset.get_zone(req.currentZoneId)
    if not current_zone:
        raise HTTPException(status_code=400, detail="Invalid current zone")
        
    reset_zones = [z for z in dataset.zones if z.get("type") == "reset"]
    
    # Deterministic Data Assembly
    context = {
        "current_zone": current_zone,
        "reset_zones": reset_zones,
        "user_profile": {
            "sensitivity": profile.sensitivity,
            "preferredLanguage": profile.preferredLanguage
        }
    }
    
    user_prompt = f"""Find the most appropriate reset zone for the user. Consider walk times and the user's specific sensitivities.
    Context: {json.dumps(context)}
    
    Return a JSON object with:
    - targetZone (zoneId)
    - expectedWalkTimeSeconds
    - explanation (Why this zone is best for them, in their preferred language).
    """
    
    try:
        # GenAI Call
        result = llm_service.generate_json_completion(system_prompt, user_prompt)
        return {"quietZone": result, "source": "GenAI"}
    except Exception as e:
        print(f"ERROR calling LLM API: {e}")
        raise HTTPException(status_code=503, detail="LLM API temporarily unavailable.")

@router.post("/plan/share")
def share_plan(req: ShareRequest, session: Session = Depends(get_session)):
    short_id = ''.join(random.choices(string.ascii_letters + string.digits, k=8))
    shared = SharedPlan(
        short_id=short_id,
        gate_name=req.gate_name,
        arrival_window=req.arrival_window,
        reset_zone_name=req.reset_zone_name,
        reasoning=req.reasoning,
        user_id=req.userId
    )
    session.add(shared)
    session.commit()
    return {"short_id": short_id}

@router.get("/plan/share/{short_id}")
def get_shared_plan(short_id: str, session: Session = Depends(get_session)):
    shared = session.get(SharedPlan, short_id)
    if not shared:
        raise HTTPException(status_code=404, detail="Plan not found")
    return {
        "gate_name": shared.gate_name,
        "arrival_window": shared.arrival_window,
        "reset_zone_name": shared.reset_zone_name,
        "reasoning": shared.reasoning
    }

@router.get("/live-signals")
def get_live_signals(dataset: DatasetStore = Depends(get_dataset)):
    # Return all current signals and zones for the frontend to render the map
    # and evaluate real-time spikes organically.
    current_signals = {}
    for z in dataset.zones:
        sig = dataset.get_current_signal(z.get("zoneId"))
        if sig:
            current_signals[z.get("zoneId")] = sig
            
    return {
        "match": dataset.match,
        "zones": dataset.zones,
        "liveSignals": current_signals
    }
