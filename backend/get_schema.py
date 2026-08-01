from supabase import create_client
import os

url = os.environ.get("SUPABASE_URL", "https://fcrbgzhpziffzcpxrthr.supabase.co")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjcmJnemhwemlmZnpjcHhydGhyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDU2NzI0NiwiZXhwIjoyMTAwMTQzMjQ2fQ.omj7WA2HbUhEUgCBeIu-HTnPgPrmvcNagBblh0Xj3uE")

supabase = create_client(url, key)
res = supabase.table("users").select("*").limit(1).execute()
print(res.data[0].keys() if res.data else "No data")
