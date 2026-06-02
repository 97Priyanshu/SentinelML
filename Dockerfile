# Use the official Python 3.12 image
FROM python:3.12-slim

# Set the working directory inside the container
WORKDIR /app

# Copy the requirements file into the container
COPY requirements.txt .

# Install the dependencies
# (We install lightgbm dependencies first as it requires some system libraries)
RUN apt-get update && apt-get install -y libgomp1 && rm -rf /var/lib/apt/lists/*
RUN pip install --no-cache-dir -r requirements.txt

# Copy the API code and the trained models into the container
COPY api/ ./api/
COPY models/ ./models/

# Expose port 8000 for FastAPI
EXPOSE 8000

# Start the FastAPI server
CMD ["sh", "-c", "uvicorn api.main:app --host 0.0.0.0 --port ${PORT:-8000}"]