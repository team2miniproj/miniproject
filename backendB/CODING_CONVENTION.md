# 음성 인식 일기 프로젝트 - 코딩 컨벤션

## 1. 네이밍 컨벤션

### 1.1 변수명 및 함수명
- **snake_case** 사용
- 의미가 명확한 단어 사용
- 줄임말 지양 (단, 일반적으로 사용되는 것은 예외)

```python
# Good
user_id = "user123"
emotion_analysis_result = analyze_emotion()
db_connection = get_database_connection()

# Bad
usrId = "user123"
emotionAnalysisResult = analyze_emotion()
dbConn = get_database_connection()
```

### 1.2 클래스명
- **PascalCase** 사용
- 명사 형태로 작성

```python
# Good
class EmotionAnalysisService:
    pass

class DatabaseManager:
    pass

# Bad
class emotionAnalysisService:
    pass
```

### 1.3 상수명
- **UPPER_SNAKE_CASE** 사용

```python
# Good
API_VERSION = "1.0.0"
MAX_RETRY_COUNT = 3
DEFAULT_EMOTION_MODEL = "kobert"
```

### 1.4 파일명 및 디렉토리명
- **snake_case** 사용
- 모듈명은 간결하고 명확하게

```
# Good
emotion_service.py
feedback_generator.py
statistics_service.py

# Bad
emotionService.py
feedbackGen.py
```

## 2. 주석 및 문서화

### 2.1 주석 언어
- **한국어**로 통일
- 코드의 의도와 복잡한 로직 설명

```python
# Good
# 사용자의 감정 분석 이력을 조회합니다
def get_user_emotion_history(user_id: str):
    pass

# Bad
# Get user emotion history
def get_user_emotion_history(user_id: str):
    pass
```

### 2.2 Docstring
- **한국어**로 작성
- Args, Returns, Raises 명시

```python
def analyze_emotion(text: str, model_type: str = "kobert") -> EmotionAnalysisResponse:
    """
    텍스트의 감정을 분석합니다.
    
    Args:
        text: 분석할 텍스트
        model_type: 사용할 모델 ("kobert" or "koelectra")
    
    Returns:
        EmotionAnalysisResponse: 감정 분석 결과
    
    Raises:
        ValueError: 지원하지 않는 모델 타입인 경우
        HTTPException: 분석 중 오류 발생 시
    """
```

## 3. 코드 스타일

### 3.1 Import 정리
- 표준 라이브러리 → 서드파티 → 로컬 모듈 순서
- 각 그룹 사이에 빈 줄 추가

```python
# 표준 라이브러리
from typing import Dict, Any, Optional
import logging
from datetime import datetime

# 서드파티 라이브러리
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

# 로컬 모듈
from models.emotion import EmotionAnalysisRequest
from services.emotion_service import emotion_service
```

### 3.2 라인 길이
- 최대 88자 (Black 기본값)
- 긴 라인은 적절히 분할

### 3.3 함수 및 클래스
- 함수 사이에 2줄 공백
- 클래스 사이에 2줄 공백
- 메서드 사이에 1줄 공백

## 4. 에러 처리

### 4.1 예외 메시지
- **한국어**로 작성
- 사용자 친화적인 메시지

```python
# Good
raise HTTPException(status_code=400, detail="텍스트를 입력해주세요.")
raise ValueError("지원하지 않는 모델 타입입니다.")

# Bad
raise HTTPException(status_code=400, detail="Text is required.")
raise ValueError("Invalid model type.")
```

### 4.2 로깅
- **한국어**로 작성
- 일관된 로깅 레벨 사용

```python
# Good
logger.info(f"감정 분석 완료: {result.primary_emotion}")
logger.error(f"데이터베이스 연결 실패: {e}")

# Bad
logger.info(f"Emotion analysis completed: {result.primary_emotion}")
logger.error(f"Database connection failed: {e}")
```

## 5. 타입 힌트

### 5.1 모든 함수에 타입 힌트 추가
```python
# Good
def analyze_emotion(text: str, user_id: str) -> EmotionAnalysisResponse:
    pass

async def save_diary_entry(diary: DiaryEntry) -> str:
    pass

# Bad
def analyze_emotion(text, user_id):
    pass
```

### 5.2 복잡한 타입은 별도 정의
```python
from typing import Dict, List, Optional, Union

# Good
EmotionScores = Dict[str, float]
UserHistory = List[EmotionAnalysisResult]

def get_emotion_scores(text: str) -> EmotionScores:
    pass
```

## 6. 데이터베이스 관련

### 6.1 컬렉션/테이블명
- **snake_case** 사용
- 복수형 사용

```python
# Good
collection_name = "emotion_analyses"
collection_name = "diary_entries"

# Bad
collection_name = "emotionAnalysis"
collection_name = "diary_entry"
```

### 6.2 필드명
- **snake_case** 사용
- 명확한 의미 전달

```python
# Good
{
    "user_id": "user123",
    "analyzed_at": datetime.utcnow(),
    "primary_emotion": "joy"
}

# Bad
{
    "userId": "user123",
    "analyzedAt": datetime.utcnow(),
    "primaryEmotion": "joy"
}
```

## 7. API 설계

### 7.1 엔드포인트 네이밍
- **kebab-case** 사용 (URL에서)
- RESTful 원칙 준수

```python
# Good
@router.post("/analyze")
@router.get("/history/{user_id}")
@router.post("/analyze-with-model")

# Bad
@router.post("/analyzeEmotion")
@router.get("/getHistory/{userId}")
```

### 7.2 응답 형식
- 일관된 응답 구조
- 에러 메시지는 한국어

```python
# Good
{
    "status": "success",
    "data": {...},
    "message": "감정 분석이 완료되었습니다."
}

# 에러 응답
{
    "status": "error",
    "error_code": "INVALID_INPUT",
    "message": "텍스트를 입력해주세요."
}
```

## 8. 개발 도구 설정

### 8.1 권장 도구
- **Black**: 코드 포맷터
- **isort**: Import 정리
- **flake8**: 린터
- **mypy**: 타입 체크

### 8.2 pre-commit 설정
```yaml
repos:
  - repo: https://github.com/psf/black
    rev: 22.3.0
    hooks:
      - id: black
        language_version: python3.9

  - repo: https://github.com/pycqa/isort
    rev: 5.10.1
    hooks:
      - id: isort
```

## 9. 커밋 메시지

### 9.1 커밋 메시지 형식
```
타입: 간단한 설명

상세한 설명 (필요한 경우)
```

### 9.2 타입 분류
- `feat`: 새로운 기능 추가
- `fix`: 버그 수정
- `docs`: 문서 수정
- `style`: 코드 포맷팅
- `refactor`: 코드 리팩토링
- `test`: 테스트 코드 추가/수정

### 9.3 예시
```
feat: 감정 분석 API 엔드포인트 추가

KoBERT 모델을 사용하여 텍스트 감정 분석 기능을 구현했습니다.
- 7가지 감정 분류 지원
- 신뢰도 점수 포함
- 사용자별 이력 관리
```

## 10. 팀 협업 규칙

### 10.1 브랜치 전략
- `main`: 배포 가능한 상태
- `develop`: 개발 브랜치
- `feature/기능명`: 기능 개발 브랜치
- `hotfix/이슈명`: 긴급 수정 브랜치

### 10.2 PR 리뷰 규칙
- 모든 코드는 리뷰 후 병합
- 최소 1명의 승인 필요
- 테스트 통과 확인
- 컨벤션 준수 확인

### 10.3 코드 리뷰 체크리스트
- [ ] 네이밍 컨벤션 준수
- [ ] 주석 및 문서화 적절성
- [ ] 에러 처리 적절성
- [ ] 타입 힌트 사용
- [ ] 테스트 코드 작성
- [ ] 성능 고려사항 검토 