def test_create_account(client):
    response = client.post("/api/accounts/", json={
        "name": "Checking",
        "account_type": "checking",
        "balance": 1000.0,
    })
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Checking"
    assert data["balance"] == 1000.0


def test_list_accounts(client):
    client.post("/api/accounts/", json={"name": "Savings", "account_type": "savings"})
    response = client.get("/api/accounts/")
    assert response.status_code == 200
    assert len(response.json()) >= 1


def test_get_account(client):
    create_resp = client.post("/api/accounts/", json={"name": "Test Account"})
    account_id = create_resp.json()["id"]
    response = client.get(f"/api/accounts/{account_id}")
    assert response.status_code == 200
    assert response.json()["id"] == account_id


def test_update_account(client):
    create_resp = client.post("/api/accounts/", json={"name": "Old Name"})
    account_id = create_resp.json()["id"]
    response = client.put(f"/api/accounts/{account_id}", json={"name": "New Name"})
    assert response.status_code == 200
    assert response.json()["name"] == "New Name"


def test_delete_account(client):
    create_resp = client.post("/api/accounts/", json={"name": "To Delete"})
    account_id = create_resp.json()["id"]
    response = client.delete(f"/api/accounts/{account_id}")
    assert response.status_code == 204
    # Should be soft-deleted (is_active=False), not returned in list
    list_resp = client.get("/api/accounts/")
    ids = [a["id"] for a in list_resp.json()]
    assert account_id not in ids


def test_account_not_found(client):
    response = client.get("/api/accounts/9999")
    assert response.status_code == 404
