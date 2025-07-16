"""
감정 통계 분석 API 라우터
"""
from fastapi import APIRouter, HTTPException, Query
from typing import Dict, Any, Optional
from datetime import datetime, date
import logging

from models.statistics import StatisticsRequest, StatisticsResponse
from services.statistics_service import statistics_service
from services.emotion_mapping import emotion_mapper

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/emotion/{user_id}", response_model=StatisticsResponse, summary="감정 통계 조회")
async def get_emotion_statistics(
    user_id: str,
    period: str = Query("week", pattern="^(day|week|month|year)$"),
    start_date: Optional[str] = Query(None, pattern=r"^\d{4}-\d{2}-\d{2}$"),
    end_date: Optional[str] = Query(None, pattern=r"^\d{4}-\d{2}-\d{2}$")
) -> StatisticsResponse:
    """
    사용자의 감정 통계를 조회합니다.
    
    Args:
        user_id: 사용자 ID
        period: 조회 기간 (day, week, month, year)
        start_date: 시작 날짜 (YYYY-MM-DD)
        end_date: 종료 날짜 (YYYY-MM-DD)
        
    Returns:
        StatisticsResponse: 감정 통계 데이터
    """
    try:
        # 날짜 파싱
        parsed_start_date = None
        parsed_end_date = None
        
        if start_date:
            parsed_start_date = datetime.strptime(start_date, "%Y-%m-%d").date()
        if end_date:
            parsed_end_date = datetime.strptime(end_date, "%Y-%m-%d").date()
        
        # 통계 요청 생성
        request = StatisticsRequest(
            user_id=user_id,
            period=period,
            start_date=parsed_start_date,
            end_date=parsed_end_date
        )
        
        # 통계 조회
        result = await statistics_service.get_emotion_statistics(request)
        
        logger.info(f"감정 통계 조회 완료: {user_id} ({period})")
        return result
        
    except ValueError as e:
        logger.error(f"감정 통계 요청 오류: {e}")
        raise HTTPException(status_code=400, detail=f"날짜 형식이 올바르지 않습니다: {e}")
    except Exception as e:
        logger.error(f"감정 통계 조회 실패: {e}")
        raise HTTPException(status_code=500, detail="감정 통계 조회 중 오류가 발생했습니다.")

@router.get("/insights/{user_id}", summary="감정 인사이트")
async def get_emotion_insights(
    user_id: str,
    period: str = Query("month", pattern="^(day|week|month|year)$")
) -> Dict[str, Any]:
    """
    사용자의 감정 인사이트를 제공합니다.
    
    Args:
        user_id: 사용자 ID
        period: 분석 기간
        
    Returns:
        Dict: 감정 인사이트 및 추천사항
    """
    try:
        insights = await statistics_service.get_emotion_insights(user_id, period)
        
        logger.info(f"감정 인사이트 생성 완료: {user_id}")
        return insights
        
    except Exception as e:
        logger.error(f"감정 인사이트 생성 실패: {e}")
        raise HTTPException(status_code=500, detail="감정 인사이트 생성 중 오류가 발생했습니다.")

@router.get("/emotion-mapping", summary="감정 매핑 정보")
async def get_emotion_mapping():
    """
    모든 감정 매핑 정보를 반환합니다.
    
    Returns:
        Dict: 감정별 이모지, 색상, 설명 정보
    """
    try:
        mapping = emotion_mapper.get_all_mappings()
        return {
            "emotion_mappings": mapping,
            "total_emotions": len(mapping)
        }
    except Exception as e:
        logger.error(f"감정 매핑 조회 실패: {e}")
        raise HTTPException(status_code=500, detail="감정 매핑 조회 중 오류가 발생했습니다.")

@router.get("/dashboard/{user_id}", summary="감정 대시보드")
async def get_emotion_dashboard(user_id: str):
    """
    사용자의 감정 대시보드 데이터를 제공합니다.
    
    Args:
        user_id: 사용자 ID
        
    Returns:
        Dict: 대시보드 데이터
    """
    try:
        # 주간 통계
        weekly_request = StatisticsRequest(user_id=user_id, period="week")
        weekly_stats = await statistics_service.get_emotion_statistics(weekly_request)
        
        # 월간 통계
        monthly_request = StatisticsRequest(user_id=user_id, period="month")
        monthly_stats = await statistics_service.get_emotion_statistics(monthly_request)
        
        # 인사이트
        insights = await statistics_service.get_emotion_insights(user_id, "month")
        
        dashboard = {
            "user_id": user_id,
            "weekly_summary": {
                "dominant_emotion": weekly_stats.dominant_emotion,
                "total_entries": weekly_stats.total_entries,
                "emotion_distribution": weekly_stats.emotion_distribution[:3]  # 상위 3개
            },
            "monthly_summary": {
                "dominant_emotion": monthly_stats.dominant_emotion,
                "total_entries": monthly_stats.total_entries,
                "emotion_trend": monthly_stats.emotion_trend
            },
            "insights": insights,
            "generated_at": datetime.utcnow().isoformat()
        }
        
        return dashboard
        
    except Exception as e:
        logger.error(f"감정 대시보드 생성 실패: {e}")
        raise HTTPException(status_code=500, detail="감정 대시보드 생성 중 오류가 발생했습니다.") 