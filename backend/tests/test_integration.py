"""Integration tests for API + DB interactions."""
import pytest


@pytest.fixture
def setup_data(client):
    """Set up test data: account, category, envelope."""
    account = client.post("/api/accounts/", json={"name": "Integration Test Account", "balance": 5000.0}).json()
    category = client.post("/api/categories/", json={"name": "Food", "color": "#ff0000"}).json()
    envelope = client.post("/api/envelopes/", json={
        "name": "Groceries",
        "category_id": category["id"],
        "budgeted_amount": 500.0,
    }).json()
    return {"account": account, "category": category, "envelope": envelope}


def test_full_transaction_workflow(client, setup_data):
    """Test creating a transaction and verifying envelope is updated."""
    account_id = setup_data["account"]["id"]
    envelope_id = setup_data["envelope"]["id"]

    # Create a debit transaction assigned to the envelope
    txn_resp = client.post("/api/transactions/", json={
        "date": "2024-01-15T00:00:00",
        "amount": -75.0,
        "description": "Whole Foods",
        "account_id": account_id,
        "envelope_id": envelope_id,
        "transaction_type": "debit",
    })
    assert txn_resp.status_code == 201

    # Verify envelope spent amount is updated
    envelope_resp = client.get(f"/api/envelopes/{envelope_id}")
    assert envelope_resp.status_code == 200
    envelope_data = envelope_resp.json()
    assert envelope_data["spent_amount"] == 75.0
    assert envelope_data["available_amount"] == 425.0


def test_envelope_assign_funds(client, setup_data):
    envelope_id = setup_data["envelope"]["id"]
    response = client.post(f"/api/envelopes/{envelope_id}/assign?amount=100.0")
    assert response.status_code == 200
    assert response.json()["budgeted_amount"] == 600.0


def test_export_csv(client, setup_data):
    account_id = setup_data["account"]["id"]
    client.post("/api/transactions/", json={
        "date": "2024-01-15T00:00:00",
        "amount": -50.0,
        "description": "Test export",
        "account_id": account_id,
    })
    response = client.get("/api/exports/transactions/csv")
    assert response.status_code == 200
    assert "text/csv" in response.headers["content-type"]


def test_category_unique_name(client):
    client.post("/api/categories/", json={"name": "Unique Cat"})
    resp = client.post("/api/categories/", json={"name": "Unique Cat"})
    assert resp.status_code == 400
