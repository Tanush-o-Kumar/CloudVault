import pytest
from datetime import timedelta
from backend.app.utils.security import create_access_token


def test_user_registration_success(client):
    payload = {
        "full_name": "Alice Developer",
        "email": "alice@example.com",
        "password": "Password123!"
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "alice@example.com"
    assert data["user"]["full_name"] == "Alice Developer"
    assert "password_hash" not in data["user"]


def test_user_registration_weak_password(client):
    payload = {
        "full_name": "Weak User",
        "email": "weak@example.com",
        "password": "weak"
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 422


def test_user_registration_duplicate_email(client):
    payload = {
        "full_name": "Alice Developer",
        "email": "alice_dup@example.com",
        "password": "Password123!"
    }
    res1 = client.post("/api/auth/register", json=payload)
    assert res1.status_code == 201

    res2 = client.post("/api/auth/register", json=payload)
    assert res2.status_code == 400
    assert "already exists" in res2.json()["detail"].lower()


def test_user_login_success(client):
    payload = {
        "full_name": "Bob Builder",
        "email": "bob@example.com",
        "password": "SecurePassword1!"
    }
    client.post("/api/auth/register", json=payload)

    login_res = client.post("/api/auth/login", json={
        "email": "bob@example.com",
        "password": "SecurePassword1!"
    })
    assert login_res.status_code == 200
    data = login_res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "bob@example.com"


def test_user_login_invalid_password(client):
    payload = {
        "full_name": "Bob Builder",
        "email": "bob_inv@example.com",
        "password": "SecurePassword1!"
    }
    client.post("/api/auth/register", json=payload)

    login_res = client.post("/api/auth/login", json={
        "email": "bob_inv@example.com",
        "password": "WrongPassword99!"
    })
    assert login_res.status_code == 401
    assert "invalid" in login_res.json()["detail"].lower()


def test_unauthorized_access_to_protected_route(client):
    response = client.get("/api/auth/me")
    assert response.status_code == 401


def test_invalid_token(client):
    response = client.get("/api/auth/me", headers={"Authorization": "Bearer invalid.fake.token"})
    assert response.status_code == 401


def test_expired_token(client):
    expired_token = create_access_token(
        data={"sub": "dummy-user-id"},
        expires_delta=timedelta(seconds=-10)
    )
    response = client.get("/api/auth/me", headers={"Authorization": f"Bearer {expired_token}"})
    assert response.status_code == 401
    assert "expired" in response.json()["detail"].lower()


def test_get_current_user_profile(client):
    payload = {
        "full_name": "Carol Danvers",
        "email": "carol@example.com",
        "password": "Password123!"
    }
    reg = client.post("/api/auth/register", json=payload).json()
    token = reg["access_token"]

    response = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "carol@example.com"
    assert data["full_name"] == "Carol Danvers"


def test_logout_endpoint(client):
    payload = {
        "full_name": "Dave User",
        "email": "dave@example.com",
        "password": "Password123!"
    }
    reg = client.post("/api/auth/register", json=payload).json()
    token = reg["access_token"]

    res = client.post("/api/auth/logout", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert "logged out" in res.json()["message"].lower()
