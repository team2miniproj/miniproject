import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Headphones, PenTool, Brain, AlertTriangle, CheckCircle2, Loader2, Edit3 } from 'lucide-react';
import GameLoading from '@/components/GameLoading';

interface ProcessStep {
  status: 'waiting' | 'processing' | 'completed' | 'error';
  error?: string;
}

interface LocationState {
  text?: string;
  audioFile?: string;
}

export default function DiaryGeneration() {
  const navigate = useNavigate();
  const location = useLocation();
  const { text: stateText, audioFile } = location.state as LocationState || {};
  const selectedDate = localStorage.getItem("selectedDate"); // 선택된 날짜 확인
  const [dots, setDots] = useState('');
  const [fadeClass, setFadeClass] = useState('opacity-100');
  
        const [steps, setSteps] = useState<ProcessStep[]>([
        { status: 'waiting' }, // STT
        { status: 'waiting' }, // 만화 생성
        { status: 'waiting' }, // 일기체 변환
        { status: 'waiting' }, // 감정 분석
      ]);

  // text 우선순위: state로 받은 text > localStorage의 transcribedText
  const text = stateText || localStorage.getItem('transcribedText') || '';

  const dotsRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!audioFile && !text) {
      navigate('/');
      return;
    }

    startProcessing();

    // 점 애니메이션 시작
    dotsRef.current = setInterval(() => {
      setDots(prev => prev === '...' ? '' : prev + '.');
    }, 500);

    return () => {
      if (dotsRef.current) clearInterval(dotsRef.current);
    };
  }, [audioFile, text, navigate]);

  const updateStepStatus = (index: number, status: ProcessStep['status'], error?: string) => {
    setSteps(prev => prev.map((step, i) => 
      i === index ? { ...step, status, error } : step
    ));
  };

  const startProcessing = async () => {
    try {
      const start = Date.now();
      const userId = localStorage.getItem('userId') || 'default';
      
      // 1. STT 처리 (이미 Recording에서 완료됨)
      updateStepStatus(0, 'processing');
      if (!text) {
        throw new Error('음성 변환 텍스트를 찾을 수 없습니다.');
      }
      updateStepStatus(0, 'completed');
      localStorage.setItem("transcribedText", text);

      // 2. 만화 생성
      const comicResponse = await fetch('http://localhost:8002/api/diary-comic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          raw_text: text,
          user_name: '나', // 또는 사용자 입력값
          gender: 'male'   // 또는 사용자 입력값
        }),
      });
      console.log("comicResponse", comicResponse);
      
      if (!comicResponse.ok) {
        const errorData = await comicResponse.json().catch(() => ({}));
        throw new Error(errorData.detail || '만화 생성 실패');
      }
      
      const comicResult = await comicResponse.json();
      if (!comicResult.success || !comicResult.comic_image_url) {
        throw new Error(comicResult.message || '만화 생성 실패');
      }
      
      // comicResult.diary_text, comicResult.comic_image_url 사용
      localStorage.setItem("diaryText", comicResult.diary_text);
      
      const processedComicResult = {
        images: [comicResult.comic_image_url],
        generated_text: comicResult.diary_text // 필요에 따라
      };
      
      updateStepStatus(1, 'completed');
      localStorage.setItem("comicData", JSON.stringify(processedComicResult));

      // 3. 일기체 변환
      updateStepStatus(2, 'processing');
      const diaryResponse = await fetch('http://localhost:8001/api/v1/diary/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          user_id: userId
        }),
      });

      if (!diaryResponse.ok) {
        const errorData = await diaryResponse.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || '일기체 변환 실패');
      }

      const diaryResult = await diaryResponse.json();
      if (!diaryResult.diary_text) {
        throw new Error('일기체 변환 결과가 없습니다.');
      }
      
      updateStepStatus(2, 'completed');
      localStorage.setItem("diaryText", diaryResult.diary_text);

      // 4. 감정 분석
      updateStepStatus(3, 'processing');
      
      // 감정 분석 요청 (simple_main.py 스펙) - 일기체 변환된 텍스트 사용
      const emotionResponse = await fetch('http://localhost:8001/api/v1/emotion/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: diaryResult.diary_text, // 일기체 변환된 텍스트 사용
          user_id: userId
        }),
      });

      if (!emotionResponse.ok) {
        const errorData = await emotionResponse.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || '감정분석 실패');
      }

      const emotionResult = await emotionResponse.json();
      if (!emotionResult.primary_emotion) {
        throw new Error('감정 분석 결과가 없습니다.');
      }

      // 피드백 생성 요청 (simple_main.py 스펙) - 일기체 변환된 텍스트 사용
      const feedbackResponse = await fetch('http://localhost:8001/api/v1/feedback/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: diaryResult.diary_text, // 일기체 변환된 텍스트 사용
          emotion: emotionResult.primary_emotion,
          style: 'empathetic',
          user_id: userId
        }),
      });

      if (!feedbackResponse.ok) {
        const errorData = await feedbackResponse.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || '피드백 생성 실패');
      }

      const feedbackResult = await feedbackResponse.json();
      if (!feedbackResult.feedback_text) {
        throw new Error('피드백 생성 결과가 없습니다.');
      }

      updateStepStatus(2, 'completed');

      // 모든 처리가 완료되면 결과 페이지로 이동
      // 선택된 감정 정보도 analysisResult에 포함
      let selectedEmotion = null;
      try {
        selectedEmotion = JSON.parse(localStorage.getItem('selectedEmotion') || 'null');
      } catch {}
      const analysisResult = {
        emotion_analysis: {
          primary_emotion: emotionResult.primary_emotion,
          primary_emotion_score: emotionResult.primary_emotion_score,
          primary_emotion_emoji: emotionResult.primary_emotion_emoji,
          all_emotions: emotionResult.all_emotions,
          confidence: emotionResult.confidence
        },
        ai_feedback: {
          feedback_text: feedbackResult.feedback_text,
          style: feedbackResult.style,
          confidence: feedbackResult.confidence
        },
        original_text: text,
        diary_text: diaryResult.diary_text, // 일기체 변환된 텍스트
        comic_data: processedComicResult,
        selected_date: selectedDate, // 선택된 날짜 포함
        selected_emotion: selectedEmotion // 감정 선택 정보 포함
      };
      // 최소 3초 로딩 보장
      const elapsed = Date.now() - start;
      const minLoading = 60000;
      if (elapsed < minLoading) {
        await new Promise(res => setTimeout(res, minLoading - elapsed));
      }
      // 결과 저장 후 페이지 이동
      localStorage.setItem('analysisResult', JSON.stringify(analysisResult));
      navigate('/diary-feedback');

    } catch (error) {
      console.error('처리 중 오류 발생:', error);
      const currentStep = steps.findIndex(step => step.status === 'processing');
      if (currentStep !== -1) {
        updateStepStatus(currentStep, 'error', (error as Error).message);
      }
    }
  };

  const handleBack = () => {
    if (dotsRef.current) clearInterval(dotsRef.current);
    navigate(-1);
  };

  const getStepIcon = (step: ProcessStep) => {
    switch (step.status) {
      case 'waiting':
        return null;
      case 'processing':
        return <Loader2 className="animate-spin" />;
      case 'completed':
        return <CheckCircle2 className="text-green-500" />;
      case 'error':
        return <AlertTriangle className="text-red-500" />;
    }
  };

  const getStepLabel = (index: number) => {
    const labels = [
      '음성을 텍스트로 변환하고 있어요',
      '4컷 만화를 그리고 있어요',
      '일기체로 변환하고 있어요',
      '감정을 분석하고 있어요'
    ];
    return labels[index];
  };

  const getStepIcon2 = (index: number) => {
    const icons = [Headphones, PenTool, Edit3, Brain];
    const Icon = icons[index];
    return <Icon className="w-6 h-6" />;
  };

  return (
    <div className="min-h-screen flex flex-col items-center py-8 bg-[#F9F9FA]">
      {/* 폰트 적용 스타일 */}
      <style>{`
        @font-face {
          font-family: 'HakgyoansimDoldamB';
          src: url('/src/assets/fonts/HakgyoansimDoldamB.otf') format('opentype');
          font-weight: normal;
          font-style: normal;
        }
        .diary-font { font-family: 'HakgyoansimDoldamB', 'Nanum Pen Script', sans-serif; }
      `}</style>
      {/* 종이 느낌 메인 박스 */}
      <div className="w-full max-w-lg mx-auto p-0 sm:p-0 rounded-[18px] shadow-[0_2px_16px_0_rgba(235,84,5,0.06)] border border-[#F5E9DE] diary-font bg-[#FFF9F4] mt-10">
        {/* 상단 뒤로가기 버튼 */}
        <div className="flex items-center justify-between px-6 pt-8 pb-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="text-[#EB5405] hover:bg-orange-100/60"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-bold text-[#EB5405] diary-font">AI 분석 중</h1>
          <div className="w-8" />
        </div>
        {/* 메인 컨텐츠 */}
        <div className="flex flex-col items-center justify-center px-8 pb-12">
          <GameLoading />
          <h2 className="text-lg font-semibold text-[#EB5405] mb-6 diary-font">
            AI가 당신의 이야기를 분석하고 있어요{dots}
          </h2>
          <div className="w-full space-y-5">
            {steps.map((step, index) => (
              <div
                key={index}
                className={`bg-white/90 rounded-xl border border-[#F5E9DE] p-5 flex items-center justify-between shadow-sm diary-font transition-all duration-300 ${step.status === 'processing' ? 'border-2 border-[#EB5405] bg-orange-50/60' : ''}`}
              >
                <div className="flex items-center gap-3">
                  {getStepIcon2(index)}
                  <div>
                    <p className="font-medium text-[#EB5405] diary-font">{getStepLabel(index)}</p>
                    {step.error && (
                      <p className="text-sm text-red-500 mt-1">{step.error}</p>
                    )}
                  </div>
                </div>
                <div className="w-6 h-6">
                  {getStepIcon(step)}
                </div>
              </div>
            ))}
          </div>
          {steps.some(step => step.status === 'error') && (
            <Button
              variant="default"
              onClick={() => navigate('/')}
              className="mt-8 bg-[#EB5405] hover:bg-[#FF8A3D] text-white px-8 py-3 text-lg rounded-lg font-bold shadow"
            >
              홈으로 돌아가기
            </Button>
          )}
        </div>
      </div>
    </div>
  );
} 