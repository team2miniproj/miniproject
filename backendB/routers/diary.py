"""
일기 감정분석 및 피드백 API 라우터 (Firebase 기반)
"""
from fastapi import APIRouter, HTTPException, Query
from typing import Dict, Any, List, Optional
import logging
from datetime import datetime

from models.emotion import EmotionAnalysisRequest, EmotionAnalysisResponse
from models.feedback import FeedbackGenerationRequest, FeedbackResponse
from services.emotion_service_mock import emotion_service
from services.feedback_service_mock import feedback_service
from config.database import db_manager

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/process/{diary_id}", summary="일기 감정분석 및 피드백 처리")
async def process_diary(
    diary_id: str,
    generate_feedback: bool = Query(True, description="피드백 생성 여부"),
    feedback_style: str = Query("empathetic", description="피드백 스타일")
) -> Dict[str, Any]:
    """
    이미 저장된 일기 데이터를 읽어와서 감정분석과 피드백을 처리합니다.
    
    Args:
        diary_id: 일기 문서 ID
        generate_feedback: 피드백 생성 여부
        feedback_style: 피드백 스타일 (empathetic, encouraging, analytical)
        
    Returns:
        Dict: 감정분석 결과 및 피드백
    """
    try:
        # Firebase에서 일기 데이터 조회
        diary_data = await _get_diary_from_firebase(diary_id)
        if not diary_data:
            raise HTTPException(status_code=404, detail="일기를 찾을 수 없습니다.")
        
        diary_content = diary_data.get("content", "")
        user_id = diary_data.get("user_id", "default_user")
        
        if not diary_content.strip():
            raise HTTPException(status_code=400, detail="일기 내용이 비어있습니다.")
        
        # 감정 분석 수행
        emotion_request = EmotionAnalysisRequest(
            text=diary_content,
            user_id=user_id
        )
        emotion_result = await emotion_service.analyze_emotion(emotion_request)
        
        # 결과 준비
        result = {
            "diary_id": diary_id,
            "user_id": user_id,
            "emotion_analysis": {
                "primary_emotion": emotion_result.primary_emotion,
                "primary_emotion_score": emotion_result.primary_emotion_score,
                "primary_emotion_emoji": emotion_result.primary_emotion_emoji,
                "all_emotions": emotion_result.all_emotions,
                "confidence": emotion_result.confidence,
                "model_used": emotion_result.model_used
            },
            "processed_at": datetime.utcnow().isoformat()
        }
        
        # 피드백 생성 (요청시)
        if generate_feedback:
            feedback_request = FeedbackGenerationRequest(
                text=diary_content,
                user_id=user_id,
                style=feedback_style
            )
            feedback_result = await feedback_service.generate_feedback(feedback_request)
            
            result["ai_feedback"] = {
                "feedback_text": feedback_result.feedback_text,
                "style": feedback_result.style,
                "confidence": feedback_result.confidence,
                "model_used": feedback_result.model_used
            }
        
        # Firebase에 감정분석 및 피드백 결과 저장
        await _save_analysis_to_firebase(diary_id, result)
        
        logger.info(f"일기 처리 완료: {diary_id} - {emotion_result.primary_emotion}")
        return result
        
    except ValueError as e:
        logger.error(f"일기 처리 요청 오류: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"일기 처리 실패: {e}")
        raise HTTPException(status_code=500, detail="일기 처리 중 오류가 발생했습니다.")

@router.post("/batch-process", summary="일기 일괄 처리")
async def batch_process_diaries(
    user_id: str = Query(..., description="사용자 ID"),
    limit: int = Query(10, ge=1, le=100, description="처리할 일기 수"),
    unprocessed_only: bool = Query(True, description="미처리 일기만 처리 여부")
) -> Dict[str, Any]:
    """
    사용자의 일기들을 일괄로 감정분석 및 피드백 처리합니다.
    
    Args:
        user_id: 사용자 ID
        limit: 처리할 일기 수
        unprocessed_only: 미처리 일기만 처리할지 여부
        
    Returns:
        Dict: 처리 결과 요약
    """
    try:
        # Firebase에서 일기 목록 조회
        diaries = await _get_user_diaries_from_firebase(user_id, limit, unprocessed_only)
        
        if not diaries:
            return {
                "message": "처리할 일기가 없습니다.",
                "processed_count": 0,
                "failed_count": 0,
                "results": []
            }
        
        processed_count = 0
        failed_count = 0
        results = []
        
        for diary in diaries:
            try:
                diary_id = diary["id"]
                diary_content = diary.get("content", "")
                
                if not diary_content.strip():
                    failed_count += 1
                    continue
                
                # 감정 분석
                emotion_request = EmotionAnalysisRequest(
                    text=diary_content,
                    user_id=user_id
                )
                emotion_result = await emotion_service.analyze_emotion(emotion_request)
                
                # 피드백 생성 (기본 공감형)
                feedback_request = FeedbackGenerationRequest(
                    text=diary_content,
                    user_id=user_id,
                    style="empathetic"
                )
                feedback_result = await feedback_service.generate_feedback(feedback_request)
                
                # 결과 생성
                result = {
                    "diary_id": diary_id,
                    "emotion_analysis": {
                        "primary_emotion": emotion_result.primary_emotion,
                        "primary_emotion_score": emotion_result.primary_emotion_score,
                        "primary_emotion_emoji": emotion_result.primary_emotion_emoji
                    },
                    "ai_feedback": {
                        "feedback_text": feedback_result.feedback_text,
                        "style": feedback_result.style
                    },
                    "processed_at": datetime.utcnow().isoformat()
                }
                
                # Firebase에 저장
                await _save_analysis_to_firebase(diary_id, result)
                
                results.append(result)
                processed_count += 1
                
            except Exception as e:
                logger.error(f"일기 처리 실패 ({diary.get('id', 'unknown')}): {e}")
                failed_count += 1
                continue
        
        return {
            "message": f"일괄 처리 완료: {processed_count}개 성공, {failed_count}개 실패",
            "processed_count": processed_count,
            "failed_count": failed_count,
            "results": results
        }
        
    except Exception as e:
        logger.error(f"일괄 처리 실패: {e}")
        raise HTTPException(status_code=500, detail="일괄 처리 중 오류가 발생했습니다.")

@router.get("/analysis/{diary_id}", summary="일기 분석 결과 조회")
async def get_diary_analysis(diary_id: str) -> Dict[str, Any]:
    """
    특정 일기의 감정분석 및 피드백 결과를 조회합니다.
    
    Args:
        diary_id: 일기 ID
        
    Returns:
        Dict: 분석 결과
    """
    try:
        analysis_data = await _get_analysis_from_firebase(diary_id)
        if not analysis_data:
            raise HTTPException(status_code=404, detail="분석 결과를 찾을 수 없습니다.")
        
        return analysis_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"분석 결과 조회 실패: {e}")
        raise HTTPException(status_code=500, detail="분석 결과 조회 중 오류가 발생했습니다.")

@router.get("/user-analyses/{user_id}", summary="사용자 분석 결과 목록")
async def get_user_analyses(
    user_id: str,
    limit: int = Query(20, ge=1, le=100),
    emotion_filter: Optional[str] = Query(None, description="감정 필터")
) -> Dict[str, Any]:
    """
    사용자의 모든 일기 분석 결과를 조회합니다.
    
    Args:
        user_id: 사용자 ID
        limit: 조회할 개수
        emotion_filter: 특정 감정으로 필터링
        
    Returns:
        Dict: 분석 결과 목록
    """
    try:
        analyses = await _get_user_analyses_from_firebase(user_id, limit, emotion_filter)
        
        return {
            "user_id": user_id,
            "total_count": len(analyses),
            "analyses": analyses
        }
        
    except Exception as e:
        logger.error(f"사용자 분석 결과 조회 실패: {e}")
        raise HTTPException(status_code=500, detail="분석 결과 조회 중 오류가 발생했습니다.")

# Firebase 헬퍼 함수들
async def _get_diary_from_firebase(diary_id: str) -> Optional[Dict[str, Any]]:
    """Firebase에서 일기 데이터 조회"""
    try:
        collection = db_manager.get_collection("diaries")
        doc = collection.document(diary_id).get()
        
        if doc.exists():
            return doc.to_dict()
        return None
        
    except Exception as e:
        logger.error(f"일기 조회 실패: {e}")
        return None

async def _get_user_diaries_from_firebase(user_id: str, limit: int, unprocessed_only: bool = True) -> List[Dict[str, Any]]:
    """Firebase에서 사용자 일기 목록 조회"""
    try:
        collection = db_manager.get_collection("diaries")
        query = collection.where("user_id", "==", user_id)
        
        if unprocessed_only:
            query = query.where("is_processed", "==", False)
        
        docs = query.limit(limit).get()
        diaries = []
        
        for doc in docs:
            data = doc.to_dict()
            data["id"] = doc.id
            diaries.append(data)
        
        return diaries
        
    except Exception as e:
        logger.error(f"사용자 일기 목록 조회 실패: {e}")
        return []

async def _save_analysis_to_firebase(diary_id: str, analysis_data: Dict[str, Any]):
    """Firebase에 분석 결과 저장"""
    try:
        # 분석 결과 컬렉션에 저장
        analysis_collection = db_manager.get_collection("diary_analyses")
        analysis_collection.document(diary_id).set(analysis_data)
        
        # 원본 일기에 처리 완료 플래그 설정
        diary_collection = db_manager.get_collection("diaries")
        diary_collection.document(diary_id).update({
            "is_processed": True,
            "processed_at": datetime.utcnow(),
            "primary_emotion": analysis_data["emotion_analysis"]["primary_emotion"]
        })
        
    except Exception as e:
        logger.error(f"분석 결과 저장 실패: {e}")
        raise

async def _get_analysis_from_firebase(diary_id: str) -> Optional[Dict[str, Any]]:
    """Firebase에서 분석 결과 조회"""
    try:
        collection = db_manager.get_collection("diary_analyses")
        doc = collection.document(diary_id).get()
        
        if doc.exists():
            return doc.to_dict()
        return None
        
    except Exception as e:
        logger.error(f"분석 결과 조회 실패: {e}")
        return None

async def _get_user_analyses_from_firebase(user_id: str, limit: int, emotion_filter: Optional[str] = None) -> List[Dict[str, Any]]:
    """Firebase에서 사용자 분석 결과 목록 조회"""
    try:
        collection = db_manager.get_collection("diary_analyses")
        query = collection.where("user_id", "==", user_id)
        
        if emotion_filter:
            query = query.where("emotion_analysis.primary_emotion", "==", emotion_filter)
        
        docs = query.order_by("processed_at", direction="desc").limit(limit).get()
        analyses = []
        
        for doc in docs:
            data = doc.to_dict()
            data["id"] = doc.id
            analyses.append(data)
        
        return analyses
        
    except Exception as e:
        logger.error(f"사용자 분석 결과 목록 조회 실패: {e}")
        return [] 