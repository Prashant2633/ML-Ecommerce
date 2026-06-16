"""
Orders router — Handles creating orders, listing order history.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
import uuid
from ..database import get_db
from ..models import Order, User

router = APIRouter()

class OrderItem(BaseModel):
    product_id: int
    title: str
    price: float
    quantity: int
    image_url: Optional[str] = None

class ShippingAddress(BaseModel):
    name: str
    email: str
    address: str
    city: str
    state: str
    zip_code: str

class OrderCreate(BaseModel):
    user_id: Optional[int] = None
    region_code: str
    items: List[OrderItem]
    subtotal: float
    tax: float
    shipping_cost: float
    total: float
    shipping_address: ShippingAddress
    payment_method: str

@router.post("/", status_code=201)
def create_order(payload: OrderCreate, db: Session = Depends(get_db)):
    """Create a new order in database."""
    # Generate unique order number
    order_number = f"NEX-{uuid.uuid4().hex[:6].upper()}"
    
    # Check if user exists if user_id is provided
    if payload.user_id:
        user = db.query(User).filter(User.id == payload.user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
    
    order = Order(
        user_id=payload.user_id,
        order_number=order_number,
        region_code=payload.region_code,
        items=[item.dict() for item in payload.items],
        subtotal=payload.subtotal,
        tax=payload.tax,
        shipping_cost=payload.shipping_cost,
        total=payload.total,
        shipping_address=payload.shipping_address.dict(),
        payment_method=payload.payment_method,
        status="Completed"
    )
    
    db.add(order)
    db.commit()
    db.refresh(order)
    return order

@router.get("/")
def get_orders(user_id: Optional[int] = None, db: Session = Depends(get_db)):
    """List all orders, optionally filtered by user_id."""
    query = db.query(Order)
    if user_id is not None:
        query = query.filter(Order.user_id == user_id)
    orders = query.order_by(Order.created_at.desc()).all()
    return orders

@router.get("/{order_number}")
def get_order_by_number(order_number: str, db: Session = Depends(get_db)):
    """Retrieve details of an order by its number."""
    order = db.query(Order).filter(Order.order_number == order_number).first()
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    return order
