import requests
res = requests.post("http://127.0.0.1:8000/api/v1/orders/validate-coupon", json={
    "code": "SAVE100",
    "cart_total": 5000,
    "user_id": None,
    "items": []
})
print(res.json())
