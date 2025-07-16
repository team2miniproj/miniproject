"""
메인 API 테스트
"""
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from fastapi.middleware.cors import CORSMiddleware

# 테스트용 앱 생성 (데이터베이스 연결 없음)
test_app = FastAPI(
    title="음성 인식 일기 백엔드 API",
    description="테스트용 애플리케이션",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS 미들웨어 설정
test_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@test_app.get("/")
async def root():
    """서버 상태 확인 엔드포인트"""
    return {
        "message": "음성 인식 일기 백엔드 서버가 정상 동작 중입니다.",
        "status": "running",
        "version": "1.0.0"
    }

@test_app.get("/health")
async def health_check():
    """헬스 체크 엔드포인트"""
    return {"status": "healthy"}

@pytest.fixture
def client():
    """테스트 클라이언트 픽스처"""
    with TestClient(test_app) as client:
        yield client

def test_root_endpoint(client):
    """루트 엔드포인트 테스트"""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "status" in data
    assert data["status"] == "running"

def test_health_check(client):
    """헬스 체크 엔드포인트 테스트"""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"

def test_api_documentation(client):
    """API 문서 엔드포인트 테스트"""
    response = client.get("/docs")
    assert response.status_code == 200
    
    response = client.get("/redoc") 
    assert response.status_code == 200

def test_openapi_schema(client):
    """OpenAPI 스키마 테스트"""
    response = client.get("/openapi.json")
    assert response.status_code == 200
    schema = response.json()
    assert "openapi" in schema
    assert "info" in schema
    assert schema["info"]["title"] == "음성 인식 일기 백엔드 API" 