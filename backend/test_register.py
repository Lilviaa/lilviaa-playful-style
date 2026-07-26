import urllib.request
import json

url = "http://localhost:8000/api/v1/auth/register"
data = {
    "email": "test_simulate_12345@gmail.com",
    "password": "Password123!",
    "full_name": "Test User",
    "phone": "1234567890"
}
req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers={'Content-Type': 'application/json'})

try:
    print("Sending POST to", url)
    res = urllib.request.urlopen(req)
    print("Status Code:", res.getcode())
    print("Response:", res.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print("Status Code:", e.code)
    print("Response:", e.read().decode('utf-8'))
except Exception as e:
    print("Error:", e)
