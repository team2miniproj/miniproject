"""
실제 AI 모델을 활용한 감정 분석 및 피드백 생성 (로컬 LLM 사용)
"""
import asyncio
import torch
from typing import Any, Callable

try:
    from transformers.pipelines import pipeline
except ImportError:
    # transformers 라이브러리가 없는 경우 대체 함수
    def pipeline(*args, **kwargs) -> Any:
        raise ImportError("transformers 라이브러리가 설치되지 않았습니다.")
import numpy as np
from typing import Dict, List, Any, Union
import warnings
import os
import re
warnings.filterwarnings("ignore")

class RealAIEmotionAnalyzer:
    """진짜 AI 모델 기반 감정 분석기 (로컬 LLM 사용)"""
    
    def __init__(self):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"🔧 디바이스: {self.device}")
        
        # 감정 분석 모델들
        self.emotion_classifier = None
        self.sentiment_classifier = None
        self.feedback_generator = None  # 피드백 생성용 LLM
        
        print("🤖 로컬 LLM 모델 사용 - AI가 직접 피드백 생성!")
        
    async def initialize_models(self):
        """모델 초기화"""
        try:
            print("🤖 딥러닝 모델 로딩 중...")
            
            # 1. 감정 분석 모델
            self.emotion_classifier = pipeline(
                "text-classification",
                model="j-hartmann/emotion-english-distilroberta-base",
                device=0 if self.device == "cuda" else -1,
                return_all_scores=True
            )
            
            # 2. 피드백 생성용 LLM (한국어 지원)
            try:
                print("🧠 한국어 텍스트 생성 모델 로딩 중...")
                self.feedback_generator = pipeline(
                    "text-generation",
                    model="skt/kogpt2-base-v2",  # 한국어 GPT-2
                    device=0 if self.device == "cuda" else -1,
                    max_length=200,
                    pad_token_id=50256
                )
                print("✅ 한국어 LLM 로딩 완료!")
            except Exception as e:
                print(f"⚠️  한국어 모델 로딩 실패: {e}")
                print("🔄 영어 모델로 대체...")
                try:
                    self.feedback_generator = pipeline(
                        "text-generation",
                        model="microsoft/DialoGPT-medium",
                        device=0 if self.device == "cuda" else -1,
                        max_length=150
                    )
                    print("✅ 영어 LLM 로딩 완료!")
                except:
                    print("⚠️  LLM 로딩 실패, 규칙 기반 피드백 사용")
                
            print("✅ 딥러닝 모델 로딩 완료!")
            
        except Exception as e:
            print(f"❌ 모델 로딩 실패: {e}")
            print("📦 필요한 패키지: pip install transformers torch")
            raise
    
    async def analyze_emotion(self, text: str) -> Dict[str, Any]:
        """실제 딥러닝 모델을 사용한 감정 분석"""
        if self.emotion_classifier is None:
            await self.initialize_models()
        
        print(f"🧠 AI 모델로 감정 분석 중...")
        print(f"📝 분석 텍스트: {text}")
        
        try:
            # 1. 감정 분석 실행
            if self.emotion_classifier is None:
                raise ValueError("감정 분석 모델이 로드되지 않았습니다.")
            emotion_results = self.emotion_classifier(text)
            
            # 결과가 리스트인 경우 첫 번째 항목 가져오기
            if isinstance(emotion_results, list) and len(emotion_results) > 0:
                emotion_scores = emotion_results[0] if isinstance(emotion_results[0], list) else emotion_results
            else:
                emotion_scores = emotion_results
            
            # 감정 점수들을 정렬 (점수 높은 순) - 타입 안전 처리
            if isinstance(emotion_scores, list) and len(emotion_scores) > 0:
                sorted_emotions = sorted(emotion_scores, key=lambda x: x.get('score', 0) if isinstance(x, dict) else 0, reverse=True)
            else:
                sorted_emotions = []
            
            # 한국어 라벨 매핑
            emotion_mapping = {
                'joy': '기쁨',
                'sadness': '슬픔', 
                'anger': '분노',
                'fear': '두려움',
                'surprise': '놀람',
                'disgust': '혐오',
                'neutral': '중립'
            }
            
            # 이모지 매핑
            emoji_mapping = {
                '기쁨': '😊',
                '슬픔': '😢',
                '분노': '😠', 
                '두려움': '😨',
                '놀람': '😮',
                '혐오': '🤢',
                '중립': '😐'
            }
            
            # 주요 감정 - 안전한 접근
            if sorted_emotions and isinstance(sorted_emotions[0], dict):
                primary_emotion_en = sorted_emotions[0].get('label', '').lower()
                confidence = sorted_emotions[0].get('score', 0.0)
            else:
                primary_emotion_en = 'neutral'
                confidence = 0.0
            
            primary_emotion_kr = emotion_mapping.get(primary_emotion_en, primary_emotion_en)
            
            result = {
                'primary_emotion': primary_emotion_kr,
                'primary_emotion_en': primary_emotion_en,
                'confidence': confidence,
                'emoji': emoji_mapping.get(primary_emotion_kr, '😐'),
                'all_emotions': []
            }
            
            # 모든 감정 점수
            for emotion in sorted_emotions:
                emotion_label = emotion.get('label', '')
                emotion_en = emotion_label.lower() if emotion_label else ''
                emotion_kr = emotion_mapping.get(emotion_en, emotion_en)
                result['all_emotions'].append({
                    'emotion': emotion_kr,
                    'emotion_en': emotion_en,
                    'score': emotion.get('score', 0),
                    'emoji': emoji_mapping.get(emotion_kr, '❓')
                })
            
            print(f"✅ AI 감정 분석 완료!")
            return result
            
        except Exception as e:
            print(f"❌ 감정 분석 실패: {e}")
            raise
    
    def _extract_text_features(self, text: str) -> Dict[str, Any]:
        """텍스트에서 특징 추출"""
        features = {
            'length': len(text),
            'words': len(text.split()),
            'sentences': len([s for s in text.split('.') if s.strip()]),
            'has_positive_words': False,
            'has_negative_words': False,
            'time_references': [],
            'activities': [],
            'people_references': False
        }
        
        # 긍정/부정 키워드 검출
        positive_words = ['좋', '기쁘', '행복', '뿌듯', '만족', '성공', '즐거', '감사', '사랑']
        negative_words = ['힘들', '슬프', '화', '스트레스', '피곤', '짜증', '우울', '불안', '걱정']
        
        text_lower = text.lower()
        features['has_positive_words'] = any(word in text for word in positive_words)
        features['has_negative_words'] = any(word in text for word in negative_words)
        
        # 시간 참조
        time_words = ['오늘', '어제', '내일', '지금', '요즘', '최근', '하루', '주말', '아침', '저녁']
        features['time_references'] = [word for word in time_words if word in text]
        
        # 활동 감지
        activity_words = ['회의', '공부', '일', '운동', '만남', '데이트', '여행', '쇼핑', '요리']
        features['activities'] = [word for word in activity_words if word in text]
        
        # 인물 참조
        people_words = ['친구', '가족', '엄마', '아빠', '형', '누나', '동생', '선생님', '상사']
        features['people_references'] = any(word in text for word in people_words)
        
        return features
    
    async def generate_real_ai_feedback(self, text: str, emotion_result: Dict[str, Any]) -> str:
        """로컬 LLM을 활용한 개인화된 피드백 생성"""
        if self.feedback_generator is None:
            return await self._generate_smart_template_feedback(text, emotion_result)
        
        try:
            print("🤖 로컬 LLM으로 개인화된 피드백 생성 중...")
            
            # 텍스트 특징 추출
            features = self._extract_text_features(text)
            primary_emotion = emotion_result['primary_emotion']
            confidence = emotion_result['confidence']
            
            # LLM용 프롬프트 생성
            prompt = self._create_llm_prompt(text, emotion_result, features)
            
            # LLM으로 피드백 생성
            generated = self.feedback_generator(
                prompt,
                max_new_tokens=100,
                num_return_sequences=1,
                temperature=0.8,
                do_sample=True,
                repetition_penalty=1.2,
                pad_token_id=self.feedback_generator.tokenizer.pad_token_id or 50256
            )
            
            # 생성된 텍스트에서 피드백 부분만 추출
            full_text = generated[0]['generated_text']
            feedback = full_text[len(prompt):].strip()
            
            # 후처리
            feedback = self._post_process_feedback(feedback, emotion_result)
            
            print("✅ LLM 피드백 생성 완료!")
            return feedback
            
        except Exception as e:
            print(f"⚠️  LLM 피드백 생성 실패: {e}")
            return await self._generate_smart_template_feedback(text, emotion_result)
    
    def _create_llm_prompt(self, text: str, emotion_result: Dict[str, Any], features: Dict[str, Any]) -> str:
        """LLM용 프롬프트 생성"""
        emotion = emotion_result['primary_emotion']
        confidence = emotion_result['confidence']
        
        # 텍스트 특징에 따른 맞춤 프롬프트
        context_info = []
        if features['activities']:
            context_info.append(f"활동: {', '.join(features['activities'])}")
        if features['time_references']:
            context_info.append(f"시간: {', '.join(features['time_references'])}")
        if features['people_references']:
            context_info.append("인간관계 언급됨")
        
        context = " | ".join(context_info) if context_info else "일반적인 내용"
        
        prompt = f"""다음 텍스트의 감정을 분석한 결과, '{emotion}' 감정이 감지되었습니다.
텍스트: "{text}"
감정: {emotion} (신뢰도: {confidence:.1%})
맥락: {context}

이 사람에게 공감하며 격려하는 따뜻한 피드백을 한국어로 작성해주세요:"""

        return prompt
    
    def _post_process_feedback(self, feedback: str, emotion_result: Dict[str, Any]) -> str:
        """피드백 후처리"""
        # 불필요한 부분 제거
        feedback = re.sub(r'\n+', ' ', feedback)
        feedback = feedback.strip()
        
        # 너무 짧거나 이상한 경우 기본 피드백으로 대체
        if len(feedback) < 10 or not any(char in feedback for char in '가나다라마바사아자차카타파하'):
            emotion = emotion_result['primary_emotion']
            emoji = emotion_result['emoji']
            return f"{emotion} 감정이 느껴지네요 {emoji} 당신의 마음을 이해합니다."
        
        # 이모지 추가 (없는 경우)
        if not any(char in feedback for char in '😊😢😠😨😮🤢😐'):
            emoji = emotion_result['emoji']
            feedback = f"{feedback} {emoji}"
        
        return feedback
    
    async def _generate_smart_template_feedback(self, text: str, emotion_result: Dict[str, Any]) -> str:
        """텍스트 내용을 분석한 스마트 템플릿 피드백"""
        try:
            features = self._extract_text_features(text)
            primary_emotion = emotion_result['primary_emotion']
            confidence = emotion_result['confidence']
            emoji = emotion_result['emoji']
            
            # 기본 감정 반응
            base_responses = {
                '기쁨': f"긍정적인 에너지가 느껴져요! {emoji}",
                '슬픔': f"힘든 시간을 보내고 계시는군요 {emoji}",
                '분노': f"화가 나는 상황이었군요 {emoji}",
                '두려움': f"불안한 마음이 드시는군요 {emoji}",
                '놀람': f"예상치 못한 일이 있었나봐요! {emoji}",
                '혐오': f"불쾌한 상황이었군요 {emoji}",
                '중립': f"균형 잡힌 마음 상태네요 {emoji}"
            }
            
            feedback_parts = [base_responses.get(primary_emotion, f"당신의 감정을 이해해요 {emoji}")]
            
            # 텍스트 내용 기반 맞춤 메시지
            if features['activities']:
                if '회의' in features['activities'] or '일' in features['activities']:
                    if primary_emotion in ['피곤', '슬픔', '분노']:
                        feedback_parts.append("업무가 힘드셨나봐요. 충분한 휴식을 취하세요.")
                    else:
                        feedback_parts.append("일하시느라 수고 많으셨어요.")
                        
                if '운동' in features['activities']:
                    feedback_parts.append("건강 관리도 잘 하고 계시네요!")
                    
                if '만남' in features['activities'] or features['people_references']:
                    feedback_parts.append("소중한 사람들과의 시간이었군요.")
            
            if features['time_references']:
                if '오늘' in features['time_references']:
                    feedback_parts.append("오늘 하루도 소중한 경험이었을 거예요.")
                    
            # 긍정/부정 단어 기반 추가 메시지
            if features['has_positive_words'] and features['has_negative_words']:
                feedback_parts.append("복합적인 감정을 경험하셨군요. 그런 날들이 있어요.")
            elif features['has_positive_words']:
                feedback_parts.append("긍정적인 마음가짐이 느껴져요.")
            elif features['has_negative_words']:
                feedback_parts.append("힘든 감정도 자연스러운 반응이에요.")
            
            # 신뢰도 기반 마무리
            if confidence > 0.8:
                feedback_parts.append("AI가 확실하게 감지한 감정입니다.")
            elif confidence > 0.6:
                feedback_parts.append("감정이 명확하게 드러나네요.")
            else:
                feedback_parts.append("다양한 감정이 섞여있는 것 같아요.")
            
            return " ".join(feedback_parts)
            
        except Exception as e:
            print(f"❌ 스마트 템플릿 피드백 생성 실패: {e}")
            emotion = emotion_result['primary_emotion']
            emoji = emotion_result['emoji']
            return f"{emotion} 감정이 느껴지네요 {emoji} 당신의 마음을 이해하고 공감해요."

async def analyze_with_real_ai():
    """실제 AI 모델을 사용한 분석 (로컬 LLM)"""
    
    user_text = "오늘은 정말 힘든 하루였다. 프로젝트 회의도 하고 역할 분배도 해서 프로젝트를 본격적으로 시작한 하루였다. 잠도 많이 못 자고 와서 정말 피곤했지만 그래도 나름 뿌듯한 하루였다고 생각한다."
    
    print("=" * 60)
    print("🤖 로컬 LLM 기반 감정 분석 및 개인화 피드백 생성")
    print("🧠 AI가 직접 텍스트를 이해하고 맞춤 피드백 생성!")
    print("=" * 60)
    print(f"📝 분석 대상 텍스트:")
    print(f"   {user_text}")
    print()
    
    try:
        # 실제 AI 분석기 초기화
        analyzer = RealAIEmotionAnalyzer()
        
        # 감정 분석 수행
        emotion_result = await analyzer.analyze_emotion(user_text)
        
        print("📊 실제 AI 모델 분석 결과:")
        print(f"   🎯 주요 감정: {emotion_result['primary_emotion']} {emotion_result['emoji']}")
        print(f"   📈 AI 신뢰도: {emotion_result['confidence']:.1%}")
        print()
        
        print("📋 전체 감정 점수 (AI 분석):")
        for emotion in emotion_result['all_emotions'][:5]:
            print(f"   {emotion['emoji']} {emotion['emotion']}: {emotion['score']:.1%}")
        print()
        
        # 로컬 LLM으로 개인화된 피드백 생성
        print("🤖 로컬 LLM으로 개인화된 피드백 생성 중...")
        ai_feedback = await analyzer.generate_real_ai_feedback(user_text, emotion_result)
        
        print("💬 AI 개인화 피드백:")
        print(f"   {ai_feedback}")
        print()
        
        # 종합 AI 분석
        print("🧠 로컬 LLM 종합 분석:")
        print(f"   이 텍스트에서 AI가 감지한 주요 감정은 '{emotion_result['primary_emotion']}'입니다.")
        print(f"   신뢰도 {emotion_result['confidence']:.1%}로 분석되었습니다.")
        print("   🤖 로컬 LLM이 텍스트 내용을 이해하고 개인화된 피드백을 생성했습니다!")
        print("   💰 OpenAI API 비용 없이도 AI가 직접 생각하고 답변해요!")
        
    except Exception as e:
        print(f"❌ 로컬 LLM 분석 중 오류 발생: {e}")
        print("💡 필요한 패키지 설치:")
        print("   pip install transformers torch")

if __name__ == "__main__":
    asyncio.run(analyze_with_real_ai()) 