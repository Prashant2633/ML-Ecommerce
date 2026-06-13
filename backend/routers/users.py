"""
Users router — GET /api/users and POST /api/users
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from ..database import get_db
from ..models import User

router = APIRouter()


class UserCreate(BaseModel):
    email: str
    password: str  # raw; in production hash with bcrypt before storing


@router.get("/")
def get_users(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    """Return a paginated list of users (id + email only — never expose passwords)."""
    users = db.query(User).offset(skip).limit(limit).all()
    return [{"id": u.id, "email": u.email} for u in users]


@router.get("/{user_id}")
def get_user(user_id: int, db: Session = Depends(get_db)):
    """Return a single user by ID."""
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return {"id": user.id, "email": user.email}


@router.post("/", status_code=201)
def create_user(payload: UserCreate, db: Session = Depends(get_db)):
    """
    Create a new user.
    In production: hash the password with bcrypt before storing.
    """
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    # TODO: replace with bcrypt.hashpw in production
    hashed = f"hashed_{payload.password}"
    user = User(email=payload.email, hashed_password=hashed)
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"id": user.id, "email": user.email}
