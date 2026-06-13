from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from ..database import get_db
from ..models import InteractionLog

router = APIRouter()

class InteractionEvent(BaseModel):
    user_id: Optional[int]
    product_id: int
    action_type: str # 'click', 'add_to_cart', 'purchase', 'view'
    session_id: str

@router.post("/")
def log_interaction(event: InteractionEvent, db: Session = Depends(get_db)):
    interaction = InteractionLog(
        user_id=event.user_id,
        product_id=event.product_id,
        action_type=event.action_type,
        session_id=event.session_id
    )
    db.add(interaction)
    db.commit()
    return {"status": "recorded"}
