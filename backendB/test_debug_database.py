"""
Mock 데이터베이스 상태 확인 디버깅 스크립트
"""
import asyncio
from datetime import datetime, date, timedelta
from config.database import db_manager

async def debug_database():
    """Mock 데이터베이스 상태 확인"""
    
    # 데이터베이스 연결
    await db_manager.connect_to_database()
    
    # 감정 분석 컬렉션 참조
    collection = db_manager.get_collection("emotion_analysis")
    
    print("=== Mock 데이터베이스 상태 확인 ===")
    print(f"데이터베이스 타입: {type(collection)}")
    print(f"Mock 데이터베이스: {hasattr(collection, 'documents')}")
    
    if hasattr(collection, 'documents'):
        print(f"전체 문서 수: {len(collection.documents)}")
        
        # 전체 문서 출력
        for doc_id, doc_data in collection.documents.items():
            print(f"문서 ID: {doc_id}")
            print(f"데이터: {doc_data}")
            print("-" * 40)
        
        # 쿼리 테스트
        print("\n=== 쿼리 테스트 ===")
        query = collection.where("user_id", "==", "test_user")
        results = query.get()
        
        print(f"쿼리 결과 타입: {type(results)}")
        result_count = 0
        for doc in results:
            result_count += 1
            print(f"쿼리 결과 문서: {doc.id} - {doc.to_dict()}")
        
        print(f"총 쿼리 결과 수: {result_count}")
        
        # 날짜 필터링 테스트
        print("\n=== 날짜 필터링 테스트 ===")
        today = date.today()
        start_date = today - timedelta(days=6)
        end_date = today
        
        start_datetime = datetime.combine(start_date, datetime.min.time())
        end_datetime = datetime.combine(end_date, datetime.max.time())
        
        print(f"필터링 기간: {start_datetime} ~ {end_datetime}")
        
        query2 = collection.where("user_id", "==", "test_user").where("analyzed_at", ">=", start_datetime).where("analyzed_at", "<=", end_datetime)
        results2 = query2.get()
        
        result_count2 = 0
        for doc in results2:
            result_count2 += 1
            print(f"날짜 필터링 결과: {doc.id} - {doc.to_dict()}")
        
        print(f"날짜 필터링 결과 수: {result_count2}")
    
    else:
        print("Mock 컬렉션 정보를 찾을 수 없습니다.")

if __name__ == "__main__":
    asyncio.run(debug_database()) 