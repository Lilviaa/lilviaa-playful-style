import firebase_admin
from firebase_admin import credentials
from app.core.config import settings
import os

def init_firebase():
    if not firebase_admin._apps:
        # Check if the service account JSON path is provided in the environment
        cred_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
        if cred_path and os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
            print("Firebase Admin initialized successfully using service account.")
        else:
            print("WARNING: FIREBASE_SERVICE_ACCOUNT_JSON not set or file not found. Firebase Admin not initialized properly.")
