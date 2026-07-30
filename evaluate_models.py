"""Sample evaluation script for the saved disease classification models.

This script demonstrates a generic evaluation flow for the Keras models in
backend/models. It generates a small synthetic test batch for each model so the
script can run without a real dataset.

If you have real evaluation data, replace ``build_sample_batch`` with your own
test loader and pass the true labels to ``evaluate_model``.
"""

from __future__ import annotations

import pickle
from pathlib import Path
from typing import Dict, Tuple

import numpy as np
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
)


ROOT_DIR = Path(__file__).resolve().parent
MODELS_DIR = ROOT_DIR / "backend" / "models"


MODEL_CONFIGS: Dict[str, Tuple[Tuple[int, int], int]] = {
    "rice_disease_classification.pkl": ((224, 224), 3),
    "guava_disease_model.pkl": ((180, 180), 5),
    "brinjal_disease_classification.pkl": ((224, 224), 7),
    "sugarcane_disease_model.pkl": ((256, 256), 5),
    "cotton_disease_classification.pkl": ((224, 224), 4),
    "tomato_disease_model.pkl": ((224, 224), 10),
}


def load_model(model_path: Path):
    with open(model_path, "rb") as file:
        return pickle.load(file)


def build_sample_batch(image_size: Tuple[int, int], num_classes: int, sample_count: int = 8):
    """Create a tiny synthetic batch with the same input shape as the model."""
    height, width = image_size
    x_test = np.random.rand(sample_count, height, width, 3).astype(np.float32)
    y_true = np.random.randint(0, num_classes, size=sample_count)
    return x_test, y_true


def evaluate_model(model, x_test: np.ndarray, y_true: np.ndarray, model_name: str):
    predictions = model.predict(x_test, verbose=0)
    y_pred = np.argmax(predictions, axis=1)

    metrics = {
        "accuracy": accuracy_score(y_true, y_pred),
        "precision": precision_score(y_true, y_pred, average="weighted", zero_division=0),
        "recall": recall_score(y_true, y_pred, average="weighted", zero_division=0),
        "f1": f1_score(y_true, y_pred, average="weighted", zero_division=0),
        "confusion_matrix": confusion_matrix(y_true, y_pred),
    }

    print(f"\n{'=' * 70}")
    print(f"Model: {model_name}")
    print(f"{'=' * 70}")
    print(f"Accuracy : {metrics['accuracy']:.4f}")
    print(f"Precision: {metrics['precision']:.4f}")
    print(f"Recall   : {metrics['recall']:.4f}")
    print(f"F1 Score : {metrics['f1']:.4f}")
    print("\nConfusion Matrix:")
    print(metrics["confusion_matrix"])
    print("\nClassification Report:")
    print(classification_report(y_true, y_pred, zero_division=0))

    return metrics


def main():
    if not MODELS_DIR.exists():
        raise FileNotFoundError(f"Models directory not found: {MODELS_DIR}")

    for model_name, (image_size, num_classes) in MODEL_CONFIGS.items():
        model_path = MODELS_DIR / model_name
        if not model_path.exists():
            print(f"Skipping missing model: {model_name}")
            continue

        print(f"Loading {model_name}...")
        model = load_model(model_path)

        x_test, y_true = build_sample_batch(image_size, num_classes)
        evaluate_model(model, x_test, y_true, model_name)


if __name__ == "__main__":
    main()