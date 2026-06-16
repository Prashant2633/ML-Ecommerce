import logging
import os
from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.pool import StaticPool

logger = logging.getLogger(__name__)

DEFAULT_DATABASE_URL = "postgresql://ecommerce_user:ecommerce_password@localhost:5432/ecommerce_db"
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FALLBACK_DATABASE_URL = f"sqlite:///{os.path.join(BASE_DIR, 'sqlite.db')}"

DATABASE_URL = os.getenv("DATABASE_URL", DEFAULT_DATABASE_URL)
ENVIRONMENT = os.getenv("ENVIRONMENT", "development").lower()


def _is_explicit_postgres() -> bool:
    return DATABASE_URL.startswith("postgresql") and DATABASE_URL != DEFAULT_DATABASE_URL


def _should_use_sqlite_fallback() -> bool:
    env_override = os.getenv("ALLOW_SQLITE_FALLBACK")
    if env_override is not None:
        return env_override.lower() == "true"

    return not _is_explicit_postgres() and ENVIRONMENT != "production"


def _build_engine(database_url: str):
    if database_url.startswith("sqlite"):
        return create_engine(
            database_url,
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )

    return create_engine(database_url, pool_pre_ping=True)


def _create_engine() -> object:
    primary_engine = _build_engine(DATABASE_URL)

    if DATABASE_URL.startswith("postgresql") and _should_use_sqlite_fallback():
        try:
            with primary_engine.connect() as connection:
                connection.execute(text("SELECT 1"))
            return primary_engine
        except OperationalError as exc:
            logger.warning(
                "PostgreSQL connection failed; falling back to SQLite database. Error: %s",
                exc,
            )
            return _build_engine(FALLBACK_DATABASE_URL)

    return primary_engine


engine = _create_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
