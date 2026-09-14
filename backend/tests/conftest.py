import pytest
from app import create_app, db
from app.config import Config


class TestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    GOOGLE_CLIENT_ID = "test-client-id"
    GOOGLE_CLIENT_IDS = []


@pytest.fixture
def app():
    # Pass config via create_app so the engine binds to the test DB
    # before db.create_all() runs inside the factory.
    app = create_app(TestConfig)

    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()
