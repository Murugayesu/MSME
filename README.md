# Vivasaya Nanban - Smart Agriculture Web Application

A full-stack smart agriculture SaaS application for disease detection in crops using AI/ML.

## Features

- 🔐 Email/Password Authentication with Firebase
- 🗺️ Interactive Map with Leaflet.js for farm area selection
- 🛸 Drone Image Capture Simulation
- 🤖 AI-based Disease Detection for multiple crops
- 📱 Responsive SaaS UI with Glassmorphism design

## Supported Crops

- Cotton
- Guava
- Sugarcane
- Rice
- Tomato
- Brinjal

## Tech Stack

### Frontend
- React + Vite
- Tailwind CSS
- Leaflet.js
- React Router
- Firebase Authentication
- Recharts for analytics

### Backend
- FastAPI (Main API services)
- Flask (ML Prediction microservice)
- Firebase Authentication

## Project Structure

```
MSME/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── context/         # React context (Auth)
│   │   ├── services/       # API services
│   │   └── assets/         # Static assets
│   └── package.json
│
├── backend/                  # Python backend
│   ├── fastapi_app/        # FastAPI main application
│   ├── flask_ml_service/   # Flask ML prediction service
│   └── models/            # ML model files (.pkl)
│
└── README.md
```

## Quick Start

### Prerequisites

- Python 3.8+
- Node.js 18+
- npm or yarn

### 1. Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Install Frontend Dependencies

```bash
cd frontend
npm install
```

### 3. Start the Services

**Terminal 1 - FastAPI Backend (port 8000):**
```bash
cd backend/fastapi_app
uvicorn main:app --reload --port 8000
```

**Terminal 2 - Flask ML Service (port 5001):**
```bash
cd backend/flask_ml_service
python app.py
```

**Terminal 3 - Frontend (port 5173):**
```bash
cd frontend
npm run dev
```

### 4. Open the Application

- **Frontend:** http://localhost:5173
- **API Docs:** http://localhost:8000/docs

## Usage Flow

1. **Register** - Create a new account with email/password
2. **Login** - Use your registered credentials
3. **Dashboard** - View overview and select farm area on map
4. **Map Selection** - Draw polygon on map to select farm area
5. **Crop Selection** - Choose crop type (cotton, guava, etc.)
6. **Image Upload** - Upload crop image or simulate drone capture
7. **Prediction** - View AI-based disease diagnosis and recommendations

## API Endpoints

### FastAPI Main Service (port 8000)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| GET | `/health` | Service health status |
| POST | `/api/area` | Save farm area |
| POST | `/api/predict` | Forward to ML service |

### Flask ML Service (port 5001)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| GET | `/health` | ML service health |
| POST | `/predict` | Predict disease from image |

## ML Model Files

Place your `.pkl` model files in `backend/models/` directory:

- `cotton_disease_classification.pkl`
- `guava_disease_model.pkl`
- `sugarcane_disease_model.pkl`
- `rice_disease_classification.pkl`
- `tomato_disease_model.pkl`
- `brinjal_disease_classification.pkl`

**Note:** If models are not found, the system will use simulated predictions for demonstration.

## Environment Variables

### Frontend (.env)

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_API_URL=http://localhost:8000
VITE_FLASK_URL=http://localhost:5001
```

## Troubleshooting

### Backend won't start
- Make sure ports 8000 and 5001 are not in use
- Check Python dependencies are installed

### Frontend won't load
- Ensure npm install completed successfully
- Check browser console for errors

### Authentication errors
- Verify Firebase configuration is correct
- Check browser console for Firebase errors

### ML predictions not working
- Ensure Flask service is running on port 5001
- Check model files exist in backend/models/
- Check CORS settings in both services

## License

MIT License
