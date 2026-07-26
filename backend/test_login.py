import urllib.request
import urllib.parse
import json

url = "http://localhost:8000/api/v1/auth/login"
data = {
    "username": "test_simulate_12345@gmail.com",
    "password": "Password123!"
}
encoded_data = urllib.parse.urlencode(data).encode('utf-8')
req = urllib.request.Request(url, data=encoded_data, headers={'Content-Type': 'application/x-www-form-urlencoded'})

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
