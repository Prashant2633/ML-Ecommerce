from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
import datetime
from sqlalchemy.orm.attributes import flag_modified
from ..database import get_db
from ..models import Product

router = APIRouter()

class ReviewCreate(BaseModel):
    name: str
    rating: int
    comment: str

@router.get("/")
def get_products(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    products = db.query(Product).offset(skip).limit(limit).all()
    return products

@router.get("/{product_id}")
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.post("/{product_id}/reviews")
def add_product_review(product_id: int, payload: ReviewCreate, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check rating bounds
    if payload.rating < 1 or payload.rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
        
    reviews_list = product.reviews or []
    
    new_review = {
        "name": payload.name,
        "rating": payload.rating,
        "comment": payload.comment,
        "date": datetime.datetime.now().strftime("%B %d, %Y")
    }
    
    # Add new review to the top of list
    reviews_list = [new_review] + reviews_list
    product.reviews = reviews_list
    
    # Recalculate average rating and count
    product.review_count = len(reviews_list)
    product.rating = round(sum(r["rating"] for r in reviews_list) / len(reviews_list), 1)
    
    flag_modified(product, "reviews")
    db.commit()
    db.refresh(product)
    return product

