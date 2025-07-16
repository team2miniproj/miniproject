# 음성 인식 일기 백엔드 🎤📖

한국어 음성 인식 기반 일기 프로젝트의 **감정 분석 및 피드백 처리 API 서버**입니다.

## 프로젝트 개요

이 서버는 **다른 팀원이 STT로 처리하여 Firebase에 저장한 일기 데이터**를 읽어와서 감정 분석과 AI 피드백을 제공하는 역할을 담당합니다.

## 주요 기능

### 🤖 AI 모델 기반 감정 분석
- **KoBERT/KoELECTRA**: 한국어 텍스트 감정 분류
- **7가지 감정**: 기쁨, 슬픔, 분노, 두려움, 놀람, 혐오, 중성
- **Firebase 연동**: 저장된 일기 데이터 실시간 감정 분석

### 💬 KoGPT 공감 피드백
- **3가지 피드백 스타일**: 공감형, 격려형, 분석형
- **감정 기반 맞춤 피드백**: 분석된 감정에 따른 개인화된 응답
- **자연스러운 한국어**: KoGPT2 기반 자연스러운 텍스트 생성

### 📊 감정 통계 및 인사이트
- **기간별 통계**: 일/주/월/년 단위 감정 분포 분석
- **감정 추세 분석**: 시간에 따른 감정 변화 패턴 추적
- **개인화된 인사이트**: 감정 패턴 기반 추천사항 제공

### 🔥 Firebase 기반 일기 처리
- **일기 데이터 읽기**: Firebase에서 저장된 일기 데이터 조회
- **감정 분석 처리**: 개별 또는 일괄 감정 분석 수행
- **피드백 생성**: 분석된 감정 기반 AI 피드백 생성
- **결과 저장**: 분석 결과를 Firebase에 저장

## 기술 스택

### 백엔드 프레임워크
- **FastAPI**: 고성능 비동기 웹 프레임워크
- **Uvicorn**: ASGI 서버

### AI/ML 모델
- **KoBERT**: 한국어 BERT 기반 감정 분류
- **KoELECTRA**: 한국어 ELECTRA 기반 감정 분류  
- **KoGPT2**: 한국어 GPT 기반 텍스트 생성

### 데이터베이스
- **Firebase Firestore**: NoSQL 문서 데이터베이스
- **Firebase Admin SDK**: Python Firebase 연동

### 기타
- **Pydantic**: 데이터 검증 및 설정 관리
- **Transformers**: Hugging Face 모델 라이브러리
- **PyTorch**: 딥러닝 프레임워크

## 설치 및 실행

### 1. 의존성 설치
```bash
pip install -r requirements.txt
```

### 2. Firebase 설정
Firebase 프로젝트를 생성하고 서비스 계정 키를 다운로드하세요:

1. [Firebase Console](https://console.firebase.google.com/)에서 프로젝트 생성
2. 프로젝트 설정 → 서비스 계정 → 새 비공개 키 생성
3. 다운로드한 JSON 파일을 `firebase-credentials.json`로 저장

### 3. 환경 변수 설정
`.env` 파일을 생성하고 다음 변수들을 설정하세요:
```env
# Firebase 설정
FIREBASE_CREDENTIALS_PATH=firebase-credentials.json
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_DATABASE_URL=https://your-project-id-default-rtdb.firebaseio.com/

# 서버 설정
DEBUG=true
TEST_MODE=false

# CORS 설정
CORS_ORIGINS=["*"]

# AI API 키 (선택사항)
OPENAI_API_KEY=your_openai_api_key_here
GROQ_API_KEY=your_groq_api_key_here
```

### 4. 서버 실행
```bash
python main.py
```

또는

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## API 문서

서버 실행 후 다음 URL에서 API 문서를 확인할 수 있습니다:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## API 엔드포인트

### 감정 분석 API (`/api/v1/emotion/`)
- `POST /analyze`: 텍스트 감정 분석
- `POST /analyze-with-model`: 모델 선택 감정 분석
- `GET /history/{user_id}`: 사용자 감정 분석 이력

### 피드백 생성 API (`/api/v1/feedback/`)
- `POST /generate`: 공감 피드백 생성
- `GET /history/{user_id}`: 사용자 피드백 이력
- `GET /styles`: 피드백 스타일 목록

### 일기 처리 API (`/api/v1/diary/`) 🔥 **신규 Firebase 기반**
- `POST /process/{diary_id}`: 특정 일기 감정분석 및 피드백 처리
- `POST /batch-process`: 일기 일괄 처리 (미처리 일기 감정분석)
- `GET /analysis/{diary_id}`: 일기 분석 결과 조회
- `GET /user-analyses/{user_id}`: 사용자 분석 결과 목록

### 통계 분석 API (`/api/v1/statistics/`)
- `GET /emotion/{user_id}`: 감정 통계 조회
- `GET /insights/{user_id}`: 감정 인사이트
- `GET /dashboard/{user_id}`: 감정 대시보드
- `GET /emotion-mapping`: 감정 매핑 정보

## 🔄 새로운 워크플로우

1. **다른 팀원이 STT 처리**: 음성 → 텍스트 변환 후 Firebase에 저장
2. **이 API 호출**: 저장된 일기 데이터 감정분석 및 피드백 생성
3. **결과 저장**: 분석 결과를 Firebase에 저장
4. **프론트엔드 연동**: 분석 결과를 사용자에게 표시

## 📊 Firebase 데이터 구조

### `diaries` 컬렉션 (다른 팀원이 저장)
```json
{
  "user_id": "user_123",
  "content": "오늘은 정말 행복한 하루였다!",
  "created_at": "2024-01-15T10:30:00Z",
  "is_processed": false
}
```

### `diary_analyses` 컬렉션 (이 API가 저장)
```json
{
  "diary_id": "diary_123",
  "user_id": "user_123",
  "emotion_analysis": {
    "primary_emotion": "기쁨",
    "primary_emotion_score": 0.85,
    "primary_emotion_emoji": "😊",
    "all_emotions": [...],
    "confidence": 0.85,
    "model_used": "kobert"
  },
  "ai_feedback": {
    "feedback_text": "정말 행복한 하루를 보내셨네요!",
    "style": "empathetic",
    "confidence": 0.92,
    "model_used": "kogpt2"
  },
  "processed_at": "2024-01-15T10:35:00Z"
}
```

### 주요 API 사용 예시

```bash
# 특정 일기 처리
POST /api/v1/diary/process/diary_id_123?generate_feedback=true&feedback_style=empathetic

# 사용자 미처리 일기 일괄 처리
POST /api/v1/diary/batch-process?user_id=user_123&limit=10&unprocessed_only=true

# 분석 결과 조회
GET /api/v1/diary/analysis/diary_id_123
```

## 테스트

```bash
pytest tests/
```

## 프로젝트 구조

```
backendB/
├── main.py                 # FastAPI 애플리케이션 진입점
├── requirements.txt        # 패키지 의존성
├── README.md              # 프로젝트 문서
├── config/                # 설정 관리
│   ├── __init__.py
│   ├── settings.py        # 애플리케이션 설정
│   ├── database.py        # Firebase 연결 관리
│   └── exceptions.py      # 전역 예외 처리
├── models/                # 데이터 모델
│   ├── __init__.py
│   ├── user.py           # 사용자 모델
│   ├── emotion.py        # 감정 분석 모델
│   ├── diary.py          # 일기 모델
│   ├── feedback.py       # 피드백 모델
│   └── statistics.py     # 통계 모델
├── services/              # 비즈니스 로직
│   ├── __init__.py
│   ├── emotion_classifier.py    # 감정 분류 서비스
│   ├── emotion_service.py       # 감정 분석 서비스
│   ├── emotion_mapping.py       # 감정-이모지 매핑
│   ├── feedback_generator.py    # KoGPT 피드백 생성
│   ├── feedback_service.py      # 피드백 서비스
│   └── statistics_service.py    # 통계 분석 서비스
├── routers/               # API 라우터
│   ├── __init__.py
│   ├── emotion.py        # 감정 분석 API
│   ├── diary.py          # 일기 처리 API (Firebase 기반)
│   ├── feedback.py       # 피드백 생성 API
│   └── statistics.py     # 통계 분석 API
└── tests/                 # 테스트
    ├── __init__.py
    └── test_main.py       # 메인 API 테스트
```

## 👥 팀 개발 가이드

### 📋 코딩 컨벤션
- **변수명/함수명**: snake_case
- **클래스명**: PascalCase
- **상수명**: UPPER_SNAKE_CASE
- **주석**: 한국어로 작성
- **에러 메시지**: 한국어로 작성

### 🛠️ 개발 환경 설정
```bash
# 개발 의존성 설치
make install-dev

# 개발 도구 설정
make pre-commit

# 코드 포맷팅
make format

# 코드 품질 검사
make lint

# 테스트 실행
make test
```

### 📚 참고 문서
- **코딩 컨벤션**: [CODING_CONVENTION.md](./CODING_CONVENTION.md)
- **팀 설정 가이드**: [TEAM_SETUP.md](./TEAM_SETUP.md)

### 🔧 개발 도구
- **Black**: 코드 포맷터
- **isort**: Import 정렬
- **flake8**: 코드 품질 검사
- **mypy**: 타입 검사
- **pytest**: 테스트 프레임워크
- **pre-commit**: 커밋 전 자동 검사

## 개발 상태

✅ **완료된 기능**
- FastAPI 프로젝트 기본 구조 설정
- 환경 설정 및 Firebase 연결
- 데이터 모델 정의 (Pydantic)
- KoBERT/KoELECTRA 감정 분류 서비스
- 감정-이모지 매핑 시스템
- KoGPT 공감 피드백 생성 서비스
- 감정 분석 API 엔드포인트
- Firebase 기반 일기 처리 API (감정분석 + 피드백)
- 피드백 생성 API 엔드포인트
- 일기 저장 API 엔드포인트
- 감정 통계 분석 서비스
- 통계 조회 API 엔드포인트
- 전역 예외 처리
- API 문서화
- 기본 테스트 환경

## 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 기여

프로젝트에 기여하고 싶으시다면 다음 단계를 따라주세요:

1. 이 저장소를 포크합니다
2. 새로운 기능 브랜치를 생성합니다 (`git checkout -b feature/새기능`)
3. 변경사항을 커밋합니다 (`git commit -am '새 기능 추가'`)
4. 브랜치에 푸시합니다 (`git push origin feature/새기능`)
5. Pull Request를 생성합니다

## 연락처

프로젝트 관련 문의사항이 있으시면 언제든 연락해주세요. 