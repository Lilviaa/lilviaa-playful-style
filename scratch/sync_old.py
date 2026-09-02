import asyncio
from httpx import AsyncClient
import os
import sys
from dotenv import load_dotenv

# Load env
load_dotenv(os.path.join(os.path.dirname(__file__), '..', 'backend', '.env'))

# Add backend to path to import supabase and rzp
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from app.db.supabase import get_supabase
from app.api.v1.orders import get_razorpay_client

async def main():
    supabase = get_supabase()
    
    # 1. Fetch order UUID
    res = supabase.table("orders").select("*").eq("display_id", "ORD-LV-13374135").execute()
    if not res.data:
        print("Order not found")
        return
        
    order = res.data[0]
    order_id = order["id"]
    print(f"Order UUID: {order_id}")
    
    # 2. Fetch payment transaction
    tx_res = supabase.table("payment_transactions").select("*").eq("order_id", order_id).execute()
    if not tx_res.data:
        print("No payment transaction")
        return
        
    tx = tx_res.data[0]
    rzp_order_id = tx["razorpay_order_id"]
    print(f"Razorpay Order ID: {rzp_order_id}")
    
    # 3. Check Razorpay
    rzp = get_razorpay_client()
    payments = rzp.order.payments(rzp_order_id)
    captured = next((p for p in payments.get('items', []) if p.get('status') == 'captured'), None)
    
    if captured:
        print(f"Found captured payment: {captured['id']}")
        
        # 4. Invoke RPC
        rpc_res = supabase.rpc("confirm_razorpay_payment", {
            "p_razorpay_order_id": rzp_order_id,
            "p_razorpay_payment_id": captured["id"],
        }).execute()
        
        print("RPC result:", rpc_res.data)
        
        # Update payment method
        supabase.table("orders").update({"payment_method": captured["method"]}).eq("id", order_id).execute()
        print("Order updated successfully!")
    else:
        print("No captured payment found in Razorpay for this order.")
        # If the user paid, but Razorpay didn't capture it... maybe it's authorized?
        authorized = next((p for p in payments.get('items', []) if p.get('status') == 'authorized'), None)
        if authorized:
            print(f"Found authorized payment: {authorized['id']}. Capturing...")
            rzp.payment.capture(authorized['id'], authorized['amount'])
            print("Captured! Run script again.")
        else:
            print("Payments:", payments)

asyncio.run(main())
