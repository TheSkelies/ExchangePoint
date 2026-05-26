from models import Currency


def _create_currency(db_session, name: str) -> Currency:
    c = Currency(name=name)
    db_session.add(c)
    db_session.commit()
    db_session.refresh(c)
    return c


def test_get_currencies_empty_returns_200_and_empty_list(client):
    resp = client.get("/api/currencies")
    assert resp.status_code == 200, resp.text

    data = resp.json()
    assert "currencies" in data
    assert data["currencies"] == []


def test_get_currencies_returns_items(client, db_session):
    _create_currency(db_session, "USD")
    _create_currency(db_session, "EUR")

    resp = client.get("/api/currencies")
    assert resp.status_code == 200, resp.text

    data = resp.json()
    assert "currencies" in data
    assert len(data["currencies"]) == 2

    names = {c["name"] for c in data["currencies"]}
    assert names == {"USD", "EUR"}