import os
import json
import uuid
import random
from fastapi.testclient import TestClient
from app.main import app
from app.api.dependencies import require_admin
from app.models.product import ProductCreate

# Override the admin dependency
async def override_require_admin():
    return {"sub": "admin-123", "role": "admin"}

app.dependency_overrides[require_admin] = override_require_admin

client = TestClient(app)

categories_map = {
    "t-shirt": {"name": "T-Shirts", "id": "1"},  # I'll fetch real ones from DB
    "dresses": {"name": "Dresses", "id": "2"}
}

def seed():
    # 1. Fetch categories to get actual IDs
    res = client.get("/api/v1/categories/")
    if res.status_code != 200:
        print("Failed to get categories:", res.text)
        return
        
    db_cats = res.json()
    if not db_cats:
        print("No categories found. Creating some...")
        # Create categories via Supabase client directly since no endpoint for category creation
        from app.db.supabase import get_supabase
        sup = get_supabase()
        cats_to_create = [
            {"name": "Shirts", "slug": "shirts"},
            {"name": "Dresses", "slug": "dresses"},
            {"name": "Trousers", "slug": "trousers"},
            {"name": "Ethnic", "slug": "ethnic"}
        ]
        sup.table("categories").insert(cats_to_create).execute()
        res = client.get("/api/v1/categories/")
        db_cats = res.json()
        
    print(f"Loaded {len(db_cats)} categories.")
    
    genders = ["boys", "girls", "unisex"]
    tags = [None, "new", "bestseller", "sale"]
    
    products_to_create = []
    
    for cat in db_cats:
        cat_id = cat["id"]
        cat_name = cat["name"]
        
        # Create 10 products per category
        for i in range(1, 11):
            gender = random.choice(genders)
            tag = random.choice(tags)
            base_price = random.randint(15, 60) * 10
            sale_price = base_price - random.randint(2, 5) * 10 if tag == "sale" else None
            
            p = {
                "name": f"{gender.capitalize()} {cat_name} {i}",
                "slug": f"{gender}-{cat_name.lower()}-{i}-{uuid.uuid4().hex[:6]}",
                "description": f"A wonderful {cat_name} for {gender}.",
                "fabric": "100% Cotton",
                "wash_care": "Machine wash cold",
                "category_id": cat_id,
                "gender": gender,
                "tag": tag,
                "base_price": base_price,
                "sale_price": sale_price,
                "status": "published",
                "variants": [
                    {
                        "size": "S",
                        "color": "Red",
                        "stock": random.randint(0, 10),
                    },
                    {
                        "size": "M",
                        "color": "Blue",
                        "stock": random.randint(0, 20),
                    }
                ]
            }
            products_to_create.append(p)
            
    print(f"Creating {len(products_to_create)} products...")
    created = 0
    for p in products_to_create:
        res = client.post("/api/v1/admin/products/", json=p)
        if res.status_code in [200, 201]:
            created += 1
        else:
            print(f"Failed to create {p['name']}:", res.text)
            
    print(f"Successfully seeded {created} products.")

if __name__ == "__main__":
    seed()
