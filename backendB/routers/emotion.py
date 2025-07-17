"""
감정 분석 API 라우터
"""
from fastapi import APIRouter, HTTPException
from schemas.emotion import EmotionRequest, EmotionResponse, EmotionDetail
from services.emotion_service import analyze_emotion

router = APIRouter()

@router.post("/analyze-emotion", response_model=EmotionResponse)
async def analyze_emotion_endpoint(request: EmotionRequest):
    try:
        result = analyze_emotion(request.text)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 