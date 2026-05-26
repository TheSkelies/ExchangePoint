from datetime import date

from auth import get_password_hash
from models import User, Currency, ExchangeRate


def _create_user(db_session, *, login: str, password: str, role: str) -> User:
    user = User(
        login=login,
        password_hash=get_password_hash(password),
        role=role,
        last_name="TEST",
        first_name="TEST",
        middle_name="TEST",
        birth_date=date(2000, 1, 1),
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


def _login(client, *, login: str, password: str) -> str:
    r = client.post("/api/auth/login", json={"login": login, "password": password})
    assert r.status_code == 200, r.text
    token = r.json()["token"]
    assert token
    return token


def _auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def _create_currency(db_session, name: str) -> Currency:
    c = Currency(name=name)
    db_session.add(c)
    db_session.commit()
    db_session.refresh(c)
    return c


def _create_rate(db_session, *, seller_id: int, sell_currency_id: int, buy_currency_id: int, rate=1.25) -> ExchangeRate:
    row = ExchangeRate(
        sell_currency_id=sell_currency_id,
        buy_currency_id=buy_currency_id,
        rate=rate,
        is_active=True,
        creator_id=seller_id,
    )
    db_session.add(row)
    db_session.commit()
    db_session.refresh(row)
    return row



def test_create_rate_success_200(client, db_session):
    seller_login = "seller@mail.ru"
    seller_password = "TEST"
    seller = _create_user(db_session, login=seller_login, password=seller_password, role="seller")
    token = _login(client, login=seller_login, password=seller_password)

    c1 = _create_currency(db_session, "USD")
    c2 = _create_currency(db_session, "EUR")

    resp = client.post(
        "/api/rates",
        json={"sell_currency_id": c1.id, "buy_currency_id": c2.id, "rate": 1.25},
        headers=_auth_headers(token),
    )

    assert resp.status_code == 200, resp.text
    data = resp.json()

    assert data["sell_currency_id"] == c1.id
    assert data["buy_currency_id"] == c2.id
    assert float(data["rate"]) == 1.25
    assert data["is_active"] is True
    assert data["creator_id"] == seller.id


def test_create_rate_same_currency_400(client, db_session):
    seller_login = "seller2@mail.ru"
    seller_password = "TEST"
    _create_user(db_session, login=seller_login, password=seller_password, role="seller")
    token = _login(client, login=seller_login, password=seller_password)

    c1 = _create_currency(db_session, "USD")

    resp = client.post(
        "/api/rates",
        json={"sell_currency_id": c1.id, "buy_currency_id": c1.id, "rate": 1.0},
        headers=_auth_headers(token),
    )

    assert resp.status_code == 400, resp.text
    assert resp.json()["detail"] == "Валюты должны быть разными"


def test_create_rate_duplicate_active_400(client, db_session):
    seller_login = "seller3@mail.ru"
    seller_password = "TEST"
    seller = _create_user(db_session, login=seller_login, password=seller_password, role="seller")
    token = _login(client, login=seller_login, password=seller_password)

    c1 = _create_currency(db_session, "USD")
    c2 = _create_currency(db_session, "EUR")

    existing = ExchangeRate(
        sell_currency_id=c1.id,
        buy_currency_id=c2.id,
        rate=1.25,
        is_active=True,
        creator_id=seller.id,
    )
    db_session.add(existing)
    db_session.commit()

    resp = client.post(
        "/api/rates",
        json={"sell_currency_id": c1.id, "buy_currency_id": c2.id, "rate": 1.25},
        headers=_auth_headers(token),
    )

    assert resp.status_code == 400, resp.text
    assert resp.json()["detail"] == "Курс для этой пары валют уже существует"


def test_create_rate_forbidden_for_user_403_or_401(client, db_session):
    login = "user@mail.ru"
    password = "TEST"
    _create_user(db_session, login=login, password=password, role="user")
    token = _login(client, login=login, password=password)

    c1 = _create_currency(db_session, "USD")
    c2 = _create_currency(db_session, "EUR")

    resp = client.post(
        "/api/rates",
        json={"sell_currency_id": c1.id, "buy_currency_id": c2.id, "rate": 1.1},
        headers=_auth_headers(token),
    )

    assert resp.status_code in (401, 403), resp.text


def test_create_rate_unauthorized_without_token_403_or_401(client, db_session):
    c1 = _create_currency(db_session, "USD")
    c2 = _create_currency(db_session, "EUR")

    resp = client.post(
        "/api/rates",
        json={"sell_currency_id": c1.id, "buy_currency_id": c2.id, "rate": 1.1},
    )

    assert resp.status_code in (401, 403), resp.text


def test_delete_rate_success_200_soft_deletes(client, db_session):
    seller_login = "seller_del@mail.ru"
    seller_password = "TEST"
    seller = _create_user(db_session, login=seller_login, password=seller_password, role="seller")
    token = _login(client, login=seller_login, password=seller_password)

    c1 = _create_currency(db_session, "USD")
    c2 = _create_currency(db_session, "EUR")
    rate = _create_rate(db_session, seller_id=seller.id, sell_currency_id=c1.id, buy_currency_id=c2.id, rate=1.25)

    resp = client.delete(
        f"/api/rates/{rate.id}",
        headers=_auth_headers(token),
    )

    assert resp.status_code == 200, resp.text
    assert resp.json() == {"success": True}

    db_session.expire_all()
    updated = db_session.query(ExchangeRate).filter(ExchangeRate.id == rate.id).first()
    assert updated is not None
    assert updated.is_active is False


def test_delete_rate_not_found_404(client, db_session):
    seller_login = "seller_nf@mail.ru"
    seller_password = "TEST"
    _create_user(db_session, login=seller_login, password=seller_password, role="seller")
    token = _login(client, login=seller_login, password=seller_password)

    resp = client.delete(
        "/api/rates/999999",
        headers=_auth_headers(token),
    )

    assert resp.status_code == 404, resp.text
    assert resp.json()["detail"] == "Курс не найден"


def test_delete_rate_forbidden_not_creator_403(client, db_session):
    seller1_login = "seller1@mail.ru"
    seller2_login = "seller2@mail.ru"
    password = "TEST"

    seller1 = _create_user(db_session, login=seller1_login, password=password, role="seller")
    _create_user(db_session, login=seller2_login, password=password, role="seller")

    token_seller2 = _login(client, login=seller2_login, password=password)

    c1 = _create_currency(db_session, "USD")
    c2 = _create_currency(db_session, "EUR")
    rate = _create_rate(db_session, seller_id=seller1.id, sell_currency_id=c1.id, buy_currency_id=c2.id, rate=1.25)

    resp = client.delete(
        f"/api/rates/{rate.id}",
        headers=_auth_headers(token_seller2),
    )

    assert resp.status_code == 403, resp.text
    assert resp.json()["detail"] == "Удалять курс может только его создатель"

    db_session.expire_all()
    still_there = db_session.query(ExchangeRate).filter(ExchangeRate.id == rate.id).first()
    assert still_there.is_active is True


def test_delete_rate_unauthorized_without_token_401_or_403(client, db_session):
    seller = _create_user(db_session, login="seller_no_token@mail.ru", password="TEST", role="seller")
    c1 = _create_currency(db_session, "USD")
    c2 = _create_currency(db_session, "EUR")
    rate = _create_rate(db_session, seller_id=seller.id, sell_currency_id=c1.id, buy_currency_id=c2.id, rate=1.25)

    resp = client.delete(f"/api/rates/{rate.id}")

    assert resp.status_code in (401, 403), resp.text


def test_delete_rate_forbidden_for_user_role_401_or_403(client, db_session):
    user_login = "user_del@mail.ru"
    password = "TEST"
    _create_user(db_session, login=user_login, password=password, role="user")
    token = _login(client, login=user_login, password=password)

    seller = _create_user(db_session, login="seller_owner@mail.ru", password=password, role="seller")
    c1 = _create_currency(db_session, "USD")
    c2 = _create_currency(db_session, "EUR")
    rate = _create_rate(db_session, seller_id=seller.id, sell_currency_id=c1.id, buy_currency_id=c2.id, rate=1.25)

    resp = client.delete(
        f"/api/rates/{rate.id}",
        headers=_auth_headers(token),
    )

    assert resp.status_code in (401, 403), resp.text
