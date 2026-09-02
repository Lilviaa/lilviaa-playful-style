import asyncio
import os
import sys
from dotenv import load_dotenv

# Load env
load_dotenv(os.path.join(os.path.dirname(__file__), '..', 'backend', '.env'))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from app.db.supabase import get_supabase
from app.api.v1.orders import get_razorpay_client

async def main():
    supabase = get_supabase()
    rzp = get_razorpay_client()
    
    if not rzp:
        print("Razorpay client not configured.")
        return

    print("Fetching all pending and cancelled orders...")
    # Fetch orders that are cancelled or pending
    res = supabase.table("orders").select("id, status").in_("status", ["pending", "cancelled"]).execute()
    orders = res.data
    
    if not orders:
        print("No orders to check.")
        return
        
    print(f"Found {len(orders)} orders to check.")
    
    fixed_count = 0
    
    for order in orders:
        order_id = order["id"]
        display_id = f"ORD-LV-{order_id[:8].upper()}"
        
        # Get the transaction
        tx_res = supabase.table("payment_transactions").select("*").eq("order_id", order_id).execute()
        if not tx_res.data:
            continue
            
        tx = tx_res.data[0]
        rzp_order_id = tx.get("razorpay_order_id")
        
        if not rzp_order_id:
            continue
            
        # Check Razorpay API
        try:
            payments = rzp.order.payments(rzp_order_id)
            captured = next((p for p in payments.get('items', []) if p.get('status') == 'captured'), None)
            
            if captured:
                print(f"[{display_id}] WARNING: Order is '{order['status']}' but was PAID in Razorpay! Fixing...")
                
                # We need to forcefully set it to processing
                # Because if it's cancelled, the RPC might not work or might need manual stock adjustment.
                # The RPC sets it to processing unconditionally.
                rpc_res = supabase.rpc("confirm_razorpay_payment", {
                    "p_razorpay_order_id": rzp_order_id,
                    "p_razorpay_payment_id": captured["id"],
                }).execute()
                
                # Update payment method
                supabase.table("orders").update({
                    "payment_method": captured.get("method", "UPI"),
                    "status": "processing" # Force to processing just in case RPC didn't override cancelled
                }).eq("id", order_id).execute()
                
                print(f"[{display_id}] FIXED -> changed to Processing.")
                fixed_count += 1
        except Exception as e:
            print(f"[{display_id}] Error checking Razorpay: {str(e)}")
            
    print(f"Done! Reconciled {fixed_count} paid orders that were stuck.")

if __name__ == "__main__":
    asyncio.run(main())
