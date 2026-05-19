"""
Tests for the Repository onboarding API.

Covers:
- POST /api/v1/repositories/connect (valid payload)
- POST /api/v1/repositories/connect (invalid URL)
- GET /api/v1/repositories
- GET /api/v1/repositories/{id} (found / not found)
"""

import uuid
from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio

VALID_PAYLOAD = {
    "repo_url": "https://github.com/octocat/hello-world",
    "github_token": "ghp_test_token_123",
    "branch": "main",
}

MOCK_GITHUB_RESPONSE = {
    "id": 1296269,
    "name": "hello-world",
    "full_name": "octocat/hello-world",
    "description": "My first repository on GitHub!",
    "private": False,
    "default_branch": "main",
    "language": "Python",
    "stargazers_count": 42,
}


# ---------------------------------------------------------------------------
# POST /repositories/connect
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_connect_repository_success(client: AsyncClient):
    """Valid payload with a mocked GitHub response should return 201."""
    with patch(
        "app.integrations.github.client.GitHubClient.get_repository",
        new_callable=AsyncMock,
        return_value=MOCK_GITHUB_RESPONSE,
    ):
        response = await client.post("/api/v1/repositories/connect", json=VALID_PAYLOAD)

    assert response.status_code == 201
    body = response.json()
    assert body["full_name"] == "octocat/hello-world"
    assert body["connection_status"] == "CONNECTED"
    assert "repository_id" in body


@pytest.mark.asyncio
async def test_connect_repository_invalid_url(client: AsyncClient):
    """Non-GitHub URL should fail Pydantic validation with 422."""
    payload = {**VALID_PAYLOAD, "repo_url": "https://gitlab.com/org/project"}
    response = await client.post("/api/v1/repositories/connect", json=payload)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_connect_repository_duplicate(client: AsyncClient):
    """Connecting the same repo twice should return the existing entry."""
    with patch(
        "app.integrations.github.client.GitHubClient.get_repository",
        new_callable=AsyncMock,
        return_value=MOCK_GITHUB_RESPONSE,
    ):
        first = await client.post("/api/v1/repositories/connect", json=VALID_PAYLOAD)
        second = await client.post("/api/v1/repositories/connect", json=VALID_PAYLOAD)

    assert first.status_code == 201
    assert second.status_code == 201
    assert first.json()["repository_id"] == second.json()["repository_id"]


# ---------------------------------------------------------------------------
# GET /repositories
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_list_repositories_empty(client: AsyncClient):
    """Empty DB should return an empty list."""
    response = await client.get("/api/v1/repositories")
    assert response.status_code == 200
    body = response.json()
    assert "items" in body
    assert isinstance(body["items"], list)


@pytest.mark.asyncio
async def test_list_repositories_after_connect(client: AsyncClient):
    """After connecting, the list should contain the repository."""
    with patch(
        "app.integrations.github.client.GitHubClient.get_repository",
        new_callable=AsyncMock,
        return_value=MOCK_GITHUB_RESPONSE,
    ):
        await client.post("/api/v1/repositories/connect", json=VALID_PAYLOAD)

    response = await client.get("/api/v1/repositories")
    assert response.status_code == 200
    body = response.json()
    assert body["total"] >= 1


# ---------------------------------------------------------------------------
# GET /repositories/{id}
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_get_repository_found(client: AsyncClient):
    """Should return full details for an existing repository."""
    with patch(
        "app.integrations.github.client.GitHubClient.get_repository",
        new_callable=AsyncMock,
        return_value=MOCK_GITHUB_RESPONSE,
    ):
        create_response = await client.post(
            "/api/v1/repositories/connect", json=VALID_PAYLOAD
        )

    repo_id = create_response.json()["repository_id"]
    response = await client.get(f"/api/v1/repositories/{repo_id}")
    assert response.status_code == 200
    assert response.json()["id"] == repo_id


@pytest.mark.asyncio
async def test_get_repository_not_found(client: AsyncClient):
    """Random UUID should return 404."""
    random_id = uuid.uuid4()
    response = await client.get(f"/api/v1/repositories/{random_id}")
    assert response.status_code == 404
