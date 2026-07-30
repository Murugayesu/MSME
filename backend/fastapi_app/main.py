from fastapi import FastAPI, Depends, HTTPException, Security, status, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List
from pydantic import BaseModel
import requests
import os
import tempfile
import shutil

from auth import get_current_user
import datetime
from video_utils import extract_frames, parse_srt, match_frames_to_gps

app = FastAPI(title="Smart Agriculture SaaS API")

# CORS Configuration
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://msme-agriculture.vercel.app")
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    FRONTEND_URL,
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

FLASK_ML_URL = os.getenv("FLASK_ML_URL", "http://localhost:5001")

class UserProfile(BaseModel):
    username: str
    email: Optional[str] = None
    phone_number: Optional[str] = None
    farm_location: Optional[str] = None
    farm_size: Optional[str] = None
    main_crops: Optional[str] = None
    experience: Optional[str] = None

# In-memory storage for user profiles (with file fallback)
import json
PROFILES_FILE = "user_profiles.json"

def load_profiles():
    if os.path.exists(PROFILES_FILE):
        try:
            with open(PROFILES_FILE, "r") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}

def save_profiles(profiles):
    try:
        with open(PROFILES_FILE, "w") as f:
            json.dump(profiles, f)
    except Exception as e:
        print(f"Error saving profiles: {e}")

FARMS_FILE = "farms.json"

def load_farms():
    if os.path.exists(FARMS_FILE):
        try:
            with open(FARMS_FILE, "r") as f:
                return json.load(f)
        except Exception:
            return []
    return []

def save_farms_local(farms):
    try:
        with open(FARMS_FILE, "w") as f:
            json.dump(farms, f)
    except Exception as e:
        print(f"Error saving farms locally: {e}")

user_profiles = load_profiles()
farms_local = load_farms()

@app.get("/")
def read_root():
    return {"message": "Smart Agriculture FastAPI Service is Running"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

# Farmer Profile Endpoints
@app.get("/api/profile/me")
def get_profile(user: dict = Depends(get_current_user)):
    uid = user.get("uid")


    # 2. Try Local storage
    if uid in user_profiles:
        return user_profiles[uid]
    
    # Default initial data if not found
    return {
        "uid": uid,
        "username": user.get("name") or user.get("email", "").split('@')[0] if user.get("email") else "Farmer",
        "email": user.get("email") or "dev@example.com",
        "phone_number": "9876543210",
        "farm_location": "Coimbatore, Tamil Nadu",
        "farm_size": "5 Acres",
        "main_crops": "Cotton, Guava",
        "experience": "10 Years"
    }

@app.post("/api/profile/update")
def update_profile(profile: UserProfile, user: dict = Depends(get_current_user)):
    uid = user.get("uid")
    profile_data = profile.dict()
    profile_data["uid"] = uid
    
    # Ensure email is set if missing from request but present in auth
    if not profile_data.get("email") and user.get("email"):
        profile_data["email"] = user.get("email")
    
    # 1. Save to local storage
    user_profiles[uid] = profile_data
    save_profiles(user_profiles)
            
    print(f"Updating profile for user {uid}: {profile_data}")
    return {"status": "success", "message": "Profile updated successfully"}

# Dashboard & Map Endpoints
@app.post("/api/area")
def save_area(area_data: dict, user: dict = Depends(get_current_user)):
    # data: { "farmName": "...", "areas": [...], "sensors": [...] }
    uid = user.get("uid")
    farm_name = area_data.get("farmName", "Unnamed Farm")
    timestamp = datetime.datetime.now().isoformat()
    
    full_data = {
        "uid": uid,
        "farm_name": farm_name,
        "areas": area_data.get("areas", []),
        "sensors": area_data.get("sensors", []),
        "created_at": timestamp
    }
    
    # 2. Always save to local file as backup in dev
    farms_local.append(full_data)
    save_farms_local(farms_local)
    
    print(f"Farm '{farm_name}' saved locally for user {uid}")
    
    return {
        "status": "success", 
        "message": f"Farm '{farm_name}' saved successfully",
        "farm_id": str(int(datetime.datetime.now().timestamp()))
    }

@app.get("/api/farms")
def get_farms(user: dict = Depends(get_current_user)):
    uid = user.get("uid")
    user_farms = []

    # 2. Fallback to local
    local_farms = [f for f in farms_local if f.get("uid") == uid]
    # Assign stable index-based IDs so the frontend can reference them
    for i, f in enumerate(local_farms):
        f.setdefault("id", str(i))
    return local_farms

@app.delete("/api/farms/{farm_id}")
def delete_farm(farm_id: str, user: dict = Depends(get_current_user)):
    uid = user.get("uid")
    deleted = False

    # 2. Try local fallback (match by id field or by list index)
    global farms_local
    original_len = len(farms_local)
    farms_local = [
        f for f in farms_local
        if not (f.get("uid") == uid and (f.get("id") == farm_id or str(farms_local.index(f)) == farm_id))
    ]
    if len(farms_local) < original_len:
        save_farms_local(farms_local)
        deleted = True
        print(f"Farm {farm_id} deleted from local storage for user {uid}")

    if not deleted:
        raise HTTPException(status_code=404, detail="Farm not found or access denied")

    return {"status": "success", "message": f"Farm {farm_id} deleted"}

@app.put("/api/farms/{farm_id}")
def update_farm(farm_id: str, update_data: dict, user: dict = Depends(get_current_user)):
    uid = user.get("uid")
    updated = False

    updated_fields = {
        "farm_name": update_data.get("farmName"),
        "areas":     update_data.get("areas", []),
        "sensors":   update_data.get("sensors", []),
        "updated_at": datetime.datetime.now().isoformat(),
    }
    # Strip None values
    updated_fields = {k: v for k, v in updated_fields.items() if v is not None}

    # 2. Try local fallback
    global farms_local
    for i, farm in enumerate(farms_local):
        if farm.get("uid") == uid and (farm.get("id") == farm_id or str(i) == farm_id):
            farms_local[i].update(updated_fields)
            save_farms_local(farms_local)
            updated = True
            print(f"Farm {farm_id} updated in local storage for user {uid}")
            break

    if not updated:
        raise HTTPException(status_code=404, detail="Farm not found or access denied")

    return {"status": "success", "message": f"Farm {farm_id} updated"}



import random

@app.get("/api/sensors")
def get_sensor_data(farm_id: Optional[str] = None, user: dict = Depends(get_current_user)):
    # In a real app, this might query an IoT platform like ThingsBoard or AWS IoT
    # For now, generate realistic but dynamic data to feel "real-time"
    # Seed random with farm_id if provided to make stats consistent per farm for demo
    if farm_id:
        random.seed(farm_id)
    else:
        random.seed(None) # Truly random

    data = {
        "crop_health": f"{random.randint(90, 99)}%",
        "crop_health_trend": f"+{random.uniform(0.5, 3.5):.1f}%",
        "moisture": f"{random.randint(35, 55)}%",
        "moisture_trend": f"{random.choice(['+', '-'])}{random.uniform(0.5, 2.0):.1f}%",
        "temp": f"{random.randint(24, 32)}°C",
        "temp_trend": f"+{random.uniform(0.1, 1.0):.1f}%",
        "rainfall": f"{random.randint(5, 25)}%",
        "rainfall_trend": random.choice(["Steady", "Increasing", "Decreasing"])
    }
    
    # Reset seed for other parts of the app
    random.seed(None)
    return data

@app.get("/api/sensor-history")
def get_sensor_history(farm_id: Optional[str] = None, user: dict = Depends(get_current_user)):
    # Seed random with farm_id if provided
    if farm_id:
        random.seed(farm_id + "_history")
    else:
        random.seed(None)

    # Generate random historical data for the chart
    days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    history = [
        {"name": day, "health": random.randint(85, 99)} for day in days
    ]
    
    random.seed(None)
    return history

@app.post("/api/predict")
def predict_disease(data: dict, user: dict = Depends(get_current_user)):
    # data: { "crop_type": "cotton", "image": "base64..." }
    try:
        # Forward to Flask ML Service
        response = requests.post(f"{FLASK_ML_URL}/predict", json=data)
        response.raise_for_status()
        result = response.json()
        
        # Log prediction result for the user (in Firestore)
        print(f"Prediction for user {user['uid']}: {result.get('prediction')}")
        
        return result
    except requests.exceptions.RequestException as e:
        return {"error": f"ML Service unreachable: {str(e)}"}
    except Exception as e:
        return {"error": str(e)}


@app.post("/api/upload-video")
async def upload_video(
    video: UploadFile = File(...),
    srt: Optional[UploadFile] = File(None),
    crop_type: str = Form("cotton"),
    interval_sec: float = Form(5.0),
    user: dict = Depends(get_current_user),
):
    """
    Accept a drone video file and an optional .srt GPS telemetry file.
    Extracts frames at `interval_sec` intervals, matches them to GPS coordinates
    (if an SRT is provided), runs disease predictions, and returns a list of
    geolocated results.
    """
    tmp_dir = tempfile.mkdtemp()
    results = []
    try:
        # --- Save uploaded files ---
        video_ext = os.path.splitext(video.filename or "video.mp4")[1] or ".mp4"
        video_path = os.path.join(tmp_dir, f"drone_video{video_ext}")
        with open(video_path, "wb") as f:
            shutil.copyfileobj(video.file, f)

        srt_path = None
        if srt and srt.filename:
            srt_path = os.path.join(tmp_dir, "gps.srt")
            with open(srt_path, "wb") as f:
                shutil.copyfileobj(srt.file, f)

        # --- Extract frames ---
        try:
            frames = extract_frames(video_path, interval_sec=interval_sec, max_frames=20)
        except RuntimeError as e:
            raise HTTPException(status_code=500, detail=str(e))
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

        if not frames:
            raise HTTPException(status_code=400, detail="Could not extract any frames from the video.")

        # --- Parse GPS telemetry ---
        telemetry = []
        if srt_path:
            try:
                telemetry = parse_srt(srt_path)
            except Exception as e:
                print(f"Warning: SRT parse failed – {e}. Continuing without GPS data.")

        # --- Merge frames with closest GPS point ---
        georef_frames = match_frames_to_gps(frames, telemetry)

        # --- Run predictions using batch endpoint (1 HTTP call for all frames) ---
        predictions = []
        if georef_frames:
            try:
                batch_payload = {
                    "crop_type": crop_type,
                    "images": [item["image"] for item in georef_frames],
                }
                ml_response = requests.post(
                    f"{FLASK_ML_URL}/predict_batch",
                    json=batch_payload,
                    timeout=120,   # allow time for large batches
                )
                ml_response.raise_for_status()
                predictions = ml_response.json()
                print(f"Batch prediction complete: {len(predictions)} frames for crop={crop_type}")
            except Exception as e:
                print(f"Batch prediction failed ({e}), falling back to sequential …")
                # Sequential fallback
                for item in georef_frames:
                    try:
                        r = requests.post(
                            f"{FLASK_ML_URL}/predict",
                            json={"crop_type": crop_type, "image": item["image"]},
                            timeout=30,
                        )
                        r.raise_for_status()
                        predictions.append(r.json())
                    except Exception as ex:
                        predictions.append({
                            "prediction": "Error", "confidence": 0,
                            "status": "Error", "recommendation": f"ML error: {ex}",
                        })

        for item, pred in zip(georef_frames, predictions):
            results.append({
                "timestamp_sec": item["timestamp_sec"],
                "latitude":      item["latitude"],
                "longitude":     item["longitude"],
                "altitude":      item["altitude"],
                "prediction":    pred.get("prediction", "Unknown"),
                "confidence":    pred.get("confidence", 0),
                "status":        pred.get("status", "Unknown"),
                "recommendation": pred.get("recommendation", ""),
            })

        print(
            f"Video analysis complete for user {user['uid']}: "
            f"{len(results)} frames, crop={crop_type}"
        )

        return {
            "success": True,
            "crop_type": crop_type,
            "total_frames_analyzed": len(results),
            "has_gps": bool(telemetry),
            "results": results,
        }

    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)
