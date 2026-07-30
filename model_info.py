import os
import sys
import pickle
import json
from pathlib import Path
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix, classification_report
import numpy as np


class ModelExplorer:
    def __init__(self, models_dir="backend/models"):
        self.models_dir = Path(models_dir)
        self.models = {}
        
    def explore_models(self):
        """Discover and load all models from the backend/models directory"""
        if not self.models_dir.exists():
            print(f"Models directory not found: {self.models_dir}")
            return
        
        model_files = list(self.models_dir.glob("*.pkl")) + list(self.models_dir.glob("*.joblib"))
        
        if not model_files:
            print(f"No model files found in {self.models_dir}")
            return
        
        print(f"Found {len(model_files)} model(s)\n")
        
        for model_file in model_files:
            try:
                with open(model_file, 'rb') as f:
                    model = pickle.load(f)
                self.models[model_file.name] = model
                print(f"✓ Loaded: {model_file.name}")
                print(f"  Model type: {type(model).__name__}\n")
            except Exception as e:
                print(f"✗ Failed to load {model_file.name}: {str(e)}\n")
    
    def evaluate_performance(self, y_true, y_pred, model_name="Model"):
        """Evaluate model performance using standard metrics"""
        metrics = {
            'model_name': model_name,
            'accuracy': accuracy_score(y_true, y_pred),
            'precision': precision_score(y_true, y_pred, average='weighted', zero_division=0),
            'recall': recall_score(y_true, y_pred, average='weighted', zero_division=0),
            'f1': f1_score(y_true, y_pred, average='weighted', zero_division=0),
            'confusion_matrix': confusion_matrix(y_true, y_pred).tolist(),
        }
        
        print(f"\n{'='*50}")
        print(f"Performance Evaluation: {model_name}")
        print(f"{'='*50}")
        print(f"Accuracy:  {metrics['accuracy']:.4f}")
        print(f"Precision: {metrics['precision']:.4f}")
        print(f"Recall:    {metrics['recall']:.4f}")
        print(f"F1-Score:  {metrics['f1']:.4f}")
        print(f"\nClassification Report:\n{classification_report(y_true, y_pred, zero_division=0)}")
        
        return metrics
    
    def get_model_info(self):
        """Display information about loaded models"""
        print(f"\n{'='*50}")
        print("Loaded Models Summary")
        print(f"{'='*50}")
        
        if not self.models:
            print("No models loaded")
            return
        
        for model_name, model in self.models.items():
            print(f"\nModel: {model_name}")
            print(f"  Type: {type(model).__name__}")
            
            # Display model attributes if available
            if hasattr(model, 'get_params'):
                params = model.get_params()
                print(f"  Parameters: {list(params.keys())[:5]}...")
            
            if hasattr(model, 'feature_importances_'):
                print(f"  Has feature importances: Yes")


def main():
    # Initialize explorer
    explorer = ModelExplorer(models_dir="backend/models")
    
    # Explore and load models
    print("Exploring models from backend/models...\n")
    explorer.explore_models()
    
    # Display model information
    explorer.get_model_info()
    
    # Example: Evaluate models (uncomment and modify with your data)
    # y_true = np.array([0, 1, 1, 0, 1])
    # y_pred = np.array([0, 1, 0, 0, 1])
    # metrics = explorer.evaluate_performance(y_true, y_pred, "Sample Model")


if __name__ == "__main__":
    main()

