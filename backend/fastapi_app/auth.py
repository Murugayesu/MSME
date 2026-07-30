from fastapi import HTTPException, Security, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import firebase_admin
from firebase_admin import auth, credentials
import os

# Initialize Firebase Admin
# NOTE: In production, use a service account key file.
# For this setup, we'll assume the environment provides credentials or use default if available.
if not firebase_admin._apps:
    try:
        # Use implicit credentials or local file if present
        cred = credentials.Certificate("firebase_credentials.json") 
        firebase_admin.initialize_app(cred)
    except Exception:
        # Fallback for development (might fail real auth checks)
        print("Warning: Firebase credentials not found. Auth might fail.")
        # firebase_admin.initialize_app() 

security = HTTPBearer()

def get_current_user():
    return {
        "uid": "dev_user_123",
        "name": "Dev Farmer",
        "email": "dev@example.com",
        "picture": None
    }
