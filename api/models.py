from sqlalchemy import Column, Integer, Float, String, DateTime
from datetime import datetime
from .database import Base

class AnomalyLog(Base):
    __tablename__ = "anomaly_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    machine_id = Column(String, index=True)
    sensor_reading = Column(Float)
    severity = Column(String)  # e.g., "Warning", "Critical"
    ai_summary = Column(String) # For our LLM agent later