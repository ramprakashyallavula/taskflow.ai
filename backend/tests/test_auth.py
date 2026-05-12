from fastapi.testclient import TestClient


def test_register_verify_login_and_me(client: TestClient) -> None:
    payload = {
        "email": "alice@example.com",
        "full_name": "Alice",
        "mobile_number": "5551234567",
        "password": "password123",
    }

    register_res = client.post("/api/v1/auth/register", json=payload)
    assert register_res.status_code == 201
    code = register_res.json()["debug_code"]
    assert code

    verify_res = client.post(
        "/api/v1/auth/register/verify",
        json={"email": "alice@example.com", "code": code},
    )
    assert verify_res.status_code == 200
    verify_data = verify_res.json()
    assert verify_data["user"]["email"] == "alice@example.com"
    assert verify_data["access_token"]

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
        "mobile_number": "5551234567",
        "password": "password123",
    }

    first = client.post("/api/v1/auth/register", json=payload)
    assert first.status_code == 201
    verify = client.post("/api/v1/auth/register/verify", json={"email": "bob@example.com", "code": first.json()["debug_code"]})
    assert verify.status_code == 200

    second = client.post("/api/v1/auth/register", json=payload)
    assert second.status_code == 409


def test_login_rejects_unverified_user(client: TestClient) -> None:
    payload = {
        "email": "pending@example.com",
        "full_name": "Pending User",
        "mobile_number": "5551234567",
        "password": "password123",
    }
    register = client.post("/api/v1/auth/register", json=payload)
    assert register.status_code == 201

    login = client.post("/api/v1/auth/login", json={"email": payload["email"], "password": payload["password"]})
    assert login.status_code == 403
    assert "verify your email" in login.json()["detail"].lower()


def test_forgot_and_reset_password(client: TestClient) -> None:
    payload = {
        "email": "reset@example.com",
        "full_name": "Reset User",
        "mobile_number": "5551234567",
        "password": "password123",
    }
    register = client.post("/api/v1/auth/register", json=payload)
    code = register.json()["debug_code"]
    verify = client.post("/api/v1/auth/register/verify", json={"email": payload["email"], "code": code})
    assert verify.status_code == 200

    forgot = client.post("/api/v1/auth/forgot-password", json={"email": payload["email"]})
    assert forgot.status_code == 200
    reset_link = forgot.json()["debug_reset_link"]
    assert reset_link
    token = reset_link.split("token=")[1]

    reset = client.post(
        "/api/v1/auth/reset-password",
        json={"token": token, "new_password": "newpassword123"},
    )
    assert reset.status_code == 200

    login = client.post("/api/v1/auth/login", json={"email": payload["email"], "password": "newpassword123"})
    assert login.status_code == 200
