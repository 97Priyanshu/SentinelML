from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from . import models
from .database import engine, get_db
from pydantic import BaseModel
import joblib
import numpy as np
import os

# Create the database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="INGRES AI Industrial Monitor") # Using your preferred project naming style

# CORS for React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- LOAD MODELS ON STARTUP ---
base_dir = os.path.dirname(__file__)

# 1. RUL Model
try:
    rul_model = joblib.load(os.path.join(base_dir, '../models/rul_rf_model.pkl'))
    print("✅ RUL Model loaded.")
except:
    rul_model = None

# 2. Anomaly Model & Scaler
try:
    anomaly_model = joblib.load(os.path.join(base_dir, '../models/anomaly_model.pkl'))
    energy_scaler = joblib.load(os.path.join(base_dir, '../models/energy_scaler.pkl'))
    print("✅ Anomaly Model & Scaler loaded.")
except:
    anomaly_model, energy_scaler = None, None


# --- PYDANTIC SCHEMAS ---
class EngineDataInput(BaseModel):
    machine_id: str
    features: list[float] 

class EnergyDataInput(BaseModel):
    machine_id: str
    features: list[float] # Must match the number of features used in training


# --- API ENDPOINTS ---
@app.get("/")
def health_check():
    return {"status": "System Online"}

@app.post("/predict-rul")
def predict_rul(data: EngineDataInput, db: Session = Depends(get_db)):
    if rul_model is None:
        return {"error": "RUL model offline."}

    input_data = np.array(data.features).reshape(1, -1)
    predicted_rul = rul_model.predict(input_data)[0]
    
    status = "Critical Warning" if predicted_rul < 30 else "Healthy"
    
    new_log = models.AnomalyLog(
        machine_id=data.machine_id,
        sensor_reading=float(predicted_rul), 
        severity=status,
        ai_summary=f"Engine has approximately {int(predicted_rul)} cycles remaining."
    )
    db.add(new_log)
    db.commit()
    
    return {"machine_id": data.machine_id, "estimated_rul": int(predicted_rul), "status": status}


@app.post("/detect-anomaly")
def detect_anomaly(data: EnergyDataInput, db: Session = Depends(get_db)):
    if anomaly_model is None or energy_scaler is None:
        return {"error": "Anomaly model or scaler offline."}

    # 1. Reshape the incoming data
    input_data = np.array(data.features).reshape(1, -1)
    
    # 2. SCALE the data using the exact same scaler from training!
    scaled_data = energy_scaler.transform(input_data)
    
    # 3. Predict (returns 1 for normal, -1 for anomaly)
    prediction = anomaly_model.predict(scaled_data)[0]
    
    is_anomaly = True if prediction == -1 else False
    status = "Anomaly Detected" if is_anomaly else "Normal"
    
    # 4. Log to database if it's an anomaly
    if is_anomaly:
        new_log = models.AnomalyLog(
            machine_id=data.machine_id,
            sensor_reading=data.features[0], # Just logging the first feature (e.g., power) for reference
            severity="High",
            ai_summary="Multivariate sensor mismatch detected. Investigating required." # Placeholder for our future LLM agent
        )
        db.add(new_log)
        db.commit()
    
    return {
        "machine_id": data.machine_id,
        "anomaly_detected": is_anomaly,
        "status": status
    }