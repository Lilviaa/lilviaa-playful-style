from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class CompanySettingsBase(BaseModel):
    company_name: str
    business_email: str
    website: Optional[str] = None
    phone_primary: str
    phone_secondary: Optional[str] = None
    gst_number: Optional[str] = None
    address_line: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    pincode: Optional[str] = None
    logo_url: Optional[str] = None
    facebook_url: Optional[str] = None
    instagram_url: Optional[str] = None
    youtube_url: Optional[str] = None
    whatsapp_number: Optional[str] = None
    support_email: Optional[str] = None
    
    # Billing & Shipping Settings
    enable_gst: bool = False
    gst_percentage: float = 0.0
    home_state: str = "Tamil Nadu"
    shipping_charge_home: float = 0.0
    shipping_charge_other: float = 0.0
    enable_free_shipping: bool = False
    free_shipping_above: float = 0.0

class CompanySettingsUpdate(CompanySettingsBase):
    pass

class CompanySettingsResponse(CompanySettingsBase):
    id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
