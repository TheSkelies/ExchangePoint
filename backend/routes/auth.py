from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import date
from database import get_db
from models import User
from auth import get_password_hash, verify_password, create_access_token, get_current_user
from utils import user_to_response

router = APIRouter(prefix="/api/auth", tags=["auth"])


class RegisterRequest(BaseModel):
    login: EmailStr
    password: str
    firstName: str
    lastName: str
    middleName: Optional[str]
    birth_date: Optional[str] = Field(None, alias="birth_date")

    class Config:
        populate_by_name = True


class LoginRequest(BaseModel):
    login: EmailStr
    password: str


class UpdateMeRequest(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    middle_name: Optional[str] = None
    birth_date: Optional[date] = None
    login: Optional[EmailStr] = None

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str

class UpdateCardRequest(BaseModel):
    pan: str
    exp: str
    cvc: str



@router.post("/register")
def register(
        data: RegisterRequest,
        db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.login == data.login).first()
    if existing:
        raise HTTPException(status_code=400, detail="Пользователь с таким email уже существует")

    raw_password = data.password
    hashed = get_password_hash(raw_password)

    new_user = User(
        login=data.login,
        password_hash=hashed,
        first_name=data.firstName,
        last_name=data.lastName,
        middle_name=data.middleName,
        role="user",
        birth_date=data.birth_date,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token({"userId": new_user.id})

    return {
        "message": "Регистрация успешна",
        "token": token,
        "user": user_to_response(new_user)
    }


@router.post("/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.login == data.login).first()
    if not user:
        raise HTTPException(status_code=401, detail="Неверный email или пароль")

    raw_password = data.password
    if not verify_password(raw_password, user.password_hash):
        raise HTTPException(status_code=401, detail="Неверный email или пароль")

    token = create_access_token({"userId": user.id})
    return {
        "message": "Вход выполнен успешно",
        "token": token,
        "user": user_to_response(user)
    }


@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return user_to_response(current_user)


@router.patch("/me")
def update_me(
    data: UpdateMeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if data.first_name is not None:
        current_user.first_name = data.first_name
    if data.last_name is not None:
        current_user.last_name = data.last_name
    if data.middle_name is not None:
        current_user.middle_name = data.middle_name
    if data.birth_date is not None:
        current_user.birth_date = data.birth_date
    if data.login is not None:
        existing = db.query(User).filter(User.login == data.login, User.id != current_user.id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Пользователь с таким email уже существует")
        current_user.login = data.login

    db.commit()
    db.refresh(current_user)
    return user_to_response(current_user)


@router.post("/change-password")
def change_password(
    data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from auth import verify_password, get_password_hash

    if not verify_password(data.old_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Старый пароль неверный")

    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="Новый пароль должен быть минимум 6 символов")

    current_user.password_hash = get_password_hash(data.new_password)
    db.commit()
    return {"success": True}


@router.put("/me/card")
def update_my_card(
    data: UpdateCardRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):

    # базовая валидация как на фронте
    if not data.pan.isdigit() or len(data.pan) != 12:
        raise HTTPException(status_code=400, detail="PAN должен быть из 12 цифр")
    if len(data.exp) != 5 or data.exp[2] != "/":
        raise HTTPException(status_code=400, detail="Срок должен быть в формате MM/YY")
    if not data.cvc.isdigit() or len(data.cvc) != 3:
        raise HTTPException(status_code=400, detail="CVC должен быть из 3 цифр")

    current_user.card_number_hash = data.pan
    current_user.card_expiry_hash = data.exp
    current_user.card_cvc_hash = data.cvc

    db.commit()
    db.refresh(current_user)

    return {"pan_last4": data.pan[-4:], "exp": data.exp}


@router.get("/me/card")
def get_my_card(
    current_user: User = Depends(get_current_user),
):
    return {
        "card_number": current_user.card_number_hash,
        "card_expiry": current_user.card_expiry_hash,
    }