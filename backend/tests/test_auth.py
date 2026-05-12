from fastapi.testclient import TestClient


def test_register_login_and_me(client: TestClient) -> None:
    payload = {
        "email": "alice@example.com",
        "full_name": "Alice",
        "password": "password123",
    }

    register_res = client.post("/api/v1/auth/register", json=payload)
    assert register_res.status_code == 201
    register_data = register_res.json()
    assert register_data["user"]["email"] == "alice@example.com"
    assert register_data["access_token"]

    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "alice@example.com", "password": "password123"},
    )
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]

    me_res = client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["full_name"] == "Alice"


def test_register_duplicate_email(client: TestClient) -> None:
    payload = {
        "email": "bob@example.com",
        "full_name": "Bob",
        "password": "password123",
    }

    first = client.post("/api/v1/auth/register", json=payload)
    assert first.status_code == 201

    second = client.post("/api/v1/auth/register", json=payload)
    assert second.status_code == 409
