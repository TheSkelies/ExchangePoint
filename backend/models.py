from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Numeric, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    last_name = Column(String(100), nullable=False)
    first_name = Column(String(100), nullable=False)
    middle_name = Column(String(100), nullable=True)
    birth_date = Column(Date, nullable=False)
    role = Column(String(30), nullable=False)
    login = Column(String(64), nullable=False, unique=True)
    password_hash = Column(String(255), nullable=False)
    card_number_hash = Column(String(255), nullable=True)
    card_expiry_hash = Column(String(255), nullable=True)
    card_cvc_hash = Column(String(255), nullable=True)

    balances = relationship(
        "UserBalance",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    operations = relationship(
        "Operation",
        back_populates="user",
        cascade="all, delete-orphan",
    )

class Currency(Base):
    __tablename__ = "currencies"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(3), nullable=False, unique=True)

    user_balances = relationship(
        "UserBalance",
        back_populates="currency",
        cascade="all, delete-orphan",
    )
    rates_as_sell = relationship(
        "ExchangeRate",
        foreign_keys="ExchangeRate.sell_currency_id",
        back_populates="sell_currency",
        cascade="all, delete-orphan",
    )
    rates_as_buy = relationship(
        "ExchangeRate",
        foreign_keys="ExchangeRate.buy_currency_id",
        back_populates="buy_currency",
        cascade="all, delete-orphan",
    )

class UserBalance(Base):
    __tablename__ = "user_balances"

    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    currency_id = Column(Integer, ForeignKey("currencies.id"), primary_key=True)
    balance = Column(Numeric(18, 8), nullable=False, default=0)

    user = relationship(
        "User",
        back_populates="balances",
    )
    currency = relationship(
        "Currency",
        back_populates="user_balances",
    )

class ExchangeRate(Base):
    __tablename__ = "exchange_rates"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    sell_currency_id = Column(Integer, ForeignKey("currencies.id"), nullable=False)
    buy_currency_id = Column(Integer, ForeignKey("currencies.id"), nullable=False)
    rate = Column(Numeric(18, 2), nullable=False)

    is_active = Column(Boolean, nullable=False, default=True)
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    sell_currency = relationship(
        "Currency",
        foreign_keys=[sell_currency_id],
        back_populates="rates_as_sell",
    )
    buy_currency = relationship(
        "Currency",
        foreign_keys=[buy_currency_id],
        back_populates="rates_as_buy",
    )
    operations = relationship(
        "Operation",
        back_populates="rate",
        cascade="all, delete-orphan",
    )
    creator = relationship(
        "User",
        foreign_keys=[creator_id])


class Operation(Base):
    __tablename__ = "operations"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    created_at = Column(DateTime, nullable=False, default=datetime.now)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    operation_type = Column(String(30), nullable=False)
    rate_id = Column(Integer, ForeignKey("exchange_rates.id"), nullable=False)

    user = relationship(
        "User",
        back_populates="operations",
    )
    rate = relationship(
        "ExchangeRate",
        back_populates="operations",
    )