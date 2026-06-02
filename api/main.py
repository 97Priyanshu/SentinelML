from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
import joblib
import numpy as np
import os
from groq import Groq

from . import models
from .database import engine, get_db

# Create the database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="SentinelML API")

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

try:
    rul_model = joblib.load(os.path.join(base_dir, '../models/rul_rf_model.pkl'))
except:
    rul_model = None

try:
    anomaly_model = joblib.load(os.path.join(base_dir, '../models/anomaly_model.pkl'))
    energy_scaler = joblib.load(os.path.join(base_dir, '../models/energy_scaler.pkl'))
except:
    anomaly_model, energy_scaler = None, None
try:
    forecast_model = joblib.load(os.path.join(base_dir, '../models/forecast_lgb_model.pkl'))
    print("✅ Forecasting Model loaded.")
except:
    forecast_model = None


# --- PYDANTIC SCHEMAS ---
class EngineDataInput(BaseModel):
    machine_id: str
    features: list[float] 
    groq_key: str = "" # Now expecting the key from frontend

class EnergyDataInput(BaseModel):
    machine_id: str
    features: list[float]
    groq_key: str = "" 


# --- AGENTIC LLM HELPER FUNCTION ---
def get_ai_diagnostic(api_key: str, context: str, prompt: str) -> str:
    if not api_key:
        return "No API Key provided. Agent offline."
    try:
        client = Groq(api_key=api_key)
        chat_completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": context},
                {"role": "user", "content": prompt}
            ],
            model="llama-3.1-8b-instant", # <--- UPDATED MODEL HERE
            temperature=0.2, 
            max_tokens=100
        )
        return chat_completion.choices[0].message.content
    except Exception as e:
        return f"Agent Error: Check your API key. ({str(e)})"


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
    
    # 1. Trigger the Agent
    system_context = "You are an AI diagnostic agent for an industrial aerospace firm. Keep your response to 2 short sentences."
    user_prompt = f"Turbofan engine {data.machine_id} has an estimated Remaining Useful Life of {int(predicted_rul)} cycles. Status is {status}. Write a brief, professional recommendation for the maintenance crew."
    
    ai_summary = get_ai_diagnostic(data.groq_key, system_context, user_prompt)
    
    # 2. Log to DB
    new_log = models.AnomalyLog(
        machine_id=data.machine_id,
        sensor_reading=float(predicted_rul), 
        severity=status,
        ai_summary=ai_summary
    )
    db.add(new_log)
    db.commit()
    
    return {
        "machine_id": data.machine_id, 
        "estimated_rul": int(predicted_rul), 
        "status": status,
        "ai_summary": ai_summary
    }

@app.post("/detect-anomaly")
def detect_anomaly(data: EnergyDataInput, db: Session = Depends(get_db)):
    if anomaly_model is None or energy_scaler is None:
        return {"error": "Anomaly model offline."}

    input_data = np.array(data.features).reshape(1, -1)
    scaled_data = energy_scaler.transform(input_data)
    prediction = anomaly_model.predict(scaled_data)[0]
    
    is_anomaly = True if prediction == -1 else False
    status = "Anomaly Detected" if is_anomaly else "Nominal Cluster Vector"
    
    ai_summary = "Grid operating normally. No action required."
    
    # 1. Trigger the Agent ONLY if an anomaly is detected
    if is_anomaly:
        system_context = "You are an AI diagnostic agent monitoring a facility energy grid. Keep your response to 2 short sentences."
        user_prompt = f"Facility grid {data.machine_id} triggered a multivariate isolation forest anomaly alert. The power draw and thermal sensors are mismatched. Write a brief, urgent recommendation for the plant manager."
        
        ai_summary = get_ai_diagnostic(data.groq_key, system_context, user_prompt)
        
        # 2. Log to DB
        new_log = models.AnomalyLog(
            machine_id=data.machine_id,
            sensor_reading=data.features[0],
            severity="High",
            ai_summary=ai_summary 
        )
        db.add(new_log)
        db.commit()
    
    return {
        "machine_id": data.machine_id,
        "anomaly_detected": is_anomaly,
        "status": status,
        "ai_summary": ai_summary
    }

@app.post("/forecast-energy")
def forecast_energy(data: EnergyDataInput, db: Session = Depends(get_db)):
    if forecast_model is None:
        return {"error": "Forecast model offline."}

    # The LightGBM model expects 25 features based on our training data
    input_data = np.array(data.features[:25]).reshape(1, -1)
    predicted_wh = forecast_model.predict(input_data)[0]
    
    # 1. Trigger the Agent
    system_context = "You are an energy efficiency AI agent. Keep your response to 2 short sentences."
    user_prompt = f"Facility grid {data.machine_id} is forecasted to draw {int(predicted_wh)} Wh in the next hour. The primary driver is the T3 thermal zone (Laundry area). Give a quick recommendation to optimize this."
    
    ai_summary = get_ai_diagnostic(data.groq_key, system_context, user_prompt)
    
    # 2. Log to DB
    new_log = models.AnomalyLog(
        machine_id=data.machine_id,
        sensor_reading=float(predicted_wh),
        severity="Info",
        ai_summary=ai_summary 
    )
    db.add(new_log)
    db.commit()
    
    return {
        "machine_id": data.machine_id,
        "forecasted_wh": int(predicted_wh),
        "ai_summary": ai_summary
    }