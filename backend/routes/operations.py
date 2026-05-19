from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from auth import get_current_user, require_roles
from models import User, Operation



router = APIRouter(prefix="/api/operations", tags=["operations"])

@router.get("/my")
def get_my_operations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rows = (
        db.query(Operation)
        .filter(Operation.user_id == current_user.id)
        .order_by(Operation.created_at.desc())
        .all()
    )

    return {
        "items": [
            {
                "id": r.id,
                "created_at": r.created_at.isoformat(),
                "user_id": r.user_id,
                "operation_type": r.operation_type,
                "rate_id": r.rate_id,
            }
            for r in rows
        ]
    }

@router.get("")
def get_all_operations(
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(["seller"])),
):
    rows = db.query(Operation).order_by(Operation.created_at.desc()).all()

    return {
        "items": [
            {
                "id": r.id,
                "created_at": r.created_at.isoformat(),
                "user_id": r.user_id,
                "operation_type": r.operation_type,
                "rate_id": r.rate_id,
            }
            for r in rows
        ]
    }