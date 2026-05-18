# fastapi run main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routes import auth, currencies, rates, balance, operations, exchange

Base.metadata.create_all(bind=engine)

app = FastAPI(title="ExchangePoint API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth.router)
app.include_router(currencies.router)
app.include_router(rates.router)
app.include_router(balance.router)
app.include_router(operations.router)
app.include_router(exchange.router)

@app.get("/")
def root():
    return {"message": "API работает"}