import pytest
from app import db
from app.models.user import User


@pytest.fixture
def seeded_user(app):
    user = User(
        name="Test Farmer",
        email="farmer@test.com",
        phone="9000000001",
        role="farmer",
    )
    user.set_password("Secret@123")
    db.session.add(user)
    db.session.commit()
    return user


def _login(client, email, password):
    return client.post("/api/auth/login", json={"email": email, "password": password})


def test_login_with_email(client, seeded_user):
    res = _login(client, "farmer@test.com", "Secret@123")
    assert res.status_code == 200
    body = res.get_json()
    assert body["success"] is True
    assert body["data"]["token"]
    assert body["data"]["user"]["email"] == "farmer@test.com"


def test_login_with_phone(client, seeded_user):
    res = _login(client, "9000000001", "Secret@123")
    assert res.status_code == 200
    body = res.get_json()
    assert body["success"] is True
    assert body["data"]["user"]["phone"] == "9000000001"


def test_login_wrong_password(client, seeded_user):
    res = _login(client, "farmer@test.com", "WrongPass")
    assert res.status_code == 401
    body = res.get_json()
    assert body["success"] is False
    assert body["error"]["message"] == "Invalid credentials"


def test_login_missing_fields(client, seeded_user):
    res = client.post("/api/auth/login", json={"email": "farmer@test.com"})
    assert res.status_code == 400
    assert res.get_json()["success"] is False

    res = client.post("/api/auth/login", json={})
    assert res.status_code == 400


def test_login_suspended_user(client, app, seeded_user):
    with app.app_context():
        user = db.session.get(User, seeded_user.id)
        user.is_active = False
        db.session.commit()

    # The test client request reuses the fixture's active app context and
    # its scoped session, whose identity map still holds the pre-update
    # User. Expire cached instances so the request re-reads committed state.
    db.session.expire_all()

    res = _login(client, "farmer@test.com", "Secret@123")
    assert res.status_code == 403
    assert res.get_json()["success"] is False


def test_login_unknown_user(client, seeded_user):
    res = _login(client, "ghost@test.com", "Secret@123")
    assert res.status_code == 401


def test_register_success(client):
    res = client.post(
        "/api/auth/register",
        json={
            "name": "New Processor",
            "email": "proc@test.com",
            "phone": "9000000002",
            "role": "processor",
            "password": "Secret@123",
        },
    )
    assert res.status_code == 201
    body = res.get_json()
    assert body["success"] is True
    assert body["data"]["token"]
    assert body["data"]["user"]["role"] == "processor"


def test_register_duplicate_phone(client, seeded_user):
    res = client.post(
        "/api/auth/register",
        json={
            "name": "Dup",
            "phone": "9000000001",
            "role": "farmer",
            "password": "Secret@123",
        },
    )
    assert res.status_code == 409


def test_register_invalid_role(client):
    res = client.post(
        "/api/auth/register",
        json={
            "name": "Bad",
            "phone": "9000000003",
            "role": "hacker",
            "password": "Secret@123",
        },
    )
    assert res.status_code == 400


def test_register_short_password(client):
    res = client.post(
        "/api/auth/register",
        json={
            "name": "Bad",
            "phone": "9000000004",
            "role": "farmer",
            "password": "123",
        },
    )
    assert res.status_code == 400


def test_me_requires_token(client, seeded_user):
    res = client.get("/api/auth/me")
    assert res.status_code == 401

    login = _login(client, "farmer@test.com", "Secret@123")
    token = login.get_json()["data"]["token"]

    res = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    assert res.get_json()["data"]["email"] == "farmer@test.com"


def test_demo_login(client, seeded_user):
    res = client.post("/api/auth/demo-login", json={"role": "farmer"})
    assert res.status_code == 200
    body = res.get_json()
    assert body["success"] is True
    assert body["data"]["user"]["role"] == "farmer"


def test_demo_login_invalid_role(client):
    res = client.post("/api/auth/demo-login", json={"role": "nobody"})
    assert res.status_code == 400
