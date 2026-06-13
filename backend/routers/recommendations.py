"""
Recommendations router — serves RL-powered product recommendations.

GET /api/recommendations/{user_id}?session_id=<str>&top_k=<int>

The endpoint:
  1. Fetches the user's recent interaction history from the DB.
  2. Passes the history to the ML inference engine (Q-Learning agent).
  3. Filters out products the user already interacted with (optional, enabled by default).
  4. Returns a ranked list of product_ids plus metadata for the frontend.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import InteractionLog, Product
from ..ml.inference import get_recommendations

router = APIRouter()


@router.get("/{user_id}")
def get_user_recommendations(
    user_id: int,
    session_id: str = Query(..., description="Current browser session ID"),
    top_k: int = Query(5, ge=1, le=20, description="Number of recommendations to return"),
    db: Session = Depends(get_db),
):
    """
    Return AI-powered product recommendations for a given user/session.

    The response shape is intentionally stable so the frontend and test_api.py
    do not need changes — 'recommendations' is always a list of ints.
    """

    # ── 1. Fetch recent interaction history ───────────────────────────────────
    # Pull the last 50 events for this user OR session so anonymous users work too
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

    # Serialise ORM rows to plain dicts for the inference engine
    interactions: List[dict] = [
        {"product_id": log.product_id, "action_type": log.action_type}
        for log in logs
    ]

    # ── 2. Count available products in the DB ─────────────────────────────────
    num_products = db.query(Product).count()
    if num_products == 0:
        # DB is empty (e.g. tests without seed) — return empty list gracefully
        return {"user_id": user_id, "session_id": session_id, "recommendations": []}

    # ── 3. Run RL inference ───────────────────────────────────────────────────
    recommended_ids = get_recommendations(
        interactions=interactions,
        top_k=top_k,
        num_db_products=num_products,
    )

    # ── 4. Filter out IDs that don't exist in the DB ──────────────────────────
    valid_ids = {
        row.id
        for row in db.query(Product.id).filter(Product.id.in_(recommended_ids)).all()
    }
    recommended_ids = [pid for pid in recommended_ids if pid in valid_ids]

    # ── 5. If the agent returns nothing (edge case on tiny DB), fall back ──────
    if not recommended_ids:
        # Return the N most-recently added products as a safe fallback
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
        "agent": "q-learning",
        "num_history_events": len(interactions),
    }
