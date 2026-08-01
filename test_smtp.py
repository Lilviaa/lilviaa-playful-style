import sys
import os

# Add backend directory to sys.path so we can import from app
sys.path.insert(0, os.path.abspath("backend"))

from app.core.email import send_otp_email

# Execute the email send
try:
    print("Triggering test email...")
    send_otp_email("dharanidh777@gmail.com", "123456")
    print("Finished.")
except Exception as e:
    print(f"Exception during sending: {e}")
