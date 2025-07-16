"""
API를 통한 감정 분석 데이터 추가 테스트
"""
import requests
import json
from datetime import datetime, date, timedelta

def add_emotion_data_via_api():
    """API를 통해 감정 분석 데이터 추가"""
    base_url = "http://localhost:8000"
    
    # 테스트 텍스트 목록
    test_texts = [
        "오늘은 정말 기쁜 하루였어요!",
        "슬픈 일이 있었습니다.",
        "화가 나는 상황이었어요.",
        "무서운 영화를 봤어요.",
        "놀라운 소식을 들었어요.",
        "역겨운 음식을 먹었어요.",
        "그냥 평범한 하루였어요.",
        "행복한 순간이었습니다.",
        "우울한 기분이에요.",
        "짜증이 나는 상황이었어요.",
        "걱정되는 일이 있어요.",
        "신기한 경험이었어요.",
        "더러운 것을 봤어요.",
        "평범한 일상이었어요.",
        "즐거운 시간을 보냈어요.",
        "힘든 하루였습니다.",
        "열받는 상황이었어요.",
        "불안한 마음이에요.",
        "대박 소식이었어요.",
        "혐오스러운 상황이었어요.",
        "그냥 그런 하루였어요."
    ]
    
    print("API를 통한 감정 분석 데이터 추가 시작...")
    
    for i, text in enumerate(test_texts):
        try:
            # 감정 분석 요청
            payload = {
                "text": text,
                "user_id": "test_user"
            }
            
            response = requests.post(
                f"{base_url}/api/v1/emotion/analyze",
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ {i+1}. 성공: '{text}' -> {result['primary_emotion']}")
            else:
                print(f"❌ {i+1}. 실패: {response.status_code} - {response.text}")
                
        except Exception as e:
            print(f"❌ {i+1}. 오류: {e}")
    
    print("\n감정 분석 데이터 추가 완료!")
    print("이제 통계 API를 테스트해보세요.")

if __name__ == "__main__":
    add_emotion_data_via_api() 