# 팀 개발 환경 설정 가이드

## 🚀 시작하기

### 1. 개발 환경 설정

```bash
# 1. 저장소 클론
git clone <repository-url>
cd backendB

# 2. 가상환경 생성 및 활성화
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate  # Windows

# 3. 개발 의존성 설치
make install-dev
# 또는
pip install -r requirements.txt
pip install -r requirements-dev.txt

# 4. pre-commit 훅 설치
make pre-commit
# 또는
pre-commit install
```

### 2. 개발 도구 사용법

#### 코드 포맷팅
```bash
# 코드 자동 포맷팅
make format

# 개별 도구 사용
black .          # 코드 포맷팅
isort .          # import 문 정렬
```

#### 코드 품질 검사
```bash
# 코드 품질 검사
make lint

# 개별 도구 사용
flake8 .         # 코드 스타일 검사
mypy .           # 타입 검사
```

#### 테스트 실행
```bash
# 테스트 실행
make test

# 개별 테스트 실행
pytest tests/test_emotion_api.py -v
```

#### 개발 서버 실행
```bash
# 개발 서버 시작
make run

# 또는
python main.py
```

## 📋 개발 워크플로우

### 1. 새 기능 개발 시

```bash
# 1. 최신 코드 가져오기
git checkout main
git pull origin main

# 2. 새 브랜치 생성
git checkout -b feature/새로운-기능명

# 3. 개발 진행
# ... 코드 작성 ...

# 4. 커밋 전 검사
make format  # 코드 포맷팅
make lint    # 코드 품질 검사
make test    # 테스트 실행

# 5. 커밋 (pre-commit 훅이 자동으로 검사)
git add .
git commit -m "feat: 새로운 기능 추가"

# 6. 푸시 및 PR 생성
git push origin feature/새로운-기능명
```

### 2. 코드 리뷰 체크리스트

리뷰어는 다음 사항들을 확인해주세요:

- [ ] **네이밍 컨벤션**: snake_case, PascalCase 규칙 준수
- [ ] **주석**: 한국어로 작성, 복잡한 로직 설명
- [ ] **타입 힌트**: 모든 함수에 타입 힌트 추가
- [ ] **에러 처리**: 적절한 예외 처리 및 한국어 메시지
- [ ] **테스트**: 새로운 기능에 대한 테스트 코드 작성
- [ ] **문서화**: docstring 작성 및 필요시 README 업데이트

### 3. 브랜치 전략

```
main
├── develop
│   ├── feature/감정분석-api
│   ├── feature/피드백-생성
│   └── feature/통계-차트
├── hotfix/긴급수정
└── release/v1.0.0
```

## 🛠️ IDE 설정

### VS Code 설정 (추천)

`.vscode/settings.json`:
```json
{
    "python.formatting.provider": "black",
    "python.linting.enabled": true,
    "python.linting.flake8Enabled": true,
    "python.linting.mypyEnabled": true,
    "python.sortImports.args": ["--profile", "black"],
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
        "source.organizeImports": true
    },
    "python.linting.flake8Args": [
        "--max-line-length=88",
        "--extend-ignore=E203,E266,E501,W503"
    ]
}
```

### PyCharm 설정

1. **File → Settings → Tools → External Tools**
   - Black 설정
   - isort 설정

2. **File → Settings → Editor → Code Style → Python**
   - Line length: 88
   - Import 정렬 설정

## 🔧 트러블슈팅

### 자주 발생하는 문제들

#### 1. pre-commit 훅 실패
```bash
# pre-commit 훅 재설치
pre-commit uninstall
pre-commit install

# 모든 파일에 대해 훅 실행
pre-commit run --all-files
```

#### 2. 타입 검사 오류
```bash
# mypy 캐시 정리
rm -rf .mypy_cache
mypy .
```

#### 3. 코드 포맷팅 충돌
```bash
# 포맷팅 다시 적용
black .
isort .
```

#### 4. 테스트 실패
```bash
# 테스트 캐시 정리
rm -rf .pytest_cache
pytest tests/ -v
```

## 📚 참고 자료

### 코딩 스타일 가이드
- [PEP 8](https://www.python.org/dev/peps/pep-0008/)
- [Black 문서](https://black.readthedocs.io/)
- [isort 문서](https://pycqa.github.io/isort/)

### 타입 힌트
- [Python 타입 힌트 가이드](https://docs.python.org/3/library/typing.html)
- [mypy 문서](https://mypy.readthedocs.io/)

### 테스트
- [pytest 문서](https://docs.pytest.org/)
- [FastAPI 테스트 가이드](https://fastapi.tiangolo.com/tutorial/testing/)

## 📞 도움 요청

문제가 발생했을 때:

1. **먼저 확인**: 이 가이드의 트러블슈팅 섹션
2. **팀 채널**: 개발팀 슬랙/디스코드 채널에 질문
3. **Issue 생성**: GitHub Issues에 버그 리포트 또는 기능 요청

---

**⚡ 꿀팁**: `make help` 명령어로 사용 가능한 모든 명령어를 확인할 수 있습니다! 