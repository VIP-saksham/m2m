import types
import pytest
from app import db
from app.models.user import User

_SUB_COUNTER = 0


def _next_claims():
    """Fresh sub + matching email per call so accounts never collide."""
    global _SUB_COUNTER
    _SUB_COUNTER += 1
    return {
        'sub': f'google-sub-{_SUB_COUNTER}',
        'email': f'person{_SUB_COUNTER}@gmail.com',
        'email_verified': True,
        'name': f'Person {_SUB_COUNTER}',
        'aud': 'test-client-id',
        'iss': 'https://accounts.google.com',
    }


_CURRENT_CLAIMS = _next_claims()


class FakePyJWT(types.SimpleNamespace):
    """Stands in for the real PyJWT module inside app.routes.auth only."""

    class InvalidTokenError(Exception):
        pass

    class PyJWKClientError(Exception):
        pass

    @staticmethod
    def get_unverified_header(token):
        return {'alg': 'RS256', 'kid': 'test-key'}

    class PyJWKClient:
        def __init__(self, url, cache_keys=False):
            pass

        def get_signing_key_from_jwt(self, token):
            return types.SimpleNamespace(key='fake-public-key')

    @staticmethod
    def decode(token, key, **kwargs):
        return dict(_CURRENT_CLAIMS)


@pytest.fixture
def fake_google(monkeypatch):
    global _CURRENT_CLAIMS
    _CURRENT_CLAIMS = _next_claims()
    monkeypatch.setattr('app.routes.auth.pyjwt', FakePyJWT)


# ---------------------------------------------------------------------
# Real failure path (no monkeypatch): garbage token is rejected.
# ---------------------------------------------------------------------

def test_google_invalid_credential(client):
    res = client.post('/api/auth/google', json={'credential': 'not-a-jwt'})
    assert res.status_code == 401
    body = res.get_json()
    assert body['success'] is False


def test_google_missing_credential(client):
    res = client.post('/api/auth/google', json={})
    assert res.status_code == 400


# ---------------------------------------------------------------------
# New Google user: account is created, then role is completed.
# ---------------------------------------------------------------------

def test_google_new_user_needs_role_then_complete(client, fake_google):
    res = client.post('/api/auth/google', json={'credential': 'good-token'})
    assert res.status_code == 200
    body = res.get_json()['data']
    assert body['needs_role'] is True
    assert body['token']

    email = _CURRENT_CLAIMS['email']
    with client.application.app_context():
        created = User.query.filter_by(google_sub=_CURRENT_CLAIMS['sub']).first()
        assert created is not None
        assert created.role == ''
        assert created.password_hash == ''  # empty hash: Google-only, password login blocked
        assert created.email == email

    # Complete the account: pick a role and a phone.
    res2 = client.post(
        '/api/auth/google',
        json={'complete': True, 'role': 'farmer', 'phone': '9111100001'},
        headers={'Authorization': f"Bearer {body['token']}"},
    )
    assert res2.status_code == 200
    user = res2.get_json()['data']['user']
    assert user['role'] == 'farmer'
    assert user['phone'] == '9111100001'
    assert user['google_linked'] is True
    assert user['needs_role'] is False

    # The Google-only account must not allow password login.
    res3 = client.post('/api/auth/login', json={'email': email, 'password': 'whatever'})
    assert res3.status_code == 403
    assert 'Google' in res3.get_json()['error']['message']


def test_google_complete_without_jwt_rejected(client, fake_google):
    res = client.post('/api/auth/google', json={'complete': True, 'role': 'farmer'})
    assert res.status_code in (401, 422)


def test_google_complete_rejects_bad_role(client, fake_google):
    first = client.post('/api/auth/google', json={'credential': 'good-token'})
    token = first.get_json()['data']['token']
    res = client.post(
        '/api/auth/google',
        json={'complete': True, 'role': 'hacker', 'phone': '9111100002'},
        headers={'Authorization': f'Bearer {token}'},
    )
    assert res.status_code == 400


def test_google_complete_rejects_duplicate_phone(client, fake_google):
    seeded = User(name='Seed', email='seed@test.com', phone='9000000099', role='farmer')
    seeded.set_password('Secret@123')
    db.session.add(seeded)
    db.session.commit()

    first = client.post('/api/auth/google', json={'credential': 'good-token'})
    token = first.get_json()['data']['token']
    res = client.post(
        '/api/auth/google',
        json={'complete': True, 'role': 'farmer', 'phone': '9000000099'},
        headers={'Authorization': f'Bearer {token}'},
    )
    assert res.status_code == 409


# ---------------------------------------------------------------------
# Existing local account with the same verified email gets linked.
# ---------------------------------------------------------------------

def test_google_links_existing_account_by_email(client, fake_google):
    global _CURRENT_CLAIMS
    seeded = User(name='Old Farmer', email='linked@gmail.com', phone='9000000088', role='farmer')
    seeded.set_password('Secret@123')
    db.session.add(seeded)
    db.session.commit()

    _CURRENT_CLAIMS = _next_claims()
    _CURRENT_CLAIMS['email'] = 'linked@gmail.com'  # same verified email as the local account

    res = client.post('/api/auth/google', json={'credential': 'good-token'})
    assert res.status_code == 200
    body = res.get_json()['data']
    assert body.get('needs_role') in (False, None)
    assert body['user']['email'] == 'linked@gmail.com'
    assert body['user']['role'] == 'farmer'

    with client.application.app_context():
        linked = User.query.filter_by(email='linked@gmail.com').first()
        assert linked.google_sub == _CURRENT_CLAIMS['sub']
        assert linked.check_password('Secret@123')  # old password still works
