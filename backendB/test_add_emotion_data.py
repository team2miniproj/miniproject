"""
테스트용 감정 데이터 추가 스크립트
"""
import asyncio
from datetime import datetime, date, timedelta
from config.database import db_manager
from models.emotion import EmotionLabel

async def add_test_emotion_data():
    """테스트용 감정 데이터 추가"""
    
    # 데이터베이스 연결
    await db_manager.connect_to_database()
    
    # 감정 분석 컬렉션 참조
    collection = db_manager.get_collection("emotion_analysis")
    
    # 테스트 데이터 생성
    test_data = []
    
    # 최근 7일간의 테스트 데이터 생성
    for i in range(7):
        test_date = date.today() - timedelta(days=i)
        
        # 각 날짜에 대해 몇 개의 감정 데이터 추가
        emotions = [
            EmotionLabel.JOY,
            EmotionLabel.SADNESS,
            EmotionLabel.ANGER,
            EmotionLabel.FEAR,
            EmotionLabel.SURPRISE,
            EmotionLabel.DISGUST,
            EmotionLabel.NEUTRAL
        ]
        
        for j, emotion in enumerate(emotions[:3]):  # 각 날짜에 3개씩
            data = {
                "user_id": "test_user",
                "text": f"테스트 텍스트 {i}-{j}",
                "primary_emotion": emotion.value,
                "confidence": 0.8,
                "analyzed_at": datetime.combine(test_date, datetime.min.time()),
                "created_at": datetime.utcnow()
            }
            
            # 데이터 추가
            _, doc_ref = collection.add(data)
            print(f"추가된 데이터: {doc_ref.id} - {emotion.value} ({test_date})")
    
    print("테스트 데이터 추가 완료!")

if __name__ == "__main__":
    asyncio.run(add_test_emotion_data()) 