"""
Recommendations router — serves content-based and popularity-based product recommendations.

GET /api/recommendations/{user_id}?session_id=<str>&product_id=<int>&top_k=<int>
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from ..database import get_db
from ..models import InteractionLog, Product
from ..ml.inference import get_recommendations

router = APIRouter()


@router.get("/{user_id}")
def get_user_recommendations(
    user_id: int,
    session_id: str = Query(..., description="Current browser session ID"),
    product_id: Optional[int] = Query(None, description="Focus product ID for similar recommendations"),
    top_k: int = Query(5, ge=1, le=20, description="Number of recommendations to return"),
    db: Session = Depends(get_db),
):
    """
    Return product recommendations for a given user/session.
    If product_id is provided, returns similar products.
    Otherwise, returns popular/trending products.
    """

    # Fetch recent interaction history
    query = (
        db.query(InteractionLog)
        .filter(
            (InteractionLog.user_id == user_id) |
            (InteractionLog.session_id == session_id)
        )
        .order_by(InteractionLog.timestamp.asc())
        .limit(50)
    )
    logs = query.all()

    # Serialise ORM rows to plain dicts
    interactions: List[dict] = [
        {"product_id": log.product_id, "action_type": log.action_type}
        for log in logs
    ]

    # Count available products in the DB
    num_products = db.query(Product).count()
    if num_products == 0:
        return {"user_id": user_id, "session_id": session_id, "recommendations": []}

    # Run recommendation inference
    recommended_ids = get_recommendations(
        db=db,
        interactions=interactions,
        top_k=top_k,
        product_id=product_id,
    )

    # Filter out IDs that don't exist in the DB
    valid_ids = {
        row.id
        for row in db.query(Product.id).filter(Product.id.in_(recommended_ids)).all()
    }
    recommended_ids = [pid for pid in recommended_ids if pid in valid_ids]

    # Fall back if empty
    if not recommended_ids:
        fallback = (
            db.query(Product.id)
            .order_by(Product.id.desc())
            .limit(top_k)
            .all()
        )
        recommended_ids = [row.id for row in fallback]

    return {
        "user_id": user_id,
        "session_id": session_id,
        "recommendations": recommended_ids,
        "agent": "content-based" if product_id else "popularity",
        "num_history_events": len(interactions),
    }
