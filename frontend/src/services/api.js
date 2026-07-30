// API Service for communicating with FastAPI backend

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const FLASK_ML_URL = import.meta.env.VITE_FLASK_URL || 'http://localhost:5001';

// Save farm area to backend
export const saveFarmArea = async (areaData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/area`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(areaData),
    });
    return await response.json();
  } catch (error) {
    console.error('Error saving farm area:', error);
    throw error;
  }
};

// Get disease prediction from ML service
export const predictDisease = async (cropType, imageData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        crop_type: cropType,
        image: imageData,
      }),
    });
    return await response.json();
  } catch (error) {
    console.error('Error predicting disease:', error);
    throw error;
  }
};

// Get available crop types
export const getCropTypes = async () => {
  return [
    { id: 'cotton', name: 'Cotton', icon: '🌿' },
    { id: 'guava', name: 'Guava', icon: '🍎' },
    { id: 'sugarcane', name: 'Sugarcane', icon: '🎋' },
    { id: 'rice', name: 'Rice', icon: '🍚' },
    { id: 'tomato', name: 'Tomato', icon: '🍅' },
    { id: 'brinjal', name: 'Brinjal', icon: '🍆' },
  ];
};

// Health check for backend
export const checkBackendHealth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return await response.json();
  } catch (error) {
    console.error('Backend health check failed:', error);
    return null;
  }
};

// Health check for ML service
export const checkMLServiceHealth = async () => {
  try {
    const response = await fetch(`${FLASK_ML_URL}/health`);
    return await response.json();
  } catch (error) {
    console.error('ML service health check failed:', error);
    return null;
  }
};

export default {
  saveFarmArea,
  predictDisease,
  getCropTypes,
  checkBackendHealth,
  checkMLServiceHealth,
};
