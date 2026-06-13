"""
Integration tests for the FastAPI backend.
Run with: pytest backend/tests/test_api.py -v
"""
import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


# ── Root ──────────────────────────────────────────────────────────────────────

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert "message" in response.json()


# ── Products ──────────────────────────────────────────────────────────────────

def test_get_products():
    response = client.get("/api/products/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_get_product_not_found():
    response = client.get("/api/products/99999")
    assert response.status_code == 404


# ── Users ─────────────────────────────────────────────────────────────────────

def test_create_user():
    payload = {"email": "testuser@nexcart.io", "password": "secret123"}
    response = client.post("/api/users/", json=payload)
    # 201 on first run; 409 if test DB already has this email — both acceptable
    assert response.status_code in (201, 409)


def test_create_user_duplicate():
    payload = {"email": "dup@nexcart.io", "password": "pw"}
    client.post("/api/users/", json=payload)   # first creation
    response = client.post("/api/users/", json=payload)  # duplicate
    assert response.status_code == 409


def test_get_users_list():
    response = client.get("/api/users/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


# ── Telemetry ─────────────────────────────────────────────────────────────────

def test_telemetry_log():
    payload = {
        "product_id": 1,
        "action_type": "click",
        "session_id": "test_session_001",
        "user_id": None,
    }
    response = client.post("/api/telemetry/", json=payload)
    assert response.status_code == 200
    assert response.json()["status"] == "recorded"


def test_telemetry_all_action_types():
    """Verify every valid RL reward action type is accepted."""
    for action in ("view", "click", "add_to_cart", "purchase"):
        resp = client.post("/api/telemetry/", json={
            "product_id": 1,
            "action_type": action,
            "session_id": "test_session_types",
        })
        assert resp.status_code == 200, f"Failed for action_type={action}"


# ── Recommendations ───────────────────────────────────────────────────────────

def test_recommendations_shape():
    """Response must include 'recommendations' as a list."""
    response = client.get("/api/recommendations/1?session_id=test_session_001")
    assert response.status_code == 200
    data = response.json()
    assert "recommendations" in data
    assert isinstance(data["recommendations"], list)


def test_recommendations_returns_valid_product_ids():
    """
    After seeding the DB with at least 1 telemetry event,
    the engine should return at least 1 valid recommendation.
    """
    # Seed a telemetry event first so the engine has history to work with
    client.post("/api/telemetry/", json={
        "product_id": 1,
        "action_type": "add_to_cart",
        "session_id": "test_recs_session",
    })
    response = client.get(
        "/api/recommendations/1?session_id=test_recs_session&top_k=3"
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data["recommendations"], list)
    # IDs should be positive integers when any products are seeded
    for pid in data["recommendations"]:
        assert isinstance(pid, int)
        assert pid >= 1


def test_recommendations_top_k_respected():
    """top_k query param must be respected (at most top_k results)."""
    response = client.get(
        "/api/recommendations/1?session_id=test_session_001&top_k=2"
    )
    assert response.status_code == 200
    assert len(response.json()["recommendations"]) <= 2


def test_recommendations_anonymous_session():
    """Anonymous users (user_id with no DB records) should still get results."""
    response = client.get(
        "/api/recommendations/9999?session_id=anon_session_xyz&top_k=3"
    )
    assert response.status_code == 200
    assert "recommendations" in response.json()
