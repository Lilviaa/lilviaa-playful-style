import httpx

base_url = "http://localhost:8000/api/v1"

with httpx.Client() as client:
    # 1. Login
    print("Logging in...")
    res = client.post(f"{base_url}/auth/login", data={
        "username": "testuser_orders@test.com",
        "password": "Password1!"
    })
    print("Login status:", res.status_code)
    
    token = client.cookies.get("access_token")
    print("Has access_token after login:", bool(token))
    
    # 2. Hit /orders/me
    print("\nFetching /orders/me...")
    res2 = client.get(f"{base_url}/orders/me")
    print("Orders/me status:", res2.status_code)
    
    # 3. Logout
    print("\nLogging out...")
    csrf = client.cookies.get("csrf_token") or ""
    res3 = client.post(f"{base_url}/auth/logout", headers={"X-CSRF-Token": csrf})
    print("Logout status:", res3.status_code)
    
    token_after = client.cookies.get("access_token")
    print("Has access_token in cookie jar after logout:", bool(token_after))
    
    # 4. Hit /orders/me again
    print("\nFetching /orders/me after logout...")
    res4 = client.get(f"{base_url}/orders/me")
    print("Orders/me status after logout:", res4.status_code)
