"""
공감 피드백 생성 API 라우터
"""
from fastapi import APIRouter, HTTPException, Body
from typing import Dict, Any
import logging

from models.feedback import FeedbackGenerationRequest, FeedbackResponse
from services.feedback_service_mock import feedback_service

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/generate", response_model=FeedbackResponse, summary="공감 피드백 생성")
async def generate_feedback(
    request: FeedbackGenerationRequest = Body(...)
) -> FeedbackResponse:
    """
    KoGPT를 활용하여 공감 피드백을 생성합니다.
    
    Args:
        request: 피드백 생성 요청 (텍스트, 감정, 스타일, 사용자 ID)
        
    Returns:
        FeedbackResponse: 생성된 피드백
    """
    try:
        if not request.text.strip():
            raise HTTPException(status_code=400, detail="텍스트를 입력해주세요.")
        
        # 피드백 생성
        result = await feedback_service.generate_feedback(request)
        
        logger.info(f"피드백 생성 완료: {request.style} 스타일")
        return result
        
    except ValueError as e:
        logger.error(f"피드백 생성 요청 오류: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"피드백 생성 실패: {e}")
        raise HTTPException(status_code=500, detail="피드백 생성 중 오류가 발생했습니다.")

@router.get("/history/{user_id}", summary="사용자 피드백 이력")
async def get_feedback_history(user_id: str, limit: int = 10):
    """
    사용자의 피드백 생성 이력을 조회합니다.
    
    Args:
        user_id: 사용자 ID
        limit: 조회할 개수 (기본값: 10)
        
    Returns:
        Dict: 피드백 이력 및 통계
    """
    try:
        # 피드백 이력 조회
        history = await feedback_service.get_user_feedback_history(user_id, limit)
        
        # 피드백 통계 조회
        statistics = await feedback_service.get_feedback_statistics(user_id)
        
        return {
            "user_id": user_id,
            "history": history,
            "statistics": statistics
        }
        
    except Exception as e:
        logger.error(f"피드백 이력 조회 실패: {e}")
        raise HTTPException(status_code=500, detail="이력 조회 중 오류가 발생했습니다.")

@router.get("/styles", summary="피드백 스타일 목록")
async def get_feedback_styles():
    """
    사용 가능한 피드백 스타일 목록을 반환합니다.
    
    Returns:
        Dict: 피드백 스타일 정보
    """
    return {
        "styles": {
            "empathetic": {
                "name": "공감형",
                "description": "감정에 공감하고 위로하는 스타일"
            },
            "encouraging": {
                "name": "격려형", 
                "description": "긍정적이고 격려하는 스타일"
            },
            "analytical": {
                "name": "분석형",
                "description": "객관적이고 분석적인 스타일"
            }
        }
    } 