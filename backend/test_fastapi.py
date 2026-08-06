from fastapi import FastAPI, APIRouter
from fastapi.testclient import TestClient

app = FastAPI()
router = APIRouter(prefix="/orders")

@router.get("")
def get_empty():
    return {"msg": "empty"}

@router.get("/")
def get_slash():
    return {"msg": "slash"}

app.include_router(router)

client = TestClient(app)
print("GET /orders ->", client.get("/orders").status_code)
print("GET /orders/ ->", client.get("/orders/").status_code)
