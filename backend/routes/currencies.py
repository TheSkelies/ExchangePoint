from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from models import Currency
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
        db: Session = Depends(get_db)):
    new_currency = Currency(
        name=data.name,
    )

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

