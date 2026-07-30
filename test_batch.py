import requests
import base64
import json

# Minimal 1x1 white pixel in base64
pixel = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="

def test_batch():
    url = "http://127.0.0.1:5001/predict_batch"
    payload = {
        "crop_type": "cotton",
        "images": [pixel, pixel]
    }
    try:
        print("Testing /predict_batch with 2 images...")
        resp = requests.post(url, json=payload, timeout=10)
        print(f"Status: {resp.status_code}")
        print(f"Response: {json.dumps(resp.json(), indent=2)}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_batch()
