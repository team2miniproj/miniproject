from pydantic import BaseModel
from typing import List

class EmotionRequest(BaseModel):
    text: str

class EmotionDetail(BaseModel):
    emotion: str
    score: float
    emoji: str

class EmotionResponse(BaseModel):
    primary_emotion: str
    primary_emotion_score: float
    primary_emotion_emoji: str
    all_emotions: List[EmotionDetail]
    confidence: float 