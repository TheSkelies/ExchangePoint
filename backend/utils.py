def user_to_response(user) -> dict:
    return {
        "id": user.id,
        "last_name": user.last_name,
        "first_name": user.first_name,
        "middle_name": user.middle_name,
        "birth_date": user.birth_date,
        "role": user.role,
        "login": user.login,
    }


def currency_to_response(currency) -> dict:
    return {
        "id": currency.id,
        "name": currency.name,
    }


def user_balance_to_response(user_balance, current_user=None) -> dict:
    if current_user is None:
        return {}

    balances = []
    for row in user_balance:
        if row.user_id == current_user["id"]:
            balances.append({
                "currency_id": row.currency_id,
                "balance": str(row.balance),
            })

    return {"balances": balances}


def exchange_rate_to_response(rate):
    return {
        "id": rate.id,
        "sell_currency_id": rate.sell_currency_id,
        "buy_currency_id": rate.buy_currency_id,
        "rate": float(rate.rate),
        "is_active": bool(getattr(rate, "is_active", True)),
    }