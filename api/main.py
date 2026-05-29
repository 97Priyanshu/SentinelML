from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from . import models
from .database import engine, get_db
from pydantic import BaseModel
import joblib
import numpy as np
import os

# Create the database tables if they don't exist yet
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Industrial AI Monitor API")

# Allow your React frontend to talk to this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- LOAD THE ML MODEL ON STARTUP ---
# We load it here so it only loads once when the server boots up, not on every request.
model_path = os.path.join(os.path.dirname(__file__), '../models/rul_rf_model.pkl')
try:
    rul_model = joblib.load(model_path)
    print("✅ RUL Model loaded successfully into memory.")
except Exception as e:
    rul_model = None
    print("⚠️ Warning: RUL Model not found. Train it first!")

# --- PYDANTIC SCHEMAS ---
class SensorDataInput(BaseModel):
    machine_id: str
    temperature: float
    vibration: float

class EngineDataInput(BaseModel):
    machine_id: str
    # The model expects exactly 24 numbers (3 settings + 21 sensors)
    features: list[float] 

# --- API ENDPOINTS ---
@app.get("/")
def health_check():
    return {"status": "System Online", "message": "API is running."}

@app.post("/predict-rul")
def predict_rul(data: EngineDataInput, db: Session = Depends(get_db)):
    if rul_model is None:
        return {"error": "Machine learning model is offline."}

    # scikit-learn expects a 2D array for predictions, so we reshape the list
    input_data = np.array(data.features).reshape(1, -1)
    
    # The model returns an array of predictions, we just want the first (and only) one
    predicted_rul = rul_model.predict(input_data)[0]
    
    # Business Logic: If the engine has less than 30 cycles left, flag it as critical
    status = "Critical Warning" if predicted_rul < 30 else "Healthy"
    
    # Save this event to our SQLite database for auditing
    new_log = models.AnomalyLog(
        machine_id=data.machine_id,
        sensor_reading=float(predicted_rul), 
        severity=status,
        ai_summary=f"Engine has approximately {int(predicted_rul)} cycles remaining."
    )
    db.add(new_log)
    db.commit()
    
    return {
        "machine_id": data.machine_id,
        "estimated_rul_cycles": int(predicted_rul),
        "status": status
    }