import httpx
import json

BASE_URL = "http://127.0.0.1:8000/api/v1"

async def test_login():
    async with httpx.AsyncClient() as client:
        # 1. Signup
        payload = {
            "email": "testuser_httpx@example.com",
            "password": "testpassword",
            "full_name": "Test User"
        }
        print(f"Signing up {payload['email']}...")
        resp = await client.post(f"{BASE_URL}/auth/signup", json=payload)
        print(f"Signup Status: {resp.status_code}")
        if resp.status_code != 201:
            print(f"Signup Body: {resp.text}")

        # 2. Login
        payload = {
            "email": "testuser_httpx@example.com",
            "password": "testpassword"
        }
        print(f"Logging in...")
        resp = await client.post(f"{BASE_URL}/auth/login", json=payload)
        print(f"Login Status: {resp.status_code}")
        login_data = resp.json()
        
        if resp.status_code == 200:
            token = login_data["access_token"]
            # 3. Verify
            print(f"Verifying token...")
            headers = {"Authorization": f"Bearer {token}"}
            resp = await client.get(f"{BASE_URL}/auth/verify", headers=headers)
            print(f"Verify Status: {resp.status_code}")
            print(f"Verify Body: {resp.json()}")

if __name__ == "__main__":
    import asyncio
    asyncio.run(test_login())
