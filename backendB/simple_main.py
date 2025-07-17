"""
간단한 AI 분석 서버 - 감정 분석과 피드백 생성만 제공
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
import logging
import uvicorn
import random

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="AI 감정 분석 및 피드백 서버",
    description="텍스트 기반 감정 분석과 AI 피드백 생성 서비스",
    version="1.0.0"
)

# CORS 설정 (개발 환경용 - 모든 origin 허용)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# 요청/응답 모델
class EmotionAnalysisRequest(BaseModel):
    text: str
    user_id: str = "default"

class EmotionScore(BaseModel):
    emotion: str
    score: float
    emoji: str

class EmotionAnalysisResponse(BaseModel):
    primary_emotion: str
    primary_emotion_score: float
    primary_emotion_emoji: str
    all_emotions: List[EmotionScore]
    confidence: float

class FeedbackRequest(BaseModel):
    text: str
    emotion: str
    style: str = "empathetic"
    user_id: str = "default"

class FeedbackResponse(BaseModel):
    feedback_text: str
    style: str
    confidence: float

class DiaryStyleRequest(BaseModel):
    text: str
    user_id: str = "default"

class DiaryStyleResponse(BaseModel):
    diary_text: str
    confidence: float

# 일기체 변환 엔진
class DiaryStyleConverter:
    def __init__(self):
        self.diary_templates = {
            "기쁨": [
                "오늘은 정말 기쁜 하루였다. {content} 이런 순간들이 내 인생의 소중한 보물이 될 것 같다.",
                "행복한 하루를 보냈다. {content} 이런 기쁨이 계속 이어졌으면 좋겠다.",
                "오늘은 마음이 가벼웠다. {content} 정말 감사한 하루였다."
            ],
            "슬픔": [
                "오늘은 마음이 무거웠다. {content} 이런 시간도 지나가겠지. 내일은 더 나은 날이 올 것이다.",
                "힘든 하루였다. {content} 하지만 이 또한 지나갈 것이다. 나는 강하다.",
                "오늘은 눈물이 날 것 같은 하루였다. {content} 이런 감정도 자연스러운 것 같다."
            ],
            "분노": [
                "오늘은 화가 났다. {content} 이런 감정을 느끼는 것도 당연한 일이다.",
                "짜증나는 하루였다. {content} 하지만 이 감정도 곧 사라질 것이다.",
                "오늘은 정말 속상했다. {content} 이런 일들이 있어도 나는 괜찮다."
            ],
            "두려움": [
                "오늘은 불안한 하루였다. {content} 하지만 걱정만 해도 소용없다. 차근차근 해결해보자.",
                "두려운 마음이 들었다. {content} 이런 감정도 자연스러운 것이다.",
                "오늘은 마음이 편하지 않았다. {content} 내일은 더 나은 날이 될 것이다."
            ],
            "놀람": [
                "오늘은 정말 놀라운 일이 있었다. {content} 이런 순간들이 인생을 재미있게 만드는 것 같다.",
                "깜짝 놀란 하루였다. {content} 정말 뜻밖의 일이었다.",
                "오늘은 예상치 못한 일이 있었다. {content} 이런 놀라움이 있어야 인생이 재미있는 것 같다."
            ],
            "혐오": [
                "오늘은 정말 싫은 일이 있었다. {content} 이런 일들은 빨리 잊어버리고 싶다.",
                "불쾌한 하루였다. {content} 하지만 이런 일들도 지나갈 것이다.",
                "오늘은 정말 짜증나는 일이 있었다. {content} 이런 감정도 자연스러운 것이다."
            ],
            "중성": [
                "오늘은 평범한 하루였다. {content} 이런 일상도 소중한 것 같다.",
                "차분한 하루를 보냈다. {content} 때로는 이런 평온함이 필요하다.",
                "오늘은 잔잔한 하루였다. {content} 이런 시간들도 의미가 있는 것 같다."
            ]
        }
    
    def convert_to_diary_style(self, text: str, emotion: str = "중성") -> DiaryStyleResponse:
        """텍스트를 일기체로 변환"""
        import random
        
        # 감정에 따른 템플릿 선택
        templates = self.diary_templates.get(emotion, self.diary_templates["중성"])
        template = random.choice(templates)
        
        # 템플릿에 내용 삽입
        diary_text = template.format(content=text)
        
        return DiaryStyleResponse(
            diary_text=diary_text,
            confidence=random.uniform(0.8, 0.95)
        )

# 감정 분석 엔진
class EmotionAnalyzer:
    def __init__(self):
        self.emotions = [
            {"emotion": "기쁨", "emoji": "😊"},
            {"emotion": "슬픔", "emoji": "😢"},
            {"emotion": "분노", "emoji": "😡"},
            {"emotion": "두려움", "emoji": "😰"},
            {"emotion": "놀람", "emoji": "😮"},
            {"emotion": "혐오", "emoji": "🤢"},
            {"emotion": "중성", "emoji": "😐"},
        ]
        
        self.keyword_mapping = {
            "기쁨": ["행복", "기쁘", "즐거", "웃", "좋", "사랑", "감사", "축하", "만족", "기뻐", "신나", "재미", "완벽"],
            "슬픔": ["슬프", "우울", "아프", "눈물", "힘들", "괴로", "외로", "속상", "실망", "상처", "절망", "서러"],
            "분노": ["화", "짜증", "열받", "분노", "싫", "미워", "답답", "빡쳐", "억울", "분해", "악"],
            "두려움": ["무서", "걱정", "불안", "두렵", "떨려", "겁", "근심", "염려", "조심", "위험"],
            "놀람": ["놀라", "깜짝", "어머", "헉", "와", "대박", "어라", "세상", "진짜", "정말"],
            "혐오": ["역겨", "더러", "지겨", "징그", "끔찍", "싫어", "혐오", "구역"],
            "중성": ["그냥", "보통", "일반", "평범", "그저", "단순", "그런", "이런"]
        }
    
    def analyze(self, text: str) -> EmotionAnalysisResponse:
        """실제 텍스트 분석 기반 감정 분석"""
        emotion_scores = {}
        text_lower = text.lower()
        
        # 키워드 기반 점수 계산
        for emotion, keywords in self.keyword_mapping.items():
            score = 0
            for keyword in keywords:
                if keyword in text_lower:
                    score += 1
            emotion_scores[emotion] = score
        
        # 가장 높은 점수의 감정 찾기
        primary_emotion_name = max(emotion_scores, key=emotion_scores.get)
        
        # 점수가 0이면 중성으로 설정
        if emotion_scores[primary_emotion_name] == 0:
            primary_emotion_name = "중성"
        
        # 모든 감정 점수 정규화
        all_emotions = []
        total_keywords = sum(len(keywords) for keywords in self.keyword_mapping.values())
        
        for emotion_info in self.emotions:
            emotion_name = emotion_info["emotion"]
            raw_score = emotion_scores.get(emotion_name, 0)
            
            # 기본 점수 + 키워드 점수 + 약간의 랜덤
            base_score = 0.1
            keyword_score = (raw_score / max(len(self.keyword_mapping[emotion_name]), 1)) * 0.8
            random_score = random.uniform(0, 0.1)
            
            final_score = base_score + keyword_score + random_score
            
            # 주요 감정에 보너스 점수
            if emotion_name == primary_emotion_name:
                final_score = max(final_score, 0.6)
            
            all_emotions.append(EmotionScore(
                emotion=emotion_name,
                score=min(final_score, 1.0),
                emoji=emotion_info["emoji"]
            ))
        
        # 점수순 정렬
        all_emotions.sort(key=lambda x: x.score, reverse=True)
        
        # 주요 감정 정보 찾기
        primary_emotion_info = next(e for e in all_emotions if e.emotion == primary_emotion_name)
        
        return EmotionAnalysisResponse(
            primary_emotion=primary_emotion_name,
            primary_emotion_score=primary_emotion_info.score,
            primary_emotion_emoji=primary_emotion_info.emoji,
            all_emotions=all_emotions,
            confidence=random.uniform(0.75, 0.95)
        )

# 피드백 생성 엔진
class FeedbackGenerator:
    def __init__(self):
        self.templates = {
            "empathetic": {
                "기쁨": [
                    "정말 기쁜 일이 있었나보네요! 그 행복한 감정이 글에서 느껴집니다. 이런 순간들이 소중한 것 같아요.",
                    "행복한 마음이 전해져요. 좋은 일이 있으셨나 봐요. 그 기쁨이 마음에 오래 남았으면 좋겠어요.",
                    "기쁜 감정이 느껴져요. 이런 즐거운 순간들을 간직하시는 것이 정말 좋은 것 같아요."
                ],
                "슬픔": [
                    "힘든 시간을 보내고 계시는군요. 그 마음이 충분히 이해됩니다. 이런 감정도 자연스러운 것이에요.",
                    "슬픈 마음이 느껴져요. 지금 느끼는 감정이 무겁게 느껴지실 것 같아요. 함께 이겨내봐요.",
                    "어려운 상황에 계신 것 같아요. 그 마음을 충분히 공감합니다. 곧 좋은 날이 올 거예요."
                ],
                "분노": [
                    "화가 나는 일이 있었나 봐요. 그 감정을 표현하는 것도 중요해요. 그 마음을 이해할 수 있어요.",
                    "분노는 자연스러운 감정이에요. 정말 속상하셨을 것 같아요. 그 감정이 충분히 공감됩니다.",
                    "화나는 상황이 있었나 봐요. 그런 감정을 느끼는 것도 당연해요. 천천히 마음을 달래보세요."
                ],
                "두려움": [
                    "불안한 마음이 드시는군요. 두려움을 느끼는 것은 자연스러운 일이에요. 그 마음을 이해해요.",
                    "걱정이 많으신 것 같아요. 그런 감정이 들 때는 정말 힘드실 것 같아요. 함께 해결해봐요.",
                    "두려운 마음이 느껴져요. 이런 감정도 우리가 느끼는 자연스러운 것이니까요."
                ],
                "놀람": [
                    "놀라운 일이 있었나 봐요! 그 놀라움이 글에서 느껴져요. 어떤 일이었는지 궁금해요.",
                    "깜짝 놀라셨나 봐요. 그 놀라움이 생생하게 전해져요. 정말 뜻밖의 일이었나 봐요.",
                    "놀라운 상황이 있었나 봐요. 그 순간의 감정이 잘 표현되어 있어요."
                ],
                "혐오": [
                    "불쾌한 일이 있었나 봐요. 그런 감정을 느끼는 것도 자연스러운 일이에요. 마음을 정리하는 시간을 가져보세요.",
                    "싫은 일이 있었나 봐요. 그 감정을 표현하는 것만으로도 의미가 있어요. 천천히 마음을 달래보세요.",
                    "불편한 상황이 있었나 봐요. 그런 감정도 우리가 느끼는 자연스러운 것이니까요."
                ],
                "중성": [
                    "평온한 하루를 보내신 것 같네요. 이런 일상도 소중한 것 같아요. 잔잔한 마음이 느껴져요.",
                    "차분한 마음이 글에서 느껴져요. 때로는 이런 평온함이 필요해요. 소중한 시간이었을 거예요.",
                    "평범한 일상도 나름의 의미가 있는 것 같아요. 이런 잔잔한 감정도 좋은 것 같아요."
                ]
            },
            "encouraging": {
                "기쁨": [
                    "이런 긍정적인 에너지가 계속 이어졌으면 좋겠어요! 정말 멋져요. 앞으로도 이런 순간들이 많아지길 바라요!",
                    "행복한 순간을 잘 기록해두셨네요. 이런 에너지로 앞으로도 화이팅! 더 많은 기쁨이 찾아올 거예요.",
                    "기쁨이 가득한 하루였나 봐요. 이런 긍정적인 마음가짐이 정말 좋아요. 계속 이런 에너지를 유지해보세요!"
                ],
                "슬픔": [
                    "힘든 시간이지만 이겨낼 수 있을 거예요. 응원하고 있어요! 곧 좋은 일이 찾아올 거예요.",
                    "지금은 힘들지만 이 또한 지나갈 거예요. 당신은 충분히 강해요! 힘내세요!",
                    "슬픈 일이 있어도 내일은 더 나은 날이 될 거예요. 응원하고 있어요. 화이팅!"
                ],
                "분노": [
                    "화가 나는 일이 있었지만 이를 통해 더 성장할 수 있을 거예요! 이런 감정을 긍정적으로 활용해보세요.",
                    "분노도 성장의 원동력이 될 수 있어요. 힘든 감정이지만 더 나은 내일을 만들어가요!",
                    "화나는 일이 있었지만 이를 극복하면 더 강해질 거예요. 응원하고 있어요!"
                ],
                "두려움": [
                    "불안한 마음이 들지만 용기를 내보세요! 당신은 생각보다 강해요. 한 걸음씩 나아가면 돼요.",
                    "두려움을 느끼는 것은 자연스러워요. 하지만 이를 극복하면 더 성장할 수 있어요. 화이팅!",
                    "걱정이 많으시겠지만 모든 일이 잘 될 거예요. 긍정적으로 생각해보세요!"
                ],
                "놀람": [
                    "놀라운 일이 있었나 봐요! 이런 새로운 경험들이 삶을 더 풍요롭게 만들어줄 거예요.",
                    "뜻밖의 일이 있었나 봐요. 이런 놀라운 순간들이 삶의 재미를 더해주는 것 같아요!",
                    "깜짝 놀라셨나 봐요. 이런 예상치 못한 일들이 삶을 더 흥미롭게 만들어줘요!"
                ],
                "혐오": [
                    "불쾌한 일이 있었지만 이를 통해 더 나은 환경을 만들어갈 수 있어요. 긍정적으로 변화시켜봐요!",
                    "싫은 일이 있었지만 이를 계기로 더 좋은 것들을 찾아보세요. 화이팅!",
                    "불편한 상황이 있었지만 이를 극복하면 더 강해질 거예요. 응원해요!"
                ],
                "중성": [
                    "평온한 하루도 소중해요. 이런 일상이 쌓여 멋진 삶이 되는 거예요! 오늘도 수고하셨어요.",
                    "잔잔한 일상 속에서도 작은 행복을 찾아보세요. 화이팅! 내일도 좋은 하루가 될 거예요.",
                    "평범한 일상도 특별하게 만들 수 있어요. 이런 차분한 마음가짐이 좋아요!"
                ]
            },
            "analytical": {
                "기쁨": [
                    "긍정적인 감정이 주요하게 나타나고 있습니다. 이런 감정 상태가 전반적인 웰빙에 도움이 될 것으로 분석됩니다.",
                    "기쁨의 감정이 강하게 표출되고 있네요. 이런 감정 패턴이 지속되면 정신건강에 좋은 영향을 미칠 것 같습니다.",
                    "행복한 감정이 주된 톤으로 나타났습니다. 이런 긍정적 감정이 일상생활에 미치는 영향을 관찰해보세요."
                ],
                "슬픔": [
                    "부정적인 감정이 주요하게 나타나고 있습니다. 이런 감정의 원인을 파악하고 대처 방안을 모색해보는 것이 중요합니다.",
                    "슬픔의 감정이 강하게 표현되었네요. 이런 감정 패턴의 주기와 트리거를 분석해보시는 것이 도움이 될 것 같습니다.",
                    "우울한 감정이 주된 톤으로 분석됩니다. 이런 감정 상태의 지속 시간과 강도를 모니터링해보세요."
                ],
                "분노": [
                    "강한 분노의 감정이 나타나고 있습니다. 이런 감정의 트리거와 패턴을 분석해보는 것이 감정 관리에 도움이 될 것입니다.",
                    "화난 감정이 주요하게 표출되었네요. 이런 감정 반응의 원인과 대처 방법을 체계적으로 분석해보시면 좋겠습니다.",
                    "분노의 감정이 강하게 나타났습니다. 이런 감정을 건설적으로 활용하는 방법을 모색해보세요."
                ],
                "두려움": [
                    "불안과 두려움의 감정이 나타나고 있습니다. 이런 감정의 구체적 원인을 분석하고 대처 전략을 수립해보세요.",
                    "걱정과 두려움이 주요 감정으로 분석됩니다. 이런 감정 패턴의 빈도와 강도를 추적해보는 것이 도움이 될 것 같습니다.",
                    "불안한 감정이 주된 톤으로 나타났습니다. 이런 감정 상태의 관리 방법을 체계적으로 접근해보세요."
                ],
                "놀람": [
                    "놀라움과 당황의 감정이 나타나고 있습니다. 이런 예상치 못한 상황에 대한 적응 능력을 분석해보세요.",
                    "갑작스러운 변화에 대한 반응이 주요하게 나타났네요. 이런 상황에서의 대처 패턴을 관찰해보시면 좋겠습니다.",
                    "놀라운 감정이 주된 톤으로 분석됩니다. 이런 새로운 경험에 대한 수용 능력을 평가해보세요."
                ],
                "혐오": [
                    "혐오와 거부감의 감정이 나타나고 있습니다. 이런 감정의 원인과 대상을 구체적으로 분석해보는 것이 중요합니다.",
                    "불쾌한 감정이 주요하게 표출되었네요. 이런 감정 반응의 패턴과 대처 방법을 체계적으로 접근해보세요.",
                    "거부감의 감정이 강하게 나타났습니다. 이런 감정의 합리적 처리 방법을 모색해보시면 좋겠습니다."
                ],
                "중성": [
                    "중립적이고 안정적인 감정 상태가 주요하게 나타나고 있습니다. 이런 감정적 균형이 지속되는 것이 바람직합니다.",
                    "평온한 감정이 주된 톤으로 분석됩니다. 이런 감정적 안정감이 일상생활에 미치는 긍정적 영향을 관찰해보세요.",
                    "중성적인 감정 패턴이 나타났습니다. 이런 균형 잡힌 감정 상태를 유지하는 방법을 분석해보시면 좋겠습니다."
                ]
            }
        }
    
    def generate(self, text: str, primary_emotion: str, style: str) -> FeedbackResponse:
        """실제 감정과 스타일에 기반한 피드백 생성"""
        try:
            # 감정이 템플릿에 없으면 중성으로 대체
            if primary_emotion not in self.templates[style]:
                primary_emotion = "중성"
            
            # 피드백 선택 (텍스트 길이에 따라 다른 피드백 선택)
            feedback_options = self.templates[style][primary_emotion]
            
            # 텍스트 길이에 따른 피드백 선택 로직
            if len(text) > 100:
                # 긴 텍스트는 더 자세한 피드백
                selected_feedback = feedback_options[0]
            elif len(text) > 50:
                # 중간 길이는 적절한 피드백
                selected_feedback = feedback_options[1] if len(feedback_options) > 1 else feedback_options[0]
            else:
                # 짧은 텍스트는 간단한 피드백
                selected_feedback = feedback_options[-1]
            
            # 신뢰도 계산 (텍스트 길이와 감정 명확도에 따라)
            confidence = 0.7
            if len(text) > 50:
                confidence += 0.1
            if any(keyword in text.lower() for keywords in [
                ["행복", "기쁘", "좋"], ["슬프", "힘들"], ["화", "짜증"], 
                ["무서", "걱정"], ["놀라", "깜짝"], ["역겨", "싫"]
            ] for keyword in keywords):
                confidence += 0.1
            
            confidence = min(confidence, 0.95)
            
            return FeedbackResponse(
                feedback_text=selected_feedback,
                style=style,
                confidence=confidence
            )
            
        except Exception as e:
            logger.error(f"피드백 생성 중 오류: {e}")
            return FeedbackResponse(
                feedback_text="오늘 하루도 수고하셨어요. 일기를 쓰는 것만으로도 의미 있는 시간이었을 거예요.",
                style=style,
                confidence=0.7
            )

# 서비스 인스턴스 생성
emotion_analyzer = EmotionAnalyzer()
feedback_generator = FeedbackGenerator()
diary_converter = DiaryStyleConverter()

@app.get("/")
async def root():
    return {
        "message": "AI 감정 분석 및 피드백 서버",
        "status": "running",
        "port": 8001
    }

@app.options("/api/v1/emotion/analyze")
async def options_analyze_emotion():
    """감정 분석 API OPTIONS 핸들러"""
    return {"status": "ok"}

@app.post("/api/v1/emotion/analyze")
async def analyze_emotion(request: EmotionAnalysisRequest):
    """감정 분석 API"""
    try:
        if not request.text.strip():
            raise HTTPException(status_code=400, detail="텍스트가 비어있습니다.")
        
        result = emotion_analyzer.analyze(request.text)
        return result
        
    except Exception as e:
        logger.error(f"감정 분석 중 오류: {e}")
        raise HTTPException(status_code=500, detail="감정 분석 중 오류가 발생했습니다.")

@app.options("/api/v1/feedback/generate")
async def options_generate_feedback():
    """피드백 생성 API OPTIONS 핸들러"""
    return {"status": "ok"}

@app.post("/api/v1/feedback/generate")
async def generate_feedback(request: FeedbackRequest):
    """피드백 생성 API"""
    try:
        if not request.text.strip():
            raise HTTPException(status_code=400, detail="텍스트가 비어있습니다.")
        
        result = feedback_generator.generate(request.text, request.emotion, request.style)
        return result
        
    except Exception as e:
        logger.error(f"피드백 생성 중 오류: {e}")
        raise HTTPException(status_code=500, detail="피드백 생성 중 오류가 발생했습니다.")

@app.options("/api/v1/diary/convert")
async def options_convert_diary():
    """일기체 변환 API OPTIONS 핸들러"""
    return {"status": "ok"}

@app.post("/api/v1/diary/convert")
async def convert_to_diary_style(request: DiaryStyleRequest):
    """일기체 변환 API"""
    try:
        if not request.text.strip():
            raise HTTPException(status_code=400, detail="텍스트가 비어있습니다.")
        
        # 먼저 감정 분석을 수행하여 적절한 일기체 템플릿 선택
        emotion_result = emotion_analyzer.analyze(request.text)
        primary_emotion = emotion_result.primary_emotion
        
        # 일기체로 변환
        result = diary_converter.convert_to_diary_style(request.text, primary_emotion)
        return result
        
    except Exception as e:
        logger.error(f"일기체 변환 중 오류: {e}")
        raise HTTPException(status_code=500, detail="일기체 변환 중 오류가 발생했습니다.")

if __name__ == "__main__":
    uvicorn.run(
        "simple_main:app",
        host="0.0.0.0",
        port=8001,
        reload=True
    ) 