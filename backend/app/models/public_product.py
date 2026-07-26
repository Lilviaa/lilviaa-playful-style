from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List
from datetime import datetime

class ProductColor(BaseModel):
    name: str
    hex: str

class PublicProductResponse(BaseModel):
    slug: str
    name: str
    price: float
    compareAt: Optional[float] = None
    image: str
    gallery: List[str]
    category: str
    gender: str
    ageRange: str = Field(alias="age_range")  # Map from DB age_range to ageRange, wait, I can just name the field ageRange and use Field mapping, but let's use alias generator or manual dict parsing in the route.
    
    # Actually, it's safer to just define the exact fields and map them in the router to avoid alias issues with dict serialization.
    pass

# Let's redefine PublicProductResponse simply:
class PublicProductResponse(BaseModel):
    slug: str
    name: str
    price: float
    compareAt: Optional[float] = None
    image: str
    gallery: List[str]
    category: str
    gender: str
    ageRange: str
    sizes: List[str]
    colors: List[ProductColor]
    tag: Optional[str] = None
    description: str
    fabric: str
    care: str
    sku: Optional[str] = None
    stock: Optional[int] = None
