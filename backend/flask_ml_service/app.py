from flask import Flask, jsonify, request
from flask_cors import CORS
from model_manager import model_manager

app = Flask(__name__)
CORS(app)


@app.route('/')
def home():
    return jsonify({"message": "Vivasaya Nanban ML Service is Running"})


@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy",
        "loaded_models": model_manager.loaded_crops(),
    })


@app.route('/predict', methods=['POST'])
def predict():
    """Single-image prediction endpoint."""
    data = request.get_json(force=True)
    crop_type = data.get('crop_type')
    image_data = data.get('image')  # base64 string

    if not crop_type:
        return jsonify({"error": "No crop type provided"}), 400
    if not image_data:
        return jsonify({"error": "No image provided"}), 400

    result = model_manager.predict(crop_type, image_data)
    return jsonify(result)


@app.route('/predict_batch', methods=['POST'])
def predict_batch():
    """
    Batch prediction endpoint — accepts multiple images in one request.

    Request body:
        {
            "crop_type": "cotton",
            "images": ["<base64>", "<base64>", ...]
        }

    Response:
        [ { ...result }, { ...result }, ... ]   — in the same order as "images"
    """
    data = request.get_json(force=True)
    crop_type = data.get('crop_type')
    images = data.get('images', [])

    if not crop_type:
        return jsonify({"error": "No crop_type provided"}), 400
    if not images:
        return jsonify({"error": "No images provided"}), 400

    results = model_manager.predict_batch(crop_type, images)
    return jsonify(results)


if __name__ == '__main__':
    app.run(port=5001, debug=False, use_reloader=False, threaded=True)
