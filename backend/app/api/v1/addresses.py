from fastapi import APIRouter, Depends, status, HTTPException
from typing import List
from app.models.address import AddressCreate, AddressUpdate, AddressResponse
from app.api.dependencies import get_current_user_id
from app.db.supabase import get_supabase
from app.core.exceptions import AppError, NotFoundError

router = APIRouter()

@router.get("/", response_model=List[AddressResponse])
def get_addresses(user_id: str = Depends(get_current_user_id)):
    """Get all addresses for the current user."""
    supabase = get_supabase()
    result = supabase.table("addresses").select("*").eq("user_id", user_id).execute()
    return result.data

@router.post("/", response_model=AddressResponse, status_code=status.HTTP_201_CREATED)
def create_address(address_in: AddressCreate, user_id: str = Depends(get_current_user_id)):
    """Create a new address for the current user (Max 5)."""
    supabase = get_supabase()
    
    # Check limit
    count_result = supabase.table("addresses").select("id", count="exact").eq("user_id", user_id).execute()
    if count_result.count and count_result.count >= 5:
        raise AppError("Maximum of 5 addresses allowed per user.")
        
    # Check for duplicate identical address
    duplicate_check = supabase.table("addresses").select("id").eq("user_id", user_id)\
        .eq("address", address_in.address)\
        .eq("city", address_in.city)\
        .eq("zip", address_in.zip).execute()
        
    if duplicate_check.data:
        raise AppError("This exact address is already saved in your account.")
        
    # Handle default logic
    if address_in.is_default:
        supabase.table("addresses").update({"is_default": False}).eq("user_id", user_id).execute()
        
    # Insert new address
    address_data = address_in.model_dump()
    address_data["user_id"] = user_id
    
    result = supabase.table("addresses").insert(address_data).execute()
    return result.data[0]

@router.put("/{address_id}", response_model=AddressResponse)
def update_address(address_id: str, address_in: AddressUpdate, user_id: str = Depends(get_current_user_id)):
    """Update an existing address for the current user."""
    supabase = get_supabase()
    
    # Check IDOR (must belong to user)
    existing = supabase.table("addresses").select("id").eq("id", address_id).eq("user_id", user_id).execute()
    if not existing.data:
        raise NotFoundError("Address not found")
        
    # Check for duplicate identical address (ignoring the current one)
    if address_in.address and address_in.city and address_in.zip:
        duplicate_check = supabase.table("addresses").select("id").eq("user_id", user_id)\
            .eq("address", address_in.address)\
            .eq("city", address_in.city)\
            .eq("zip", address_in.zip)\
            .neq("id", address_id).execute()
            
        if duplicate_check.data:
            raise AppError("Another identical address already exists in your account.")
        
    # Handle default logic
    if address_in.is_default:
        supabase.table("addresses").update({"is_default": False}).eq("user_id", user_id).execute()
        
    updates = address_in.model_dump(exclude_unset=True)
    if updates:
        result = supabase.table("addresses").update(updates).eq("id", address_id).eq("user_id", user_id).execute()
        return result.data[0]
        
    # Return existing if no updates
    return supabase.table("addresses").select("*").eq("id", address_id).eq("user_id", user_id).execute().data[0]

@router.delete("/{address_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_address(address_id: str, user_id: str = Depends(get_current_user_id)):
    """Delete an address for the current user."""
    supabase = get_supabase()
    
    # Check IDOR
    existing = supabase.table("addresses").select("id").eq("id", address_id).eq("user_id", user_id).execute()
    if not existing.data:
        raise NotFoundError("Address not found")
        
    supabase.table("addresses").delete().eq("id", address_id).eq("user_id", user_id).execute()
    return
