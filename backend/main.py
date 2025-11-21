from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import numpy as np

app = FastAPI()

# Example input model for prediction
class PredictRequest(BaseModel):
    features: list

# Load your ML model (replace with your model path)
# model = joblib.load('model.joblib')

@app.get("/")
def read_root():
    return {"message": "ML Backend is running"}

@app.post("/predict")
def predict(request: PredictRequest):
    # Replace with your model prediction logic
    # prediction = model.predict(np.array(request.features).reshape(1, -1))
    prediction = [42]  # Dummy output
    return {"prediction": prediction}
