import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dotenv import load_dotenv

# Load env before importing app modules
load_dotenv()

from app.db.supabase import get_supabase
from app.core.email import send_order_confirmation_email

def main():
    supabase = get_supabase()
    
    # Get the latest order
    res = supabase.table("orders").select("*, users(email), order_items(*)").order("created_at", desc=True).limit(1).execute()
    
    if not res.data:
        print("No orders found.")
        return
        
    latest_order = res.data[0]
    to_email = latest_order.get("users", {}).get("email")
    if not to_email:
        # Fallback to the one provided by user if missing
        to_email = "kamaleshwaran63664@gmail.com"
        
    items = latest_order.get("order_items", [])
    
    print(f"Sending email for order {latest_order['id']} to {to_email}")
    send_order_confirmation_email(to_email, latest_order, items)
    print("Done!")

if __name__ == "__main__":
    main()
