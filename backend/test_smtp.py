from app.core.email import send_otp_email

try:
    print("Triggering test email...")
    send_otp_email("dharanidh777@gmail.com", "123456")
    print("Finished.")
except Exception as e:
    print(f"Exception during sending: {e}")
