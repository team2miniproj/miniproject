.PHONY: install install-dev format lint test clean run help

# 기본 도움말
help:
	@echo "음성 인식 일기 프로젝트 - 개발 명령어"
	@echo ""
	@echo "사용법:"
	@echo "  make install     - 프로덕션 의존성 설치"
	@echo "  make install-dev - 개발 의존성 설치"
	@echo "  make format      - 코드 포맷팅 (black, isort)"
	@echo "  make lint        - 코드 품질 검사 (flake8, mypy)"
	@echo "  make test        - 테스트 실행"
	@echo "  make run         - 개발 서버 실행"
	@echo "  make clean       - 임시 파일 정리"
	@echo "  make pre-commit  - pre-commit 훅 설치"

# 의존성 설치
install:
	pip install -r requirements.txt

install-dev:
	pip install -r requirements.txt
	pip install -r requirements-dev.txt

# 코드 포맷팅
format:
	@echo "코드 포맷팅 중..."
	black .
	isort .
	@echo "포맷팅 완료!"

# 코드 품질 검사
lint:
	@echo "코드 품질 검사 중..."
	flake8 .
	mypy .
	@echo "검사 완료!"

# 테스트 실행
test:
	@echo "테스트 실행 중..."
	pytest tests/ -v --cov=. --cov-report=html
	@echo "테스트 완료!"

# 개발 서버 실행
run:
	@echo "개발 서버 시작 중..."
	python main.py

# 임시 파일 정리
clean:
	@echo "임시 파일 정리 중..."
	find . -type f -name "*.pyc" -delete
	find . -type d -name "__pycache__" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} +
	find . -type d -name ".pytest_cache" -exec rm -rf {} +
	find . -type d -name ".mypy_cache" -exec rm -rf {} +
	find . -type d -name "htmlcov" -exec rm -rf {} +
	@echo "정리 완료!"

# pre-commit 훅 설치
pre-commit:
	@echo "pre-commit 훅 설치 중..."
	pre-commit install
	@echo "pre-commit 훅 설치 완료!"

# 모든 검사 실행
check: format lint test
	@echo "모든 검사 완료!" 