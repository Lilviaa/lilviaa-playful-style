from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class CategoryBase(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    sort_order: int = 0
    emoji: Optional[str] = None
    applicable_genders: list[str] = ["boys", "girls", "unisex"]

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    sort_order: Optional[int] = None
    emoji: Optional[str] = None
    applicable_genders: Optional[list[str]] = None

class CategoryResponse(CategoryBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
