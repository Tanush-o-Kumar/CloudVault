import os
import shutil
import tempfile
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.app.config import settings
from backend.app.database import Base, get_db
from backend.app.main import app
from backend.app.services.storage import LocalStorageService, get_storage_service

# Create an isolated SQLite database for automated testing
TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db_session():
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def temp_storage_dir():
    temp_dir = tempfile.mkdtemp(prefix="cloudvault_test_storage_")
    yield temp_dir
    shutil.rmtree(temp_dir, ignore_errors=True)


@pytest.fixture
def client(db_session, temp_storage_dir):
    # Override database dependency
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    test_storage = LocalStorageService(base_dir=temp_storage_dir)

    def override_get_storage_service():
        return test_storage

    app.dependency_overrides[get_db] = override_get_db

    # Also temporarily override storage service in router modules
    from backend.app.routers import files
    original_storage = files.get_storage_service
    files.get_storage_service = override_get_storage_service

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()
    files.get_storage_service = original_storage
