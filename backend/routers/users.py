"""
Users router — Authentication, registration, and user profiles management.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from ..database import get_db
from ..models import User

router = APIRouter()


class UserCreate(BaseModel):
    email: str
    password: str


class UserLogin(BaseModel):
    email: str
    password: str


class UserUpdate(BaseModel):
    region_preference: Optional[str] = None
    saved_addresses: Optional[List[dict]] = None
    saved_payment_methods: Optional[List[dict]] = None
    wishlist: Optional[List[int]] = None
    cart: Optional[List[dict]] = None


@router.get("/")
def get_users(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    """Return a paginated list of users."""
    users = db.query(User).offset(skip).limit(limit).all()
    return [{"id": u.id, "email": u.email} for u in users]


@router.get("/{user_id}")
def get_user(user_id: int, db: Session = Depends(get_db)):
    """Return a single user by ID with profile details."""
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "id": user.id,
        "email": user.email,
        "region_preference": user.region_preference,
        "saved_addresses": user.saved_addresses or [],
        "saved_payment_methods": user.saved_payment_methods or [],
        "wishlist": user.wishlist or [],
        "cart": user.cart or []
    }


@router.post("/", status_code=201)
def create_user(payload: UserCreate, db: Session = Depends(get_db)):
    """Create a new user with mock hashed password."""
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    hashed = f"hashed_{payload.password}"
    user = User(email=payload.email, hashed_password=hashed)
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"id": user.id, "email": user.email}


@router.post("/login")
def login_user(payload: UserLogin, db: Session = Depends(get_db)):
    """Verify user credentials and return user details."""
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    expected_hash = f"hashed_{payload.password}"
    if user.hashed_password != expected_hash:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    return {
        "id": user.id,
        "email": user.email,
        "region_preference": user.region_preference,
        "saved_addresses": user.saved_addresses or [],
        "saved_payment_methods": user.saved_payment_methods or [],
        "wishlist": user.wishlist or [],
        "cart": user.cart or []
    }


@router.put("/{user_id}")
def update_user(user_id: int, payload: UserUpdate, db: Session = Depends(get_db)):
    """Update user profile settings (addresses, payment tokens, wishlist, region, cart)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if payload.region_preference is not None:
        user.region_preference = payload.region_preference
    if payload.saved_addresses is not None:
        user.saved_addresses = payload.saved_addresses
    if payload.saved_payment_methods is not None:
        user.saved_payment_methods = payload.saved_payment_methods
    if payload.wishlist is not None:
        user.wishlist = payload.wishlist
    if payload.cart is not None:
        user.cart = payload.cart

    db.commit()
    db.refresh(user)
    return {
        "id": user.id,
        "email": user.email,
        "region_preference": user.region_preference,
        "saved_addresses": user.saved_addresses or [],
        "saved_payment_methods": user.saved_payment_methods or [],
        "wishlist": user.wishlist or [],
        "cart": user.cart or []
    }

