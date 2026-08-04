import firebase_admin
from firebase_admin import credentials
from app.core.config import settings
import os

def init_firebase():
    if not firebase_admin._apps:
        # Check if the service account JSON path or string is provided in the environment
        cred_value = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
        
        if cred_value:
            if cred_value.strip().startswith("{"):
                import json
                try:
                    cred_dict = json.loads(cred_value)
                except Exception as e:
                    raise RuntimeError(f"FIREBASE_SERVICE_ACCOUNT_JSON contains invalid JSON: {e}")
                
                # Fix escaped newlines in private_key which is common in env vars
                if "private_key" in cred_dict:
                    cred_dict["private_key"] = cred_dict["private_key"].replace("\\n", "\n")
                
                try:
                    cred = credentials.Certificate(cred_dict)
                    firebase_admin.initialize_app(cred)
                    print("Firebase Admin initialized successfully using JSON string.")
                except Exception as e:
                    raise RuntimeError(f"Firebase initialize_app failed with JSON string: {e}")
            elif os.path.exists(cred_value):
                try:
                    cred = credentials.Certificate(cred_value)
                    firebase_admin.initialize_app(cred)
                    print("Firebase Admin initialized successfully using service account file.")
                except Exception as e:
                    raise RuntimeError(f"Firebase initialize_app failed with file: {e}")
            else:
                raise RuntimeError(f"FIREBASE_SERVICE_ACCOUNT_JSON path '{cred_value}' not found and is not valid JSON.")
        else:
            print("WARNING: FIREBASE_SERVICE_ACCOUNT_JSON not set. Firebase Admin not initialized properly.")
