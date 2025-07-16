import requests
import json
from datetime import datetime

def test_emotion_statistics():
    """감정 통계 API 테스트"""
    base_url = "http://localhost:8000"
    
    # 1. 감정 통계 조회 테스트
    print("1. 감정 통계 조회 테스트")
    try:
        response = requests.get(f"{base_url}/api/v1/statistics/emotion/test_user?period=week")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("응답 데이터:")
            print(json.dumps(data, indent=2, ensure_ascii=False))
        else:
            print(f"오류 응답: {response.text}")
    except Exception as e:
        print(f"API 요청 실패: {e}")
    
    print("\n" + "="*50 + "\n")
    
    # 2. 감정 인사이트 테스트
    print("2. 감정 인사이트 테스트")
    try:
        response = requests.get(f"{base_url}/api/v1/statistics/insights/test_user?period=month")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("응답 데이터:")
            print(json.dumps(data, indent=2, ensure_ascii=False))
        else:
            print(f"오류 응답: {response.text}")
    except Exception as e:
        print(f"API 요청 실패: {e}")
    
    print("\n" + "="*50 + "\n")
    
    # 3. 감정 대시보드 테스트
    print("3. 감정 대시보드 테스트")
    try:
        response = requests.get(f"{base_url}/api/v1/statistics/dashboard/test_user")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("응답 데이터:")
            print(json.dumps(data, indent=2, ensure_ascii=False))
        else:
            print(f"오류 응답: {response.text}")
    except Exception as e:
        print(f"API 요청 실패: {e}")

if __name__ == "__main__":
    test_emotion_statistics() 