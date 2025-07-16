"""
감정 분석 API 라우터
"""
from fastapi import APIRouter, HTTPException, Body, Request
from fastapi.responses import JSONResponse
from typing import Dict, Any
import logging
import json

from models.emotion import EmotionAnalysisRequest, EmotionAnalysisResponse
from services.emotion_service_mock import emotion_service

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/analyze", response_model=EmotionAnalysisResponse, summary="텍스트 감정 분석")
async def analyze_emotion(
    request: EmotionAnalysisRequest = Body(...)
) -> EmotionAnalysisResponse:
    """
    텍스트의 감정을 분석합니다.
    
    Args:
        request: 감정 분석 요청 (텍스트, 사용자 ID)
        
    Returns:
        EmotionAnalysisResponse: 감정 분류 결과 및 이모지
    """
    try:
        # 감정 분석 수행 (내부에서 텍스트 정제 수행)
        result = await emotion_service.analyze_emotion(request)
        
        logger.info(f"감정 분석 완료: {result.primary_emotion}")
        return result
        
    except ValueError as e:
        logger.error(f"감정 분석 요청 오류: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"감정 분석 실패: {e}")
        raise HTTPException(status_code=500, detail="감정 분석 중 오류가 발생했습니다.")

@router.post("/analyze-with-model", response_model=EmotionAnalysisResponse, summary="모델 선택 감정 분석")
async def analyze_emotion_with_model(
    request: EmotionAnalysisRequest = Body(...),
    model_type: str = "openai"
) -> EmotionAnalysisResponse:
    """
    특정 모델을 선택하여 텍스트의 감정을 분석합니다.
    
    Args:
        request: 감정 분석 요청 (텍스트, 사용자 ID)
        model_type: 사용할 모델 ("openai", "generalized")
        
    Returns:
        EmotionAnalysisResponse: 감정 분류 결과 및 이모지
    """
    try:
        # 지원되는 모델 타입 검증
        supported_models = ["openai", "generalized"]
        if model_type.lower() not in supported_models:
            logger.warning(f"지원하지 않는 모델 타입 '{model_type}', OpenAI 모델을 사용합니다.")
            model_type = "openai"
        
        # 감정 분석 수행 (내부에서 텍스트 정제 수행)
        result = await emotion_service.analyze_emotion(request, model_type)
        
        logger.info(f"감정 분석 완료: {result.primary_emotion} (모델: {model_type})")
        return result
        
    except ValueError as e:
        logger.error(f"감정 분석 요청 오류: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"감정 분석 실패: {e}")
        raise HTTPException(status_code=500, detail="감정 분석 중 오류가 발생했습니다.")

@router.get("/history/{user_id}", summary="사용자 감정 분석 이력")
async def get_emotion_history(user_id: str, limit: int = 10):
    """
    사용자의 감정 분석 이력을 조회합니다.
    
    Args:
        user_id: 사용자 ID
        limit: 조회할 개수 (기본값: 10)
        
    Returns:
        List: 감정 분석 결과 목록
    """
    try:
        results = await emotion_service.get_user_emotion_history(user_id, limit)
        return {
            "user_id": user_id,
            "total_count": len(results),
            "history": results
        }
    except Exception as e:
        logger.error(f"감정 분석 이력 조회 실패: {e}")
        raise HTTPException(status_code=500, detail="이력 조회 중 오류가 발생했습니다.") 