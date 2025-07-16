"""
한국어 음성 인식 기반 일기 프로젝트 - 백엔드 서버
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException as StarletteHTTPException
import uvicorn
import logging

# 라우터 임포트
from routers import emotion, diary, feedback, statistics
from config.database import db_manager
from config.settings import settings
from config.exceptions import (
    validation_exception_handler,
    http_exception_handler,
    voice_diary_exception_handler,
    general_exception_handler,
    VoiceDiaryException
)
# AI 모델 임포트 (Mock 버전)
# from services.feedback_generator import feedback_generator

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="음성 인식 일기 백엔드 API",
    description="""
    ## 음성 인식 기반 일기 서비스 🎤📖
    
    한국어 음성 인식으로 작성한 텍스트를 기반으로 감정 분석과 AI 피드백을 제공하는 일기 서비스입니다.
    
    ### 주요 기능
    - 🤖 **KoBERT/KoELECTRA 감정 분석**: 7가지 감정 분류 (기쁨, 슬픔, 분노, 두려움, 놀람, 혐오, 중성)
    - 💬 **KoGPT 공감 피드백**: 공감형, 격려형, 분석형 3가지 스타일
    - 📊 **감정 통계 분석**: 일/주/월/년 단위 감정 추이 및 인사이트
    - 📝 **일기 관리**: CRUD 기능 및 자동 감정 분석/피드백 연동
    
    ### API 엔드포인트
    - `/api/v1/emotion/`: 감정 분석 관련 API
    - `/api/v1/feedback/`: 피드백 생성 관련 API  
    - `/api/v1/diary/`: 일기 관리 관련 API
    - `/api/v1/statistics/`: 감정 통계 관련 API
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_tags=[
        {
            "name": "감정분석",
            "description": "KoBERT/KoELECTRA 모델을 활용한 텍스트 감정 분석"
        },
        {
            "name": "피드백생성", 
            "description": "KoGPT 모델을 활용한 공감 피드백 생성"
        },
        {
            "name": "일기처리",
            "description": "Firebase 저장된 일기 데이터 감정 분석/피드백 처리"
        },
        {
            "name": "통계분석",
            "description": "감정 통계 분석 및 인사이트 제공"
        }
    ]
)

# CORS 미들웨어 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=settings.cors_allow_credentials,
    allow_methods=settings.cors_allow_methods,
    allow_headers=settings.cors_allow_headers,
)

@app.get("/")
async def root():
    """서버 상태 확인 엔드포인트"""
    return {
        "message": "음성 인식 일기 백엔드 서버가 정상 동작 중입니다.",
        "status": "running",
        "version": "1.0.0",
        "test_page": "http://localhost:8000/static/index.html",
        "api_docs": "http://localhost:8000/docs"
    }

@app.get("/health")
async def health_check():
    """헬스 체크 엔드포인트"""
    return {"status": "healthy"}

# 예외 처리기 등록
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(VoiceDiaryException, voice_diary_exception_handler)
app.add_exception_handler(Exception, general_exception_handler)

# 데이터베이스 연결 이벤트
@app.on_event("startup")
async def startup_event():
    """애플리케이션 시작 시 실행"""
    try:
        await db_manager.connect_to_database()
        logger.info("데이터베이스 연결 완료")
    except Exception as e:
        logger.warning(f"데이터베이스 연결 실패 (테스트 모드로 실행): {e}")
    
    # OpenAI API 피드백 생성기 초기화 (Mock 버전에서는 주석 처리)
    # try:
    #     await feedback_generator.load_model()
    #     logger.info("OpenAI API 피드백 생성기 초기화 완료")
    # except Exception as e:
    #     logger.error(f"OpenAI API 피드백 생성기 초기화 실패: {e}")
    #     # 피드백 생성기 없이도 서버 시작 가능 (fallback 사용)
    #     logger.info("fallback 피드백 생성기를 사용하여 서버 시작")
    logger.info("Mock 서비스로 서버 시작")
    
    logger.info("음성 인식 일기 백엔드 서버 시작 완료")

@app.on_event("shutdown")
async def shutdown_event():
    """애플리케이션 종료 시 실행"""
    try:
        await db_manager.close_database_connection()
        logger.info("음성 인식 일기 백엔드 서버 종료 완료")
    except Exception as e:
        logger.error(f"서버 종료 중 오류: {e}")

# Static 파일 서빙 (테스트 페이지용)
app.mount("/static", StaticFiles(directory="static"), name="static")

# 라우터 등록
app.include_router(emotion.router, prefix="/api/v1/emotion", tags=["감정분석"])
app.include_router(feedback.router, prefix="/api/v1/feedback", tags=["피드백생성"])
app.include_router(diary.router, prefix="/api/v1/diary", tags=["일기처리"])
app.include_router(statistics.router, prefix="/api/v1/statistics", tags=["통계분석"])

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8001,
        reload=True
    ) 