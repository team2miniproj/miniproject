#!/usr/bin/env python3
"""
감정 분석 API 테스트 스크립트
"""
import requests
import json

# API 기본 URL
BASE_URL = "http://localhost:8000/api/v1/emotion"

def test_basic_emotion():
    """기본 감정 분석 테스트"""
    
    test_cases = [
        {
            "text": "오늘 정말 행복한 하루였어요!",
            "user_id": "test_user_1",
            "expected": "JOY"
        },
        {
            "text": "너무 슬프고 우울해요",
            "user_id": "test_user_2", 
            "expected": "SADNESS"
        },
        {
            "text": "정말 화가 나고 짜증나요",
            "user_id": "test_user_3",
            "expected": "ANGER"
        }
    ]
    
    print("🧪 기본 감정 분석 API 테스트 (OpenAI)")
    print("=" * 50)
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n{i}. 테스트: {test_case['text']}")
        
        payload = {
            "text": test_case["text"],
            "user_id": test_case["user_id"]
        }
        
        try:
            response = requests.post(
                f"{BASE_URL}/analyze",
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"   ✅ 성공: {result['primary_emotion']} ({result['primary_emotion_score']:.3f})")
                print(f"   🤖 모델: {result['model_used']}")
                print(f"   😊 이모지: {result['primary_emotion_emoji']}")
                
                if result['primary_emotion'] == test_case['expected']:
                    print("   ✅ 예상 결과와 일치!")
                else:
                    print("   ⚠️ 예상 결과와 다름")
            else:
                print(f"   ❌ 오류: {response.status_code}")
                print(f"   메시지: {response.text}")
                
        except Exception as e:
            print(f"   ❌ 예외: {e}")

def test_model_comparison():
    """모델 비교 테스트"""
    
    test_text = "오늘 정말 기분이 좋아요!"
    models = ["openai", "generalized"]
    
    print(f"\n🔍 모델 비교 테스트: '{test_text}'")
    print("=" * 50)
    
    for model in models:
        payload = {
            "text": test_text,
            "user_id": "test_user_comparison"
        }
        
        try:
            response = requests.post(
                f"{BASE_URL}/analyze-with-model",
                json=payload,
                params={"model_type": model},
                headers={"Content-Type": "application/json"},
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"   {model:12}: {result['primary_emotion']} ({result['primary_emotion_score']:.3f}) {result['primary_emotion_emoji']}")
            else:
                print(f"   {model:12}: ❌ 오류 {response.status_code}")
                
        except Exception as e:
            print(f"   {model:12}: ❌ 예외 {e}")

if __name__ == "__main__":
    print("🚀 감정 분석 API 테스트 시작!")
    
    # 기본 테스트
    test_basic_emotion()
    
    # 모델 비교 테스트
    test_model_comparison()
    
    print("\n🎉 모든 테스트 완료!") 