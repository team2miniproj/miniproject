"""
한국어 음성 인식 기반 일기 프로젝트 - 백엔드 서버
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import emotion

app = FastAPI(title="Emotion Analysis API")

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(emotion.router, prefix="/api", tags=["emotion"]) 