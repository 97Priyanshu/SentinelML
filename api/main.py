from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from . import models
from .database import engine, get_db
from pydantic import BaseModel

# Create the database tables if they don't exist yet
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Industrial AI Monitor API")

# Allow your React frontend to talk to this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, put your React URL here
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic Schema: Validates incoming JSON data
class SensorDataInput(BaseModel):
    machine_id: str
    temperature: float
    vibration: float

@app.get("/")
def health_check():
    return {"status": "System Online", "message": "API is running."}

@app.post("/detect-anomaly")
def detect_anomaly(data: SensorDataInput, db: Session = Depends(get_db)):
    # TODO: Load our Isolation Forest model here
    # TODO: Pass data.temperature and data.vibration to the model
    
    # Mocking a response for now
    is_anomaly = True if data.temperature > 100 else False
    
    if is_anomaly:
        # Save to database
        new_log = models.AnomalyLog(
            machine_id=data.machine_id,
            sensor_reading=data.temperature,
            severity="High"
        )
        db.add(new_log)
        db.commit()
    
    return {"machine": data.machine_id, "anomaly_detected": is_anomaly}