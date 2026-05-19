from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from decimal import Decimal
from sqlalchemy.orm import Session

from database import get_db
from auth import get_current_user, require_roles
from models import User, UserBalance, Currency

router = APIRouter(prefix="/api/balances", tags=["balances"])

class TopUpBody(BaseModel):
    currency_id: int
    amount: Decimal = Field(..., gt=Decimal("0"))

@router.get("/my")
def get_my_balances(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    currencies = db.query(Currency).all()
    rows = (
        db.query(UserBalance)
        .filter(UserBalance.user_id == current_user.id)
        .all()
    )

    by_currency_id = {r.currency_id: r for r in rows}

    return {
        "balances": [
            {
                "currency_id": c.id,
                "amount": float(by_currency_id.get(c.id).balance) if c.id in by_currency_id else 0.0,
            }
            for c in currencies
        ]
    }


@router.post("/top-up")
def top_up_balance(
    body: TopUpBody,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    user: User = Depends(require_roles(["user"])),
):
    currency = db.query(Currency).filter(Currency.id == body.currency_id).first()
    if not currency:
        raise HTTPException(status_code=404, detail="Валюта не найдена")

    row = (
        db.query(UserBalance)
        .filter(
            UserBalance.user_id == current_user.id,
            UserBalance.currency_id == body.currency_id,
        )
        .first()
    )

    if row is None:
        row = UserBalance(
            user_id=current_user.id,
            currency_id=body.currency_id,
            balance=Decimal("0.00"),
        )
        db.add(row)

    row.balance = (row.balance or Decimal("0.00")) + body.amount

    db.commit()
    db.refresh(row)

    return {
        "success": True,
        "balance": {
            "currency_id": row.currency_id,
            "amount": float(row.balance),
        },
    }