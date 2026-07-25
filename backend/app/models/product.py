from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

# ──────────────────────────────────────────
# Product Images
# ──────────────────────────────────────────
class ProductImageBase(BaseModel):
    url: str
    sort_order: int = 0

class ProductImageCreate(ProductImageBase):
    pass

class ProductImageResponse(ProductImageBase):
    id: str
    product_id: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class R2UploadRequest(BaseModel):
    filename: str
    content_type: str

class R2UploadResponse(BaseModel):
    upload_url: str
    file_path: str
    public_url: str

class R2UploadConfirmRequest(BaseModel):
    file_path: str
    product_id: str
    sort_order: int = 0


# ──────────────────────────────────────────
# Product Variants
# ──────────────────────────────────────────
class ProductVariantBase(BaseModel):
    size: str
    color: Optional[str] = None
    color_hex: Optional[str] = None
    sku: Optional[str] = None
    stock: int = 0
    price_override: Optional[float] = None

class ProductVariantCreate(ProductVariantBase):
    pass

class ProductVariantUpdate(BaseModel):
    size: Optional[str] = None
    color: Optional[str] = None
    sku: Optional[str] = None
    stock: Optional[int] = None
    price_override: Optional[float] = None

class ProductVariantResponse(ProductVariantBase):
    id: str
    product_id: str
    reserved_stock: int
    sales: int
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


# ──────────────────────────────────────────
# Products
# ──────────────────────────────────────────
class ProductBase(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    fabric: Optional[str] = None
    wash_care: Optional[str] = None
    category_id: Optional[str] = None
    gender: str = "unisex"
    age_range: Optional[str] = None
    tag: Optional[str] = None
    base_price: float
    sale_price: Optional[float] = None
    sale_start: Optional[datetime] = None
    sale_end: Optional[datetime] = None
    status: str = "draft"  # draft, published, archived

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    fabric: Optional[str] = None
    wash_care: Optional[str] = None
    category_id: Optional[str] = None
    gender: Optional[str] = None
    tag: Optional[str] = None
    base_price: Optional[float] = None
    sale_price: Optional[float] = None
    sale_start: Optional[datetime] = None
    sale_end: Optional[datetime] = None
    status: Optional[str] = None

class ProductResponse(ProductBase):
    id: str
    created_at: datetime
    updated_at: datetime
    
    variants: Optional[List[ProductVariantResponse]] = []
    images: Optional[List[ProductImageResponse]] = []
    category: Optional[dict] = None

    model_config = ConfigDict(from_attributes=True)
