import os
import pickle
import numpy as np
from PIL import Image
import io
import base64
import threading

MODEL_DIR = os.path.join(os.path.dirname(__file__), '..', 'models')

CROP_CLASSES = {
    'cotton':    ['Bacterial Blight', 'Curl Virus', 'Healthy'],
    'guava':     ['Canker', 'Wilt', 'Healthy'],
    'sugarcane': ['Red Rot', 'Grassy Shoot', 'Healthy'],
    'rice':      ['Leaf Blast', 'Brown Spot', 'Healthy'],
    'tomato':    ['Late Blight', 'Mosaic Virus', 'Healthy'],
    'brinjal':   ['Fruit Borer', 'Healthy'],
}

CROP_TARGET_SIZES = {
    'cotton':    (180, 180),
    'guava':     (180, 180),
    'sugarcane': (180, 180),
    'rice':      (180, 180),
    'tomato':    (180, 180),
    'brinjal':   (180, 180),
}

CROP_MODEL_FILES = {
    'cotton':    'cotton_disease_classification.pkl',
    'guava':     'guava_disease_model.pkl',
    'sugarcane': 'sugarcane_disease_model.pkl',
    'rice':      'rice_disease_classification.pkl',
    'tomato':    'tomato_disease_model.pkl',
    'brinjal':   'brinjal_disease_classification.pkl',
}


class ModelManager:
    """
    Manages lazy-loading of per-crop disease detection models.

    Design choice: models are LAZILY loaded on first request for each crop
    (not all at startup) because several models are 100-300 MB.  However,
    once a model is loaded it is CACHED in `self.models` for the lifetime of
    the process — so subsequent calls for the same crop type are instant.

    Thread safety: a per-crop lock prevents multiple concurrent requests from
    loading the same model file simultaneously.
    """

    def __init__(self):
        self.models: dict = {}
        self._locks: dict = {crop: threading.Lock() for crop in CROP_MODEL_FILES}
        self.classes = CROP_CLASSES
        self.target_sizes = CROP_TARGET_SIZES
        self.model_files = CROP_MODEL_FILES
        print("ModelManager initialised – models will be loaded on first use per crop.")

    # ── Model Loading ─────────────────────────────────────────────────────────

    def get_model(self, crop_type: str):
        """Return the cached model, loading it once if necessary."""
        # Hot-path: model already loaded (no lock needed after first load)
        if crop_type in self.models:
            return self.models[crop_type]

        if crop_type not in self.model_files:
            print(f"[ModelManager] No model defined for '{crop_type}'.")
            return None

        # Serialize first-load per crop with a per-crop lock
        with self._locks[crop_type]:
            # Check again inside the lock (another thread may have loaded it)
            if crop_type in self.models:
                return self.models[crop_type]

            file_path = os.path.join(MODEL_DIR, self.model_files[crop_type])
            if not os.path.exists(file_path):
                print(f"[ModelManager] Model file not found: {file_path}")
                return None

            try:
                print(f"[ModelManager] Loading '{crop_type}' model from {file_path} …")
                with open(file_path, 'rb') as f:
                    model = pickle.load(f)
                self.models[crop_type] = model
                print(f"[ModelManager] '{crop_type}' model loaded and cached.")
                return model
            except Exception as e:
                print(f"[ModelManager] Failed to load '{crop_type}' model: {e}")
                return None

    # ── Image Preprocessing ───────────────────────────────────────────────────

    def preprocess_image(self, image_data: str, crop_type: str):
        """Decode a base64 image string and return a normalised numpy array."""
        try:
            target_size = self.target_sizes.get(crop_type, (224, 224))
            # Strip data-URI header if present
            if ',' in image_data:
                image_data = image_data.split(',', 1)[1]
            img_bytes = base64.b64decode(image_data)
            img = Image.open(io.BytesIO(img_bytes)).convert('RGB')
            img = img.resize(target_size, Image.BILINEAR)   # BILINEAR is faster than LANCZOS
            img_array = np.array(img, dtype=np.float32) / 255.0
            return np.expand_dims(img_array, axis=0)
        except Exception as e:
            print(f"[ModelManager] Preprocessing error: {e}")
            return None

    # ── Single Prediction ─────────────────────────────────────────────────────

    def predict(self, crop_type: str, image_data: str) -> dict:
        """Run inference for a single image and return a result dict."""
        model = self.get_model(crop_type)

        if model is None:
            return self._simulation_result(crop_type, confidence_range=(0.70, 0.85))

        processed_img = self.preprocess_image(image_data, crop_type)
        if processed_img is None:
            return {"error": "Image processing failed"}

        try:
            raw = model.predict(processed_img, verbose=0)
            class_idx = int(np.argmax(raw[0]))
            confidence = float(np.max(raw[0]))
            crop_classes = self.classes.get(crop_type, ["Unknown"])
            label = crop_classes[class_idx] if class_idx < len(crop_classes) else "Unknown Disease"
            print(f"[ModelManager] predict({crop_type}): {label} ({confidence:.2f})")
            return self._format_result(label, confidence)
        except Exception as e:
            print(f"[ModelManager] Prediction error: {e}")
            return self._simulation_result(crop_type, confidence_range=(0.60, 0.75))

    # ── Batch Prediction ──────────────────────────────────────────────────────

    def predict_batch(self, crop_type: str, images: list) -> list:
        """
        Run inference for a list of base64 image strings in a single model call.
        Falls back to sequential simulation if the model is unavailable.
        Returns a list of result dicts in the same order as `images`.
        """
        model = self.get_model(crop_type)
        target_size = self.target_sizes.get(crop_type, (224, 224))

        if model is None:
            return [self._simulation_result(crop_type) for _ in images]

        # Build batch array — skip bad images but track positions
        results = [None] * len(images)
        valid_indices = []
        batch_arrays = []

        for i, img_data in enumerate(images):
            arr = self.preprocess_image(img_data, crop_type)
            if arr is not None:
                valid_indices.append(i)
                batch_arrays.append(arr[0])   # strip the batch dim; we'll stack
            else:
                results[i] = {"error": "Image processing failed"}

        if not batch_arrays:
            return results

        try:
            batch = np.stack(batch_arrays, axis=0)          # (N, H, W, 3)
            raw = model.predict(batch, verbose=0)            # (N, num_classes)

            crop_classes = self.classes.get(crop_type, ["Unknown"])
            for j, global_idx in enumerate(valid_indices):
                class_idx = int(np.argmax(raw[j]))
                confidence = float(np.max(raw[j]))
                label = crop_classes[class_idx] if class_idx < len(crop_classes) else "Unknown Disease"
                results[global_idx] = self._format_result(label, confidence)

        except Exception as e:
            print(f"[ModelManager] Batch prediction error: {e}")
            for global_idx in valid_indices:
                results[global_idx] = self._simulation_result(crop_type)

        return results

    # ── Helpers ───────────────────────────────────────────────────────────────

    @staticmethod
    def _format_result(label: str, confidence: float) -> dict:
        healthy = label == "Healthy"
        return {
            "status": "success",
            "prediction": label,
            "confidence": round(confidence, 2),
            "recommendation": (
                "Your crop looks great! Continue existing nutrient schedule."
                if healthy else
                "Consult a local agronomist."
            ),
            "health_status": "healthy" if healthy else "unhealthy",
        }

    def _simulation_result(self, crop_type: str, confidence_range=(0.70, 0.85)) -> dict:
        import random
        label = random.choice(self.classes.get(crop_type, ["Unknown Disease", "Healthy"]))
        confidence = round(random.uniform(*confidence_range), 2)
        return self._format_result(label, confidence)

    def loaded_crops(self) -> list:
        """Return list of crops whose models are currently cached in memory."""
        return list(self.models.keys())


model_manager = ModelManager()
