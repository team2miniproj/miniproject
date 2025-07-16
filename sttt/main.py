from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
import tempfile
import whisper
import librosa
import soundfile as sf
import logging
import uvicorn
import numpy as np
import torch

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="STT 서버", description="음성을 텍스트로 변환하는 API (OpenAI Whisper)", version="2.0.0")

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Whisper 모델 로드 (전역 변수)
whisper_model = None

def load_whisper_model():
    """OpenAI Whisper 모델 로드 (패딩 문제 없음)"""
    global whisper_model
    try:
        logger.info("OpenAI Whisper 모델을 로드하는 중...")
        
        # GPU 사용 가능 여부 확인
        device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info(f"사용 중인 디바이스: {device}")
        
        # Whisper 모델 로드 (tiny 모델 - 빠르고 안정적)
        whisper_model = whisper.load_model("tiny", device=device)
        
        logger.info("OpenAI Whisper 모델 로드 완료!")
        return True
    except Exception as e:
        logger.error(f"Whisper 모델 로드 실패: {e}")
        return False

def preprocess_audio_simple(audio_data):
    """간단한 오디오 전처리"""
    try:
        # 임시 파일에 오디오 데이터 저장
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_file:
            temp_file.write(audio_data)
            temp_file_path = temp_file.name
        
        try:
            # 오디오 로드 및 기본 전처리
            audio, sr = librosa.load(temp_file_path, sr=16000)
            
            # 기본 정보 로깅
            duration = len(audio) / sr
            logger.info(f"오디오 길이: {duration:.2f}초")
            
            # 너무 짧은 오디오 처리
            if duration < 0.1:
                logger.warning("오디오가 너무 짧습니다. 0.5초로 패딩합니다.")
                target_length = int(0.5 * sr)
                audio = np.pad(audio, (0, max(0, target_length - len(audio))), 'constant')
            
            # 너무 긴 오디오 처리 (30초로 제한)
            if duration > 30:
                audio = audio[:30*sr]
                logger.info("오디오를 30초로 자름")
            
            # 볼륨 정규화
            if np.max(np.abs(audio)) > 0:
                audio = audio / np.max(np.abs(audio)) * 0.95
            
            # 처리된 오디오 저장
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as processed_temp:
                sf.write(processed_temp.name, audio, sr)
                processed_path = processed_temp.name
            
            # 원본 임시 파일 삭제
            os.unlink(temp_file_path)
            
            logger.info(f"오디오 전처리 완료: {len(audio)/sr:.2f}초")
            return processed_path
            
        except Exception as preprocessing_error:
            logger.error(f"오디오 전처리 실패: {preprocessing_error}")
            return temp_file_path
            
    except Exception as e:
        logger.error(f"오디오 전처리 중 오류: {e}")
        return None

def transcribe_audio(audio_file_path):
    """OpenAI Whisper로 음성 인식 (패딩 문제 없음)"""
    try:
        if whisper_model is None:
            return "Whisper 모델이 로드되지 않았습니다."
        
        # 파일 크기 확인
        file_size = os.path.getsize(audio_file_path)
        logger.info(f"음성 인식할 파일 크기: {file_size} bytes")
        
        if file_size < 1000:
            return "오디오 파일이 너무 작습니다. 더 길게 녹음해주세요."
        
        if file_size > 25 * 1024 * 1024:  # 25MB 제한
            return "오디오 파일이 너무 큽니다. 더 짧게 녹음해주세요."
        
        # OpenAI Whisper로 음성 인식
        logger.info("OpenAI Whisper로 음성 인식 시작...")
        
        # 옵션 설정
        options = {
            "language": "ko",  # 한국어 설정
            "task": "transcribe",
            "fp16": torch.cuda.is_available(),  # GPU 사용 시 fp16 활성화
            "no_speech_threshold": 0.6,
            "logprob_threshold": -1.0,
            "condition_on_previous_text": False,  # 이전 텍스트 조건 비활성화
            "initial_prompt": None,
            "word_timestamps": False
        }
        
        # 음성 인식 실행
        result = whisper_model.transcribe(audio_file_path, **options)
        
        # 결과 텍스트 추출
        text = result.get("text", "").strip()
        
        if text:
            logger.info(f"음성 인식 성공: {text}")
            return text
        else:
            logger.warning("음성 인식 결과가 비어있습니다.")
            return "음성을 인식할 수 없습니다. 더 명확하게 말씀해주세요."
            
    except Exception as e:
        logger.error(f"음성 인식 실패: {e}")
        return "음성 인식 중 오류가 발생했습니다. 다시 시도해주세요."

@app.get("/")
async def root():
    """메인 페이지"""
    return {
        'message': 'STT 서버가 실행 중입니다!',
        'model': 'OpenAI Whisper (패딩 문제 완전 해결)',
        'version': '2.0.0',
        'status': 'ready' if whisper_model else 'loading',
        'docs': '/docs'
    }

@app.get("/health")
async def health_check():
    """서버 상태 확인"""
    return {
        'status': 'healthy',
        'model_loaded': whisper_model is not None,
        'device': 'cuda' if torch.cuda.is_available() else 'cpu'
    }

@app.post("/api/speech-to-text")
async def convert_speech(audio: UploadFile = File(...)):
    """음성을 텍스트로 변환하는 API (OpenAI Whisper 사용)"""
    try:
        # 모델 로드 확인
        if whisper_model is None:
            raise HTTPException(
                status_code=503, 
                detail="Whisper 모델이 아직 로드되지 않았습니다. 잠시 후 다시 시도해주세요."
            )
        
        # 파일 검증
        if not audio.filename:
            raise HTTPException(status_code=400, detail="파일이 선택되지 않았습니다.")
        
        logger.info(f"음성 파일 수신: {audio.filename}")
        
        # 오디오 데이터 읽기
        audio_data = await audio.read()
        
        # 오디오 전처리
        processed_audio_path = preprocess_audio_simple(audio_data)
        if processed_audio_path is None:
            raise HTTPException(status_code=400, detail="오디오 전처리 실패")
        
        try:
            # 음성 인식 실행
            text = transcribe_audio(processed_audio_path)
            
            return {
                'success': True,
                'text': text,
                'message': '음성 변환이 완료되었습니다.'
            }
            
        finally:
            # 임시 파일 정리
            if os.path.exists(processed_audio_path):
                os.unlink(processed_audio_path)
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"API 오류: {e}")
        return JSONResponse(
            status_code=500,
            content={
                'success': False,
                'text': '',
                'message': f'서버 오류가 발생했습니다: {str(e)}'
            }
        )

# 서버 시작 시 모델 로드
@app.on_event("startup")
async def startup_event():
    """서버 시작 시 실행"""
    logger.info("=" * 50)
    logger.info("STT 서버 시작 중...")
    logger.info("OpenAI Whisper 사용 (패딩 문제 해결)")
    logger.info("=" * 50)
    
    success = load_whisper_model()
    if not success:
        logger.error("❌ Whisper 모델 로드 실패!")
        logger.error("서버는 시작되지만 STT 기능을 사용할 수 없습니다.")
    else:
        logger.info("✅ Whisper 모델 로드 완료!")
        logger.info("서버 준비 완료!")
    
    logger.info("=" * 50)
    logger.info("서버 주소: http://localhost:8000")
    logger.info("API 엔드포인트: /api/speech-to-text")
    logger.info("API 문서: http://localhost:8000/docs")
    logger.info("=" * 50)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
