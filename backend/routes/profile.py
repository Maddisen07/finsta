import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db import get_db
from models import UserProfile, ChatMessage, ChatSession
from schemas import UserProfileSchema, UserProfileResponse

router = APIRouter(prefix="/api/profile", tags=["Profile"])


@router.get("", response_model=UserProfileResponse)
def get_user_profile(db: Session = Depends(get_db)):
    profile = db.query(UserProfile).first()
    if not profile:
        # Create default
        profile = UserProfile(
            currency="USD",
            monthly_income=5000.0,
            monthly_expenses=2500.0,
            risk_tolerance="moderate",
            primary_goal="Build emergency fund & invest in index funds"
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile


@router.post("", response_model=UserProfileResponse)
def update_user_profile(data: UserProfileSchema, db: Session = Depends(get_db)):
    profile = db.query(UserProfile).first()
    if not profile:
        profile = UserProfile(**data.model_dump())
        db.add(profile)
    else:
        profile.currency = data.currency
        profile.monthly_income = data.monthly_income
        profile.monthly_expenses = data.monthly_expenses
        profile.risk_tolerance = data.risk_tolerance
        profile.primary_goal = data.primary_goal
        profile.updated_at = datetime.datetime.utcnow()

    db.commit()
    db.refresh(profile)
    return profile


@router.delete("")
def clear_all_user_data(db: Session = Depends(get_db)):
    """Wipes user profile and all conversation history ('Clear my data')."""
    db.query(ChatMessage).delete()
    db.query(ChatSession).delete()
    db.query(UserProfile).delete()
    db.commit()
    return {"message": "All user data, profile, and conversation histories successfully cleared."}
