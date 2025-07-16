"""
감정 분석 API 테스트
"""
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pydantic import BaseModel
from typing import List

# 테스트용 모델
class EmotionAnalysisRequest(BaseModel):
    text: str
    user_id: str = "test_user"

class EmotionScore(BaseModel):
    emotion: str
    score: float

class EmotionAnalysisResponse(BaseModel):
    text: str
    primary_emotion: str
    confidence: float
    scores: List[EmotionScore]
    emoji: str

# 테스트용 앱 생성
test_app = FastAPI(title="감정 분석 테스트 API")

@test_app.post("/emotion/analyze", response_model=EmotionAnalysisResponse)
async def analyze_emotion(request: EmotionAnalysisRequest):
    """테스트용 감정 분석 API"""
    # 간단한 키워드 기반 감정 분석
    text = request.text.lower()
    
    # 감정별 키워드 매핑
    emotion_keywords = {
        "joy": ["기쁘", "행복", "좋", "즐거", "웃", "사랑"],
        "sadness": ["슬프", "우울", "눈물", "힘들", "아프", "외로"],
        "anger": ["화", "짜증", "분노", "화나", "싫", "미워"],
        "fear": ["무서", "두려", "걱정", "불안", "떨"],
        "surprise": ["놀라", "깜짝", "신기", "갑자기"],
        "disgust": ["역겨", "더러", "싫어", "혐오"],
        "neutral": ["그냥", "보통", "평범", "일반"]
    }
    
    # 감정별 이모지
    emotion_emojis = {
        "joy": "😊",
        "sadness": "😢", 
        "anger": "😠",
        "fear": "😨",
        "surprise": "😲",
        "disgust": "🤢",
        "neutral": "😐"
    }
    
    # 키워드 기반으로 감정 점수 계산
    scores = {}
    for emotion, keywords in emotion_keywords.items():
        score = sum(1 for keyword in keywords if keyword in text)
        scores[emotion] = score / len(keywords)  # 정규화
    
    # 가장 높은 점수의 감정 선택
    primary_emotion = max(scores, key=scores.get)
    confidence = scores[primary_emotion]
    
    # 점수가 모두 0이면 중성으로 설정
    if confidence == 0:
        primary_emotion = "neutral"
        confidence = 0.5
    
    # 감정별 한국어 이름
    emotion_names = {
        "joy": "기쁨",
        "sadness": "슬픔", 
        "anger": "분노",
        "fear": "두려움",
        "surprise": "놀라움",
        "disgust": "혐오",
        "neutral": "중성"
    }
    
    # 응답 생성
    emotion_scores = [
        EmotionScore(emotion=emotion_names[emotion], score=score)
        for emotion, score in scores.items()
    ]
    
    return EmotionAnalysisResponse(
        text=request.text,
        primary_emotion=emotion_names[primary_emotion],
        confidence=confidence,
        scores=emotion_scores,
        emoji=emotion_emojis[primary_emotion]
    )

@pytest.fixture
def client():
    """테스트 클라이언트"""
    with TestClient(test_app) as client:
        yield client

def test_happy_emotion(client):
    """기쁜 감정 텍스트 테스트"""
    response = client.post("/emotion/analyze", json={
        "text": "오늘 정말 기쁘고 행복한 하루였어요!",
        "user_id": "test_user"
    })
    
    assert response.status_code == 200
    data = response.json()
    
    print(f"\n입력 텍스트: {data['text']}")
    print(f"감정 분석 결과: {data['primary_emotion']} {data['emoji']}")
    print(f"신뢰도: {data['confidence']:.2f}")
    
    assert data["primary_emotion"] == "기쁨"
    assert data["emoji"] == "😊"

def test_sad_emotion(client):
    """슬픈 감정 텍스트 테스트"""
    response = client.post("/emotion/analyze", json={
        "text": "오늘은 너무 슬프고 우울한 하루였어요. 눈물이 날 것 같아요.",
        "user_id": "test_user"
    })
    
    assert response.status_code == 200
    data = response.json()
    
    print(f"\n입력 텍스트: {data['text']}")
    print(f"감정 분석 결과: {data['primary_emotion']} {data['emoji']}")
    print(f"신뢰도: {data['confidence']:.2f}")
    
    assert data["primary_emotion"] == "슬픔"
    assert data["emoji"] == "😢"

def test_angry_emotion(client):
    """화난 감정 텍스트 테스트"""
    response = client.post("/emotion/analyze", json={
        "text": "정말 화가 나고 짜증이 나요! 너무 화나서 견딜 수가 없어요.",
        "user_id": "test_user"
    })
    
    assert response.status_code == 200
    data = response.json()
    
    print(f"\n입력 텍스트: {data['text']}")
    print(f"감정 분석 결과: {data['primary_emotion']} {data['emoji']}")
    print(f"신뢰도: {data['confidence']:.2f}")
    
    assert data["primary_emotion"] == "분노"
    assert data["emoji"] == "😠"

def test_custom_text(client):
    """사용자 입력 텍스트 테스트"""
    # 여기에 원하는 텍스트를 입력해보세요!
    custom_text = "오늘 새로운 프로젝트를 시작했는데 정말 즐거워요!"
    
    response = client.post("/emotion/analyze", json={
        "text": custom_text,
        "user_id": "test_user"
    })
    
    assert response.status_code == 200
    data = response.json()
    
    print(f"\n=== 사용자 입력 테스트 ===")
    print(f"입력 텍스트: {data['text']}")
    print(f"감정 분석 결과: {data['primary_emotion']} {data['emoji']}")
    print(f"신뢰도: {data['confidence']:.2f}")
    print("감정별 점수:")
    for score in data['scores']:
        print(f"  {score['emotion']}: {score['score']:.2f}") 