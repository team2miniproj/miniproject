#!/usr/bin/env python3
"""
실제 AI 모델을 사용한 감정 분석 테스트
사용자가 텍스트를 입력하면 KoBERT/KoELECTRA로 감정 분석 수행
"""

import asyncio
import sys
from services.emotion_classifier import kobert_classifier, koelectra_classifier
from models.emotion import EmotionAnalysisRequest

async def analyze_text_with_ai(text: str, model_type: str = "kobert"):
    """
    실제 AI 모델로 텍스트 감정 분석
    
    Args:
        text: 분석할 텍스트
        model_type: 사용할 모델 ("kobert" or "koelectra")
    """
    try:
        print(f"\n🤖 {model_type.upper()} 모델로 감정 분석 중...")
        print(f"📝 입력 텍스트: {text}")
        print("-" * 50)
        
        # 모델 선택
        if model_type.lower() == "kobert":
            classifier = kobert_classifier
        elif model_type.lower() == "koelectra":
            classifier = koelectra_classifier
        else:
            print("❌ 지원하지 않는 모델입니다. (kobert, koelectra만 지원)")
            return
        
        # 감정 분석 수행
        result = await classifier.predict(text)
        
        # 결과 출력
        print(f"🎯 주요 감정: {result.primary_emotion.value} {result.primary_emotion_emoji}")
        print(f"📊 신뢰도: {result.primary_emotion_score:.3f}")
        print(f"🤖 사용 모델: {result.model_used}")
        print(f"✨ 전체 신뢰도: {result.confidence:.3f}")
        
        print("\n📈 모든 감정 점수:")
        for emotion_score in result.all_emotions:
            bar_length = int(emotion_score.score * 20)  # 0-1을 0-20으로 변환
            bar = "█" * bar_length + "░" * (20 - bar_length)
            print(f"  {emotion_score.emotion.value:8} {emotion_score.emoji} │{bar}│ {emotion_score.score:.3f}")
        
        return result
        
    except Exception as e:
        print(f"❌ 감정 분석 중 오류 발생: {e}")
        return None

async def interactive_mode():
    """대화형 모드 - 계속해서 텍스트 입력받기"""
    print("🎯 AI 감정 분석기")
    print("=" * 50)
    print("💡 사용 방법:")
    print("  - 텍스트 입력 후 Enter: KoBERT로 감정 분석")
    print("  - 'koelectra: 텍스트' 입력: KoELECTRA로 감정 분석")  
    print("  - 'quit' 또는 'exit' 입력: 종료")
    print("=" * 50)
    
    while True:
        try:
            # 사용자 입력 받기
            user_input = input("\n💬 텍스트를 입력하세요: ").strip()
            
            if not user_input:
                continue
                
            # 종료 명령어 확인
            if user_input.lower() in ['quit', 'exit', '종료', 'q']:
                print("👋 감정 분석기를 종료합니다.")
                break
            
            # 모델 타입 및 텍스트 파싱
            if user_input.lower().startswith('koelectra:'):
                model_type = "koelectra"
                text = user_input[10:].strip()
            else:
                model_type = "kobert"
                text = user_input
            
            if not text:
                print("❌ 분석할 텍스트를 입력해주세요.")
                continue
            
            # 감정 분석 수행
            await analyze_text_with_ai(text, model_type)
            
        except KeyboardInterrupt:
            print("\n\n👋 사용자가 종료를 요청했습니다.")
            break
        except Exception as e:
            print(f"❌ 오류 발생: {e}")

async def test_examples():
    """예시 텍스트들로 테스트"""
    examples = [
        "오늘 정말 기쁘고 행복한 하루였어요! 새로운 프로젝트도 성공적으로 시작했습니다.",
        "너무 슬프고 우울해요. 모든 게 잘못되어 가는 것 같아요.",
        "정말 화가 나고 짜증이 나요! 이런 상황은 참을 수 없어요.",
        "내일 발표가 있어서 너무 불안하고 떨려요. 잘 할 수 있을까요?",
        "갑자기 친구가 찾아와서 깜짝 놀랐어요! 정말 예상치 못했네요.",
    ]
    
    print("🧪 예시 텍스트들로 AI 감정 분석 테스트")
    print("=" * 60)
    
    for i, text in enumerate(examples, 1):
        print(f"\n📝 예시 {i}:")
        await analyze_text_with_ai(text, "kobert")
        
        if i < len(examples):
            input("\n⏸️  다음 예시를 보려면 Enter를 누르세요...")

async def main():
    """메인 함수"""
    if len(sys.argv) > 1:
        # 명령행 인수로 텍스트가 주어진 경우
        text = " ".join(sys.argv[1:])
        model_type = "kobert"
        
        if text.lower().startswith('koelectra:'):
            model_type = "koelectra"
            text = text[10:].strip()
        
        await analyze_text_with_ai(text, model_type)
    else:
        # 메뉴 선택
        print("🎯 AI 감정 분석기")
        print("=" * 30)
        print("1. 대화형 모드 (직접 텍스트 입력)")
        print("2. 예시 텍스트 테스트")
        print("3. 종료")
        
        choice = input("\n선택하세요 (1-3): ").strip()
        
        if choice == "1":
            await interactive_mode()
        elif choice == "2":
            await test_examples()
        elif choice == "3":
            print("👋 프로그램을 종료합니다.")
        else:
            print("❌ 잘못된 선택입니다.")

if __name__ == "__main__":
    # 이벤트 루프 실행
    asyncio.run(main()) 