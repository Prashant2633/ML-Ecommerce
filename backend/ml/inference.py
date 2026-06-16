"""
ML Inference Module — serves Content-Based and Popularity-based recommendations.
"""
from typing import List, Optional
import numpy as np
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..models import Product, InteractionLog

def calculate_product_similarity(p1: Product, p2: Product) -> float:
    """Calculate similarity between two products based on attributes."""
    if p1.id == p2.id:
        return -1.0

    score = 0.0

    # 1. Category similarity
    if p1.category == p2.category:
        score += 5.0

    # 2. Text keyword match (title & description)
    words1 = set(f"{p1.title} {p1.description}".lower().split())
    words2 = set(f"{p2.title} {p2.description}".lower().split())
    # Remove common stop words
    stopwords = {"and", "with", "the", "a", "of", "in", "by", "for", "on", "is", "to", "this", "it", "an"}
    words1 -= stopwords
    words2 -= stopwords

    overlap = len(words1.intersection(words2))
    score += overlap * 1.5

    # 3. Price similarity
    max_price = max(p1.price, p2.price, 1.0)
    price_diff = abs(p1.price - p2.price) / max_price
    score += (1.0 - price_diff) * 1.0

    return score

def get_content_based_recommendations(db: Session, product_id: int, top_k: int = 5) -> List[int]:
    """Recommend products similar to the given product_id."""
    target_product = db.query(Product).filter(Product.id == product_id).first()
    if not target_product:
        return []

    # Get all other products
    all_products = db.query(Product).filter(Product.id != product_id).all()
    if not all_products:
        return []

    # Calculate similarity scores
    scored_products = []
    for p in all_products:
        score = calculate_product_similarity(target_product, p)
        scored_products.append((p.id, score))

    # Sort descending by score
    scored_products.sort(key=lambda x: x[1], reverse=True)
    return [pid for pid, _ in scored_products[:top_k]]

def get_popular_recommendations(db: Session, top_k: int = 5) -> List[int]:
    """Recommend products based on popularity (telemetry logs count)."""
    # Count occurrences in InteractionLog
    counts = (
        db.query(InteractionLog.product_id, func.count(InteractionLog.id).label("cnt"))
        .group_by(InteractionLog.product_id)
        .order_by(func.count(InteractionLog.id).desc())
        .limit(top_k)
        .all()
    )
    product_ids = [row.product_id for row in counts]

    # Pad with newest products if not enough history
    if len(product_ids) < top_k:
        needed = top_k - len(product_ids)
        extras = (
            db.query(Product.id)
            .filter(~Product.id.in_(product_ids))
            .order_by(Product.id.desc())
            .limit(needed)
            .all()
        )
        product_ids.extend([row.id for row in extras])

    return product_ids

def get_recommendations(
    db: Session,
    interactions: List[dict],
    top_k: int = 5,
    product_id: Optional[int] = None,
) -> List[int]:
    """
    Public entry point for recommendations.
    Serves content-based recommendations if product_id is provided,
    otherwise serves popular/trending recommendations.
    """
    if product_id is not None:
        return get_content_based_recommendations(db, product_id, top_k)
    return get_popular_recommendations(db, top_k)
