"""
실제 AI 모델을 활용한 감정 분석 및 피드백 생성 (MBTI T/F 스타일 지원)
"""
import asyncio
import os
from typing import Dict, Any, List
import warnings
warnings.filterwarnings("ignore")

# Hugging Face Transformers 사용
try:
    from transformers import pipeline
    TRANSFORMERS_AVAILABLE = True
    print("✅ Transformers 라이브러리 사용 가능")
except ImportError:
    TRANSFORMERS_AVAILABLE = False
    print("⚠️  Transformers 라이브러리 없음")

# OpenAI 사용
try:
    import openai
    OPENAI_AVAILABLE = True
    print("✅ OpenAI 라이브러리 사용 가능")
except ImportError:
    OPENAI_AVAILABLE = False
    print("⚠️  OpenAI 라이브러리 없음")

class MBTIStyleAIAnalyzer:
    """MBTI T/F 스타일을 지원하는 AI 분석기"""
    
    def __init__(self):
        self.emotion_model = None
        self.openai_client = None
        self._setup_models()
    
    def _setup_models(self):
        """AI 모델 설정"""
        
        # OpenAI 설정
        api_key = os.getenv('OPENAI_API_KEY')
        if OPENAI_AVAILABLE and api_key:
            self.openai_client = openai.OpenAI(api_key=api_key)
            print("🔑 OpenAI 클라이언트 설정 완료")
        else:
            print("⚠️  OpenAI API 키 없음 - 환경변수 OPENAI_API_KEY 설정 필요")
        
        # Hugging Face 모델 설정
        if TRANSFORMERS_AVAILABLE:
            try:
                print("🤖 감정 분석 모델 로딩 중...")
                self.emotion_model = pipeline(
                    "text-classification",
                    model="j-hartmann/emotion-english-distilroberta-base",
                    device=-1  # CPU 사용
                )
                print("✅ Hugging Face 감정 분석 모델 로딩 완료!")
            except Exception as e:
                print(f"❌ 모델 로딩 실패: {e}")
                self.emotion_model = None
    
    def analyze_emotion_with_ai(self, text: str) -> Dict[str, Any]:
        """실제 AI 모델로 감정 분석"""
        
        if self.emotion_model:
            return self._analyze_with_huggingface(text)
        else:
            return self._analyze_with_simple_ai(text)
    
    def _analyze_with_huggingface(self, text: str) -> Dict[str, Any]:
        """Hugging Face 모델로 감정 분석"""
        try:
            print("🧠 Hugging Face AI 모델로 감정 분석 중...")
            
            # 감정 분석 실행
            results = self.emotion_model(text)
            
            # 결과 처리
            if isinstance(results, list):
                primary_result = results[0]
            else:
                primary_result = results
            
            # 감정 매핑
            emotion_mapping = {
                'joy': '기쁨', 'sadness': '슬픔', 'anger': '분노',
                'fear': '두려움', 'surprise': '놀람', 'disgust': '혐오',
                'neutral': '중립'
            }
            
            emoji_mapping = {
                '기쁨': '😊', '슬픔': '😢', '분노': '😠',
                '두려움': '😨', '놀람': '😮', '혐오': '🤢', '중립': '😐'
            }
            
            emotion_en = primary_result['label'].lower()
            emotion_kr = emotion_mapping.get(emotion_en, emotion_en)
            confidence = primary_result['score']
            
            return {
                'method': 'Hugging Face AI Model',
                'primary_emotion': emotion_kr,
                'emotion_en': emotion_en,
                'confidence': confidence,
                'emoji': emoji_mapping.get(emotion_kr, '😐'),
                'raw_result': primary_result
            }
            
        except Exception as e:
            print(f"❌ Hugging Face 분석 실패: {e}")
            return self._analyze_with_simple_ai(text)
    
    def _analyze_with_simple_ai(self, text: str) -> Dict[str, Any]:
        """간단한 규칙 기반 감정 분석 (AI 모델 대안)"""
        print("🔍 규칙 기반 감정 분석 실행...")
        
        # 감정 키워드
        emotion_keywords = {
            '기쁨': ['뿌듯', '기쁘', '좋', '행복', '만족', '성취'],
            '슬픔': ['힘든', '슬프', '우울', '안타깝'],
            '분노': ['화', '짜증', '분노', '억울'],
            '두려움': ['무서', '걱정', '불안', '두려'],
            '놀람': ['놀라', '깜짝', '예상치'],
            '중립': ['평범', '보통', '그냥']
        }
        
        text_lower = text.lower()
        emotion_scores = {}
        
        for emotion, keywords in emotion_keywords.items():
            score = sum(1 for keyword in keywords if keyword in text_lower)
            if score > 0:
                emotion_scores[emotion] = score / len(keywords)
        
        if emotion_scores:
            primary_emotion = max(emotion_scores, key=emotion_scores.get)
            confidence = emotion_scores[primary_emotion]
        else:
            primary_emotion = '중립'
            confidence = 0.5
        
        # 복합 감정 처리
        if '뿌듯' in text_lower and '힘든' in text_lower:
            primary_emotion = '기쁨'  # 최종적으로 긍정적
            confidence = 0.75
        
        emoji_mapping = {
            '기쁨': '😊', '슬픔': '😢', '분노': '😠',
            '두려움': '😨', '놀람': '😮', '혐오': '🤢', '중립': '😐'
        }
        
        return {
            'method': 'Rule-based Analysis',
            'primary_emotion': primary_emotion,
            'confidence': confidence,
            'emoji': emoji_mapping[primary_emotion],
            'emotion_scores': emotion_scores
        }
    
    async def generate_mbti_feedback(self, text: str, emotion_result: Dict[str, Any]) -> Dict[str, str]:
        """MBTI T형과 F형 스타일로 피드백 생성"""
        
        if self.openai_client:
            return await self._generate_openai_mbti_feedback(text, emotion_result)
        else:
            return self._generate_template_mbti_feedback(text, emotion_result)
    
    async def _generate_openai_mbti_feedback(self, text: str, emotion_result: Dict[str, Any]) -> Dict[str, str]:
        """OpenAI GPT로 MBTI T/F 스타일 피드백 생성"""
        try:
            print("🤖 OpenAI GPT로 MBTI T/F 스타일 피드백 생성 중...")
            
            emotion = emotion_result['primary_emotion']
            confidence = emotion_result['confidence']
            
            # T형 피드백 생성
            t_prompt = f"""
다음은 어떤 사람이 작성한 일기 내용입니다:
"{text}"

감정 분석 결과: {emotion} (신뢰도: {confidence:.1%})

이 사람에게 MBTI T형(Thinking) 스타일로 피드백을 한국어로 작성해주세요.
T형 특징:
- 논리적이고 객관적인 분석
- 사실과 데이터 중심
- 문제 해결 지향적
- 직접적이고 간결한 표현
- 개선 방안 제시

2-3문장으로 작성해주세요.

T형 피드백:"""

            # F형 피드백 생성
            f_prompt = f"""
다음은 어떤 사람이 작성한 일기 내용입니다:
"{text}"

감정 분석 결과: {emotion} (신뢰도: {confidence:.1%})

이 사람에게 MBTI F형(Feeling) 스타일로 피드백을 한국어로 작성해주세요.
F형 특징:
- 공감적이고 따뜻한 표현
- 감정과 관계 중심
- 조화와 배려 지향
- 격려와 지지적인 톤
- 이모지 포함

2-3문장으로 작성해주세요.

F형 피드백:"""

            # 동시에 두 스타일 생성
            tasks = [
                self.openai_client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": "당신은 MBTI T형 성향의 논리적이고 분석적인 AI 상담사입니다."},
                        {"role": "user", "content": t_prompt}
                    ],
                    max_tokens=150,
                    temperature=0.6
                ),
                self.openai_client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": "당신은 MBTI F형 성향의 공감적이고 따뜻한 AI 상담사입니다."},
                        {"role": "user", "content": f_prompt}
                    ],
                    max_tokens=150,
                    temperature=0.7
                )
            ]
            
            # 비동기 실행
            import asyncio
            responses = await asyncio.gather(*[
                asyncio.create_task(self._make_openai_request(task)) for task in tasks
            ])
            
            t_feedback = responses[0].choices[0].message.content.strip()
            f_feedback = responses[1].choices[0].message.content.strip()
            
            print("✅ OpenAI MBTI T/F 스타일 피드백 생성 완료!")
            return {
                'T형': f"[OpenAI GPT T형] {t_feedback}",
                'F형': f"[OpenAI GPT F형] {f_feedback}"
            }
            
        except Exception as e:
            print(f"❌ OpenAI MBTI 피드백 생성 실패: {e}")
            return self._generate_template_mbti_feedback(text, emotion_result)
    
    async def _make_openai_request(self, task):
        """OpenAI 요청을 비동기로 처리"""
        return task
    
    def _generate_template_mbti_feedback(self, text: str, emotion_result: Dict[str, Any]) -> Dict[str, str]:
        """템플릿 기반 MBTI T/F 스타일 피드백"""
        
        emotion = emotion_result['primary_emotion']
        confidence = emotion_result['confidence']
        
        # 텍스트 내용 분석
        contains_project = '프로젝트' in text
        contains_tired = '피곤' in text or '힘든' in text
        contains_proud = '뿌듯' in text
        
        # T형 스타일 피드백 (논리적, 분석적, 해결책 중심)
        t_style_responses = {
            '기쁨': [
                "긍정적인 감정 상태가 확인됩니다. 이런 성취감을 유지하기 위한 체계적인 접근이 필요해 보입니다.",
                "만족도가 높은 상태입니다. 이 패턴을 분석해서 향후 프로젝트에 적용할 수 있을 것 같습니다."
            ],
            '슬픔': [
                "스트레스 지수가 높아 보입니다. 업무량 조절과 휴식 시간 확보가 우선순위로 보입니다.",
                "피로도가 누적된 상태입니다. 효율적인 시간 관리와 우선순위 재설정이 필요합니다."
            ],
            '중립': [
                "균형잡힌 상태입니다. 현재 패턴을 유지하면서 점진적 개선을 고려해보세요.",
                "안정적인 감정 상태가 관찰됩니다. 다음 단계 계획 수립에 집중할 시점입니다."
            ]
        }
        
        # F형 스타일 피드백 (공감적, 따뜻한, 격려 중심)
        f_style_responses = {
            '기쁨': [
                "정말 뿌듯하셨을 것 같아요! 😊 이런 성취감을 느끼시는 모습이 너무 보기 좋아요.",
                "힘든 중에도 긍정적인 마음을 갖고 계시니 정말 대단해요! 😊 스스로를 칭찬해주세요."
            ],
            '슬픔': [
                "정말 고생 많으셨어요 😢 힘든 하루를 버텨내신 자신을 격려해주세요.",
                "피로하셨을 텐데 그래도 최선을 다하신 모습이 대단해요 😢 충분히 쉬셔도 돼요."
            ],
            '중립': [
                "차분한 마음으로 하루를 보내셨군요 😌 이런 평온함도 소중한 거예요.",
                "균형감을 유지하고 계시는 모습이 멋져요 😌 자신의 페이스를 잘 지켜가세요."
            ]
        }
        
        # 컨텍스트 기반 추가 메시지
        t_context = ""
        f_context = ""
        
        if contains_project and contains_tired and contains_proud:
            t_context = " 프로젝트 초기 단계의 전형적인 패턴입니다. 워크로드 분산을 검토해보세요."
            f_context = " 새로운 시작과 함께 오는 설렘과 부담감이 느껴져요. 함께 해나가면 될 거예요! 💪"
        elif contains_project:
            t_context = " 새 프로젝트 시작 시점의 적절한 반응입니다. 단계별 계획 수립을 권장합니다."
            f_context = " 새로운 도전을 시작하시는군요! 응원하고 있어요. 🌟"
        elif contains_tired:
            t_context = " 휴식과 회복이 성과 향상의 핵심 요소입니다."
            f_context = " 너무 무리하지 마시고 충분히 쉬어가세요. 💕"
        
        # 기본 응답 선택
        t_base = t_style_responses.get(emotion, ["현재 상태를 객관적으로 분석해볼 필요가 있습니다."])[0]
        f_base = f_style_responses.get(emotion, ["당신의 마음을 이해해요. 😊"])[0]
        
        return {
            'T형': f"[T형 분석] {t_base}{t_context}",
            'F형': f"[F형 공감] {f_base}{f_context}"
        }

async def run_mbti_style_analysis():
    """MBTI T/F 스타일 분석 실행"""
    
    user_text = "오늘은 정말 힘든 하루였다. 프로젝트 회의도 하고 역할 분배도 해서 프로젝트를 본격적으로 시작한 하루였다. 잠도 많이 못 자고 와서 정말 피곤했지만 그래도 나름 뿌듯한 하루였다고 생각한다."
    
    print("="*60)
    print("🧠 MBTI T형/F형 스타일별 AI 감정 분석 및 피드백")
    print("="*60)
    print(f"📝 분석 대상 텍스트:")
    print(f"   {user_text}")
    print()
    
    # MBTI 스타일 AI 분석기 초기화
    analyzer = MBTIStyleAIAnalyzer()
    
    try:
        # 1. 감정 분석
        print("🔍 1단계: AI 감정 분석")
        emotion_result = analyzer.analyze_emotion_with_ai(user_text)
        
        print(f"   📊 분석 방법: {emotion_result['method']}")
        print(f"   🎯 주요 감정: {emotion_result['primary_emotion']} {emotion_result['emoji']}")
        print(f"   📈 신뢰도: {emotion_result['confidence']:.1%}")
        print()
        
        # 2. MBTI T/F 스타일 피드백 생성
        print("🤖 2단계: MBTI T형/F형 스타일별 AI 피드백 생성")
        mbti_feedback = await analyzer.generate_mbti_feedback(user_text, emotion_result)
        
        print("   💭 T형 (Thinking) 스타일 피드백:")
        print(f"      {mbti_feedback['T형']}")
        print()
        
        print("   💝 F형 (Feeling) 스타일 피드백:")
        print(f"      {mbti_feedback['F형']}")
        print()
        
        # 3. MBTI 스타일 차이점 분석
        print("📋 3단계: MBTI T형 vs F형 스타일 비교")
        print("   🔍 T형 특징:")
        print("      - 논리적이고 객관적인 분석")
        print("      - 문제 해결과 개선 방안 중심")
        print("      - 직접적이고 사실 기반의 표현")
        print()
        print("   💕 F형 특징:")
        print("      - 공감적이고 감정적인 지지")
        print("      - 격려와 배려 중심")
        print("      - 따뜻하고 개인적인 표현")
        print()
        
        # 4. 종합 분석
        print("🧠 4단계: 종합 AI 분석")
        print(f"   ✨ AI가 분석한 주요 감정: '{emotion_result['primary_emotion']}' (신뢰도: {emotion_result['confidence']:.1%})")
        
        if 'Hugging Face' in emotion_result['method']:
            print("   🤖 실제 딥러닝 모델이 감정을 분석했습니다.")
        
        if 'OpenAI' in mbti_feedback['T형']:
            print("   💡 OpenAI GPT가 MBTI 스타일별 맞춤 피드백을 생성했습니다.")
        else:
            print("   📝 MBTI 성향을 고려한 템플릿 기반 피드백이 사용되었습니다.")
        
        print("\n🎉 MBTI T형/F형 스타일별 AI 분석이 완료되었습니다!")
        
    except Exception as e:
        print(f"❌ 분석 중 오류 발생: {e}")
        print("💡 다음을 확인해주세요:")
        print("   - OpenAI API 키: export OPENAI_API_KEY='your-key'")
        print("   - 필요 패키지: pip install transformers torch openai")

if __name__ == "__main__":
    asyncio.run(run_mbti_style_analysis()) 