import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";

interface Emotion {
  id: string;
  name: string;
  emoji: string;
  color: string;
  description: string;
}

interface LocationState {
  text?: string;
  audioFile?: File;
}

const EmotionSelection = () => {
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { text, audioFile } = location.state as LocationState || {};

  const emotions: Emotion[] = [
    {
      id: "happy",
      name: "기쁨",
      emoji: "😊",
      color: "bg-happy",
      description: "기분이 좋고 즐거워요"
    },
    {
      id: "sad",
      name: "슬픔",
      emoji: "😢",
      color: "bg-sad",
      description: "마음이 아프고 슬퍼요"
    },
    {
      id: "angry",
      name: "분노",
      emoji: "😡",
      color: "bg-angry",
      description: "짜증나고 화가 나요"
    },
    {
      id: "fear",
      name: "두려움",
      emoji: "😨",
      color: "bg-anxious",
      description: "겁나고 불안해요"
    },
    {
      id: "surprise",
      name: "놀람",
      emoji: "😲",
      color: "bg-excited",
      description: "예상치 못한 일에 놀랐어요"
    },
    {
      id: "disgust",
      name: "혐오",
      emoji: "🤢",
      color: "bg-disgust",
      description: "불쾌하고 싫어요"
    },
    {
      id: "neutral",
      name: "중성",
      emoji: "😐",
      color: "bg-calm",
      description: "특별한 감정이 없어요"
    }
  ];

  const handleEmotionSelect = (emotionId: string) => {
    setSelectedEmotion(emotionId);
  };

  const handleNext = () => {
    if (!selectedEmotion) return;
    
    // 선택된 감정 정보 저장
    const selectedEmotionData = emotions.find(e => e.id === selectedEmotion);
    console.log('선택된 감정:', selectedEmotionData);
    
    if (selectedEmotionData) {
      // 선택된 감정을 localStorage에 저장
      localStorage.setItem('selectedEmotion', JSON.stringify({
        id: selectedEmotionData.id,
        name: selectedEmotionData.name,
        emoji: selectedEmotionData.emoji,
        color: selectedEmotionData.color
      }));
    }
    
    // 기존 텍스트가 없으면 빈 텍스트로 저장 (STT 실패 등)
    if (!text) {
      localStorage.setItem("transcribedText", "");
    }
    
    // 감정 선택 완료 후 일기 편집 페이지로 이동
    navigate('/diary-edit');
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
      <div className="w-full max-w-lg mx-auto p-0 sm:p-0 rounded-[18px] shadow-[0_2px_16px_0_rgba(235,84,5,0.06)] border border-[#F5E9DE] diary-font bg-[#FFF9F4] mt-10">
        <div className="text-center pt-10 pb-6 px-8">
          <h1 className="text-3xl font-bold diary-font text-[#EB5405] mb-2">오늘의 감정</h1>
          <p className="text-lg diary-font text-gray-600">
            {text ? 'AI 분석에 실패했습니다. 직접 감정을 선택해주세요.' : '지금 느끼는 감정을 선택해주세요'}
          </p>
        </div>
        {/* 텍스트 미리보기 (텍스트가 있는 경우) */}
        {text && (
          <div className="mb-8 px-8">
            <div className="bg-white/90 rounded-2xl p-4 shadow-sm border border-[#F5E9DE] diary-font">
              <h3 className="text-base font-bold text-[#EB5405] mb-2">일기 내용</h3>
              <p className="text-gray-700 text-base line-clamp-3 diary-font">{text}</p>
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10 px-8">
          {emotions.map((emotion) => (
            <button
              key={emotion.id}
              onClick={() => handleEmotionSelect(emotion.id)}
              className={`rounded-2xl shadow-lg bg-white/80 p-8 flex flex-col items-center border-2 transition-all diary-font
                ${selectedEmotion === emotion.id
                  ? 'border-[#EB5405] scale-105 shadow-xl bg-orange-50/60'
                  : 'border-transparent hover:border-[#EB5405]/50 hover:scale-105'}
              `}
            >
              <div className="text-4xl mb-2">{emotion.emoji}</div>
              <div className="text-xl font-bold mb-1">{emotion.name}</div>
              <div className="text-sm text-gray-500">{emotion.description}</div>
            </button>
          ))}
        </div>
        <div className="px-8 pb-10">
          <Button
            onClick={handleNext}
            disabled={!selectedEmotion}
            className="w-full py-3 rounded-lg diary-font bg-[#EB5405] hover:bg-[#FF8A3D] text-white disabled:bg-charcoal/20 disabled:text-charcoal/40 text-lg font-bold shadow transition-colors duration-200"
          >
            <span className="mr-2">다음</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EmotionSelection;