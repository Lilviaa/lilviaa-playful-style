import httpx
import json

base_url = "http://localhost:8000/api/v1"

# 1. Login/Register a dummy user
res = httpx.post(f"{base_url}/auth/register", json={
    "email": "testuser_orders@test.com",
    "password": "Password1!",
    "full_name": "Test User",
    "phone": "9999999999"
})

token = ""
if res.status_code in [200, 201]:
    token = res.cookies.get("access_token")
else:
    # try login
    res = httpx.post(f"{base_url}/auth/login", json={
        "email": "testuser_orders@test.com",
        "password": "Password1!"
    })
    token = res.cookies.get("access_token")

cookies = {"access_token": token}
print("Got token:", bool(token))

# 2. Hit /orders/me
res2 = httpx.get(f"{base_url}/orders/me", cookies=cookies)
print("Orders/me status:", res2.status_code)
orders = res2.json()
print("Number of orders:", len(orders))
if orders:
    print("First order user_id:", orders[0].get("user_id"))

