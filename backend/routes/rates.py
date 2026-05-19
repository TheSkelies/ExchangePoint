from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from decimal import Decimal

from database import get_db
from models import ExchangeRate, User
from auth import require_roles
from utils import exchange_rate_to_response

router = APIRouter(prefix="/api/rates", tags=["rates"])


class ExchangeRates(BaseModel):
    id: int
    sell_currency_id: int
    buy_currency_id: int
    rate: float
    is_active: bool


class ExchangeRateCreate(BaseModel):
    sell_currency_id: int
    buy_currency_id: int
    rate: float


class ExchangeRateUpdate(BaseModel):
    rate: Decimal = Field(..., gt=Decimal("0"))


@router.get("/ExchangeRates")
async def get_rates(
    db: Session = Depends(get_db),
    include_inactive: bool = Query(False),
):
    query = db.query(ExchangeRate)

    if not include_inactive:
        query = query.filter(ExchangeRate.is_active == True)

    items = []
    for rate in query.all():
        item = exchange_rate_to_response(rate)
        items.append(item)

    return {"rates": items}


@router.get("/AllExchangeRates")
async def get_all_rates(
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(["seller"])),
):
    query = db.query(ExchangeRate)


    items = []
    for rate in query.all():
        item = exchange_rate_to_response(rate)
        items.append(item)

    return {"rates": items}


@router.post("")
def create_rate(
    data: ExchangeRateCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(["seller"])),
):
    if data.sell_currency_id == data.buy_currency_id:
        raise HTTPException(status_code=400, detail="Валюты должны быть разными")

    existing = (
        db.query(ExchangeRate)
        .filter(
            ExchangeRate.sell_currency_id == data.sell_currency_id,
            ExchangeRate.buy_currency_id == data.buy_currency_id,
        )
        .first()
    )

    if existing and existing.is_active:
        raise HTTPException(status_code=400, detail="Курс для этой пары валют уже существует")

    if existing and not existing.is_active:
        existing.is_active = True
        existing.rate = data.rate
        db.commit()
        db.refresh(existing)
        return exchange_rate_to_response(existing)

    row = ExchangeRate(
        sell_currency_id=data.sell_currency_id,
        buy_currency_id=data.buy_currency_id,
        rate=data.rate,
        is_active=True,
    )
    db.add(row)
    db.commit()
    db.refresh(row)

    return exchange_rate_to_response(row)

@router.put("/{rate_id}")
def update_rate(
    rate_id: int,
    data: ExchangeRateUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(["seller"])),
):
    row = db.query(ExchangeRate).filter(ExchangeRate.id == rate_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Курс не найден")
    if not row.is_active:
        raise HTTPException(status_code=400, detail="Курс неактивен (удалён)")

    row.rate = data.rate
    db.commit()
    db.refresh(row)

    return exchange_rate_to_response(row)


@router.delete("/{rate_id}")
def soft_delete_rate(
    rate_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(["seller"])),
):
    row = db.query(ExchangeRate).filter(ExchangeRate.id == rate_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Курс не найден")

    row.is_active = False
    db.commit()
    return {"success": True}