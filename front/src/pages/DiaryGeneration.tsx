import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Headphones, PenTool, Brain, AlertTriangle, CheckCircle2, Loader2, Edit3 } from 'lucide-react';

interface ProcessStep {
  status: 'waiting' | 'processing' | 'completed' | 'error';
  error?: string;
}

export default function DiaryGeneration() {
  const navigate = useNavigate();
  const audioBlob = localStorage.getItem("audioBlob");
  const selectedDate = localStorage.getItem("selectedDate"); // 선택된 날짜 확인
  const [dots, setDots] = useState('');
  const [fadeClass, setFadeClass] = useState('opacity-100');
  
        const [steps, setSteps] = useState<ProcessStep[]>([
        { status: 'waiting' }, // STT
        { status: 'waiting' }, // 만화 생성
        { status: 'waiting' }, // 일기체 변환
        { status: 'waiting' }, // 감정 분석
      ]);

  const dotsRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!audioBlob) {
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
  }, [audioBlob, navigate]);

  const updateStepStatus = (index: number, status: ProcessStep['status'], error?: string) => {
    setSteps(prev => prev.map((step, i) => 
      i === index ? { ...step, status, error } : step
    ));
  };

  const startProcessing = async () => {
    try {
      const userId = localStorage.getItem('userId') || 'default';
      
      // 1. STT 처리
      updateStepStatus(0, 'processing');
      const base64Audio = localStorage.getItem('audioBlob');
      if (!base64Audio) {
        throw new Error('음성 데이터를 찾을 수 없습니다.');
      }

      // Base64를 Blob으로 변환
      const binaryString = window.atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const audioBlob = new Blob([bytes], { type: 'audio/wav' });

      // FormData 생성
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');

      const sttResponse = await fetch('http://localhost:8000/api/speech-to-text', {
        method: 'POST',
        body: formData,
      });

      if (!sttResponse.ok) {
        const errorData = await sttResponse.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || '음성 변환 실패');
      }

      const sttResult = await sttResponse.json();
      if (!sttResult.success || !sttResult.text) {
        throw new Error(sttResult.message || '음성 변환 결과가 없습니다.');
      }
      
      updateStepStatus(0, 'completed');
      localStorage.setItem("transcribedText", sttResult.text);

      // 2. 만화 생성
      const comicResponse = await fetch('http://localhost:8002/api/diary-comic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          raw_text: sttResult.text,
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
      console.log("processedComicResult", processedComicResult);
      console.log("comicResult :::::::::::::: ", comicResult);
      
      
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
          text: sttResult.text,
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
        original_text: sttResult.text,
        diary_text: diaryResult.diary_text, // 일기체 변환된 텍스트
        comic_data: processedComicResult,
        selected_date: selectedDate // 선택된 날짜 포함
      };

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
    <div className="min-h-screen bg-gradient-to-br from-rose-100 to-rose-200 transition-all duration-1000 ease-in-out flex flex-col relative">
      {/* 상단 뒤로가기 버튼 */}
      <div className="flex items-center justify-between p-6 pt-12">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          className="text-rose-800 hover:bg-rose-200/50"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 -mt-20">
        <h1 className="text-2xl font-bold text-rose-800 mb-8">
          AI가 당신의 이야기를 분석하고 있어요{dots}
        </h1>

        <div className="w-full max-w-md space-y-6">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`bg-white/80 backdrop-blur-sm rounded-lg p-4 flex items-center justify-between
                ${step.status === 'processing' ? 'border-2 border-rose-400' : 'border border-rose-200'}
                transition-all duration-300`}
            >
              <div className="flex items-center gap-3">
                {getStepIcon2(index)}
                <div>
                  <p className="font-medium text-rose-800">{getStepLabel(index)}</p>
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
            variant="secondary"
            onClick={() => navigate('/')}
            className="mt-8 bg-rose-500 text-white hover:bg-rose-600"
          >
            홈으로 돌아가기
          </Button>
        )}
      </div>
    </div>
  );
} 