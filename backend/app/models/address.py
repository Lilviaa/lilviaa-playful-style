from pydantic import BaseModel, constr
from typing import Optional
from datetime import datetime

class AddressBase(BaseModel):
    type: str = "Home"
    full_name: str
    phone: str
    address: str
    city: str
    state: str
    zip: str
    is_default: bool = False

class AddressCreate(AddressBase):
    pass

class AddressUpdate(BaseModel):
    type: Optional[str] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip: Optional[str] = None
    is_default: Optional[bool] = None

class AddressResponse(AddressBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime
