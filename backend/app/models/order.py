from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

class OrderItemCreate(BaseModel):
    product_variant_id: str
    quantity: int
    unit_price: float

class OrderCreate(BaseModel):
    # For now, we accept address details to create an address or use an existing one
    shipping_address_id: Optional[str] = None
    # Alternatively, raw address if guest (though schema requires user_id for addresses, 
    # we'll handle this in the endpoint)
    full_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip: Optional[str] = None
    
    payment_method: str
    total_amount: float
    shipping_amount: float
    items: List[OrderItemCreate]
    
    coupon_code: Optional[str] = None

class OrderItemResponse(BaseModel):
    id: str
    order_id: str
    product_variant_id: str
    quantity: int
    unit_price: float
    total_price: float
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class OrderResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    status: str
    total_amount: float
    shipping_amount: float
    payment_method: str
    shipping_address_id: Optional[str] = None
    coupon_code: Optional[str] = None
    coupon_discount: float = 0.0
    created_at: datetime
    updated_at: datetime
    
    items: Optional[List[OrderItemResponse]] = []
    
    model_config = ConfigDict(from_attributes=True)
