from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from models import Currency, User
from auth import require_roles
from utils import currency_to_response

router = APIRouter(prefix="/api/currencies", tags=["currencies"])


class Currencies(BaseModel):
    id: int
    name: str

class CurrenciesCreate(BaseModel):
    name: str

class CurrenciesToRespond(BaseModel):
    id: int
    name: str
    symbol: str

@router.post("", response_model=CurrenciesCreate)
async def create_exchange_currency(
        data: CurrenciesCreate,
        db: Session = Depends(get_db),
        user: User = Depends(require_roles(["seller"])),
):
    name = (data.name or "").strip().upper()

    if len(name) != 3 or not name.isalpha():
        raise HTTPException(status_code=400, detail="Название валюты должно быть из 3 заглавных букв (например, USD)")

    exists = db.query(Currency).filter(Currency.name == name).first()
    if exists:
        raise HTTPException(status_code=400, detail="Такая валюта уже существует")

    new_currency = Currency(name=name)

    db.add(new_currency)
    db.commit()
    db.refresh(new_currency)

    return currency_to_response(new_currency)


@router.get("")
async def get_currencies(db: Session = Depends(get_db)):
    query = db.query(Currency)

    items = []

    for currency in query:
        item = currency_to_response(currency)
        items.append(item)

    return {
        "currencies": items,
    }

