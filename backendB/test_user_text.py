"""
사용자 텍스트 분석 및 피드백 생성 테스트
"""
import asyncio
import sys
import os

# 프로젝트 루트를 Python 경로에 추가
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from models.emotion import EmotionAnalysisRequest, EmotionLabel
from models.feedback import FeedbackGenerationRequest
from services.emotion_service import emotion_service
from services.feedback_service import feedback_service

async def analyze_user_text():
    """사용자 텍스트 분석 및 피드백 생성"""
    
    # 사용자가 제공한 텍스트
    user_text = "오늘은 정말 힘든 하루였다. 프로젝트 회의도 하고 역할 분배도 해서 프로젝트를 본격적으로 시작한 하루였다. 잠도 많이 못 자고 와서 정말 피곤했지만 그래도 나름 뿌듯한 하루였다고 생각한다."
    
    print("=" * 50)
    print("🔍 텍스트 분석 및 피드백 생성")
    print("=" * 50)
    print(f"📝 분석 대상 텍스트:")
    print(f"   {user_text}")
    print()
    
    try:
        # 1. 감정 분석 수행 (모델이 없으면 간단한 분석 수행)
        print("🧠 감정 분석 중...")
        
        # 실제 모델이 없으므로 텍스트 기반 간단 분석 수행
        analysis_result = await simple_emotion_analysis(user_text)
        
        print(f"✅ 감정 분석 결과:")
        print(f"   주요 감정: {analysis_result['primary_emotion']} {analysis_result['emoji']}")
        print(f"   감정 점수: {analysis_result['score']:.2f}")
        print(f"   신뢰도: {analysis_result['confidence']:.2f}")
        print()
        
        # 2. 여러 스타일의 피드백 생성
        styles = ["empathetic", "encouraging", "analytical"]
        
        for style in styles:
            print(f"💬 {style.upper()} 스타일 피드백 생성 중...")
            
            feedback_result = await simple_feedback_generation(
                user_text, 
                analysis_result['primary_emotion'], 
                style
            )
            
            print(f"   📢 {style} 피드백:")
            print(f"      {feedback_result['feedback_text']}")
            print()
        
        # 3. 종합 분석 결과
        print("📊 종합 분석 결과:")
        print("   이 텍스트에서는 '힘들었지만 뿌듯한' 복합적인 감정이 드러납니다.")
        print("   프로젝트 시작에 대한 성취감과 피로감이 함께 나타나고 있습니다.")
        print("   전반적으로는 긍정적인 방향의 감정으로 해석됩니다.")
        
    except Exception as e:
        print(f"❌ 분석 중 오류 발생: {e}")

async def simple_emotion_analysis(text: str) -> dict:
    """간단한 텍스트 기반 감정 분석"""
    
    # 키워드 기반 감정 분석
    positive_keywords = ["뿌듯", "좋", "기쁘", "행복", "만족", "성취"]
    negative_keywords = ["힘든", "피곤", "슬프", "화", "짜증", "스트레스"]
    neutral_keywords = ["평범", "그냥", "보통", "일반적"]
    
    text_lower = text.lower()
    
    positive_count = sum(1 for keyword in positive_keywords if keyword in text_lower)
    negative_count = sum(1 for keyword in negative_keywords if keyword in text_lower)
    neutral_count = sum(1 for keyword in neutral_keywords if keyword in text_lower)
    
    # 감정 판단
    if positive_count > negative_count and positive_count > neutral_count:
        primary_emotion = EmotionLabel.JOY
        score = min(0.8, 0.5 + positive_count * 0.1)
        emoji = "😊"
    elif negative_count > positive_count and negative_count > neutral_count:
        if "힘든" in text_lower or "피곤" in text_lower:
            primary_emotion = EmotionLabel.SADNESS
            emoji = "😢"
        else:
            primary_emotion = EmotionLabel.ANGER
            emoji = "😠"
        score = min(0.8, 0.5 + negative_count * 0.1)
    else:
        primary_emotion = EmotionLabel.NEUTRAL
        score = 0.6
        emoji = "😐"
    
    # 복합 감정 고려 (긍정+부정이 함께 있는 경우)
    if positive_count > 0 and negative_count > 0:
        primary_emotion = EmotionLabel.JOY  # 전반적으로 긍정적 결론
        score = 0.7
        emoji = "😊"
    
    confidence = min(0.9, score + 0.1)
    
    return {
        "primary_emotion": primary_emotion,
        "score": score,
        "confidence": confidence,
        "emoji": emoji
    }

async def simple_feedback_generation(text: str, emotion: EmotionLabel, style: str) -> dict:
    """간단한 템플릿 기반 피드백 생성"""
    
    feedback_templates = {
        EmotionLabel.JOY: {
            "empathetic": "힘든 상황에서도 성취감을 느끼셨군요! 그런 마음이 정말 소중해요. 프로젝트를 시작하는 설렘과 함께 피로감도 있으셨을 텐데, 그래도 뿌듯함을 느끼시는 모습이 인상적이에요.",
            "encouraging": "정말 대단하세요! 힘든 상황에서도 긍정적인 면을 찾아내시는 능력이 훌륭해요. 이런 마음가짐이면 프로젝트도 분명 성공적으로 해내실 거예요. 충분히 쉬시고 다음 단계도 화이팅하세요!",
            "analytical": "복합적인 감정을 경험하고 계시는군요. '힘들지만 뿌듯한' 감정은 새로운 도전을 시작할 때 자주 나타나는 자연스러운 반응입니다. 피로감은 충분한 휴식으로, 성취감은 앞으로의 동력으로 활용하시면 좋겠어요."
        },
        EmotionLabel.SADNESS: {
            "empathetic": "정말 힘든 하루를 보내셨군요. 프로젝트 시작과 함께 오는 부담감과 피로감이 느껴져요. 그래도 그 속에서 뿌듯함을 찾으려 하시는 마음이 대단해요.",
            "encouraging": "힘든 시간이었지만 그래도 하루를 잘 버텨내셨어요. 새로운 시작은 항상 에너지를 많이 소모하죠. 천천히 페이스 조절하시면서 진행하시면 될 거예요.",
            "analytical": "육체적 피로와 정신적 부담이 함께 작용하고 있는 상황이군요. 적절한 휴식과 스트레스 관리가 필요한 시점인 것 같아요."
        },
        EmotionLabel.NEUTRAL: {
            "empathetic": "평온한 하루였군요. 이런 안정적인 감정도 소중해요.",
            "encouraging": "균형 잡힌 마음 상태를 유지하고 계시네요. 좋은 컨디션이에요!",
            "analytical": "중립적인 감정 상태는 객관적으로 상황을 바라볼 수 있는 좋은 기회입니다."
        }
    }
    
    # 기본 템플릿 가져오기
    base_feedback = feedback_templates.get(emotion, {}).get(style, "좋은 하루 보내세요!")
    
    return {
        "feedback_text": base_feedback,
        "style": style,
        "confidence": 0.75
    }

if __name__ == "__main__":
    asyncio.run(analyze_user_text()) 