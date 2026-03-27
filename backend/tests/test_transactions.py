import pytest
from datetime import datetime


@pytest.fixture
def account(client):
    resp = client.post("/api/accounts/", json={"name": "Test Account"})
    return resp.json()


def test_create_transaction(client, account):
    response = client.post("/api/transactions/", json={
        "date": "2024-01-15T00:00:00",
        "amount": -50.0,
        "description": "Grocery store",
        "account_id": account["id"],
        "transaction_type": "debit",
        "status": "posted",
    })
    assert response.status_code == 201
    data = response.json()
    assert data["amount"] == -50.0
    assert data["description"] == "Grocery store"


def test_list_transactions(client, account):
    client.post("/api/transactions/", json={
        "date": "2024-01-15T00:00:00",
        "amount": -25.0,
        "description": "Coffee",
        "account_id": account["id"],
    })
    response = client.get("/api/transactions/")
    assert response.status_code == 200
    assert len(response.json()) >= 1


def test_transaction_summary(client, account):
    client.post("/api/transactions/", json={
        "date": "2024-01-15T00:00:00",
        "amount": 1000.0,
        "description": "Paycheck",
        "account_id": account["id"],
        "transaction_type": "credit",
    })
    response = client.get("/api/transactions/summary")
    assert response.status_code == 200
    data = response.json()
    assert "total_income" in data
    assert "total_expenses" in data
    assert "net" in data


def test_delete_transaction(client, account):
    create_resp = client.post("/api/transactions/", json={
        "date": "2024-01-15T00:00:00",
        "amount": -10.0,
        "description": "Test",
        "account_id": account["id"],
    })
    t_id = create_resp.json()["id"]
    response = client.delete(f"/api/transactions/{t_id}")
    assert response.status_code == 204
