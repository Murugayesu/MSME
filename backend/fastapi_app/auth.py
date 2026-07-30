from fastapi import HTTPException, Security, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os

security = HTTPBearer()

def get_current_user():
    return {
        "uid": "dev_user_123",
        "name": "Dev Farmer",
        "email": "dev@example.com",
        "picture": None
    }
