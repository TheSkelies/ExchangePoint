from decimal import Decimal, ROUND_HALF_UP
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from database import get_db
from auth import get_current_user
from models import User, UserBalance, ExchangeRate, Operation

router = APIRouter(prefix="/api/exchange", tags=["exchange"])

class ConfirmExchangeBody(BaseModel):
    rate_id: int
    amount_sell: Decimal = Field(..., gt=Decimal("0"))

@router.post("/confirm")
def confirm_exchange(
    body: ConfirmExchangeBody,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rate = db.query(ExchangeRate).filter(ExchangeRate.id == body.rate_id).first()
    if not rate:
        raise HTTPException(status_code=404, detail="Курс не найден")

    sell_id = rate.sell_currency_id
    buy_id = rate.buy_currency_id

    sell_row = (
        db.query(UserBalance)
        .filter(UserBalance.user_id == current_user.id, UserBalance.currency_id == sell_id)
        .first()
    )
    if sell_row is None:
        sell_row = UserBalance(user_id=current_user.id, currency_id=sell_id, balance=Decimal("0.00"))
        db.add(sell_row)

    buy_row = (
        db.query(UserBalance)
        .filter(UserBalance.user_id == current_user.id, UserBalance.currency_id == buy_id)
        .first()
    )
    if buy_row is None:
        buy_row = UserBalance(user_id=current_user.id, currency_id=buy_id, balance=Decimal("0.00"))
        db.add(buy_row)

    if (sell_row.balance or Decimal("0.00")) < body.amount_sell:
        raise HTTPException(status_code=400, detail="Недостаточно средств")

    credited = (body.amount_sell * rate.rate).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    sell_row.balance = ((sell_row.balance or Decimal("0.00")) - body.amount_sell).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    buy_row.balance = ((buy_row.balance or Decimal("0.00")) + credited).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    op = Operation(
        user_id=current_user.id,
        operation_type="exchange",
        rate_id=rate.id,
    )
    db.add(op)

    db.commit()
    db.refresh(op)

    return {
        "success": True,
        "credited": float(credited),
        "operation_id": op.id,
        "balances": [
            {"currency_id": sell_id, "amount": float(sell_row.balance)},
            {"currency_id": buy_id, "amount": float(buy_row.balance)},
        ],
    }