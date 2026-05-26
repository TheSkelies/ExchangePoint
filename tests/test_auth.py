from models import User
from auth import get_password_hash
from datetime import date


def test_login_success(client, db_session):
    password = "TEST"
    user = User(
        login="TEST@mail.ru",
        password_hash=get_password_hash(password),
        role="user",
        last_name="TEST",
        first_name="TEST",
        middle_name="TEST",
        birth_date=date(2000, 1, 1),
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    resp = client.post(
        "/api/auth/login",
        json={"login": "TEST@mail.ru", "password": password},
    )

    assert resp.status_code == 200, resp.text
    data = resp.json()

    assert data["message"] == "Вход выполнен успешно"
    assert isinstance(data["token"], str)
    assert data["token"] != ""
    assert "user" in data
    assert data["user"]["login"] == "TEST@mail.ru"



def test_login_wrong_password_returns_401(client, db_session):
    user = User(
        login="user1@mail.ru",
        password_hash=get_password_hash("CORRECT_PASSWORD"),
        role="user",
        last_name="TEST",
        first_name="TEST",
        middle_name="TEST",
        birth_date=date(2000, 1, 1),
    )
    db_session.add(user)
    db_session.commit()

    resp = client.post(
        "/api/auth/login",
        json={"login": "user1@mail.ru", "password": "WRONG_PASSWORD"},
    )

    assert resp.status_code == 401, resp.text
    data = resp.json()
    assert data["detail"] == "Неверный email или пароль"



def test_update_me_first_name_success(client, db_session):
    password = "TEST"
    user = User(
        login="me_update@mail.ru",
        password_hash=get_password_hash(password),
        role="user",
        last_name="OLD_LAST",
        first_name="OLD_FIRST",
        middle_name="OLD_MIDDLE",
        birth_date=date(2000, 1, 1),
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    login_resp = client.post(
        "/api/auth/login",
        json={"login": "me_update@mail.ru", "password": password},
    )
    assert login_resp.status_code == 200, login_resp.text
    token = login_resp.json()["token"]
    assert token

    resp = client.patch(
        "/api/auth/me",
        json={"first_name": "NEW_FIRST"},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["first_name"] == "NEW_FIRST"
    assert data["login"] == "me_update@mail.ru"

    db_session.expire_all()
    updated = db_session.query(User).filter(User.id == user.id).first()
    assert updated.first_name == "NEW_FIRST"

