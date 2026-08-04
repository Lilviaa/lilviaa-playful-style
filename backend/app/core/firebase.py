import firebase_admin
from firebase_admin import credentials
from app.core.config import settings
import os

def init_firebase():
    if not firebase_admin._apps:
        # Check if the service account JSON path or string is provided in the environment
        cred_value = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
        
        if cred_value:
            try:
                if cred_value.strip().startswith("{"):
                    import json
                    cred_dict = json.loads(cred_value)
                    # Fix escaped newlines in private_key which is common in env vars
                    if "private_key" in cred_dict:
                        cred_dict["private_key"] = cred_dict["private_key"].replace("\\n", "\n")
                    cred = credentials.Certificate(cred_dict)
                    firebase_admin.initialize_app(cred)
                    print("Firebase Admin initialized successfully using JSON string.")
                elif os.path.exists(cred_value):
                    cred = credentials.Certificate(cred_value)
                    firebase_admin.initialize_app(cred)
                    print("Firebase Admin initialized successfully using service account file.")
                else:
                    print(f"WARNING: FIREBASE_SERVICE_ACCOUNT_JSON path '{cred_value}' not found.")
            except Exception as e:
                import traceback
                traceback.print_exc()
                print(f"WARNING: Failed to initialize Firebase Admin: {e}")
        else:
            print("WARNING: FIREBASE_SERVICE_ACCOUNT_JSON not set. Firebase Admin not initialized properly.")
