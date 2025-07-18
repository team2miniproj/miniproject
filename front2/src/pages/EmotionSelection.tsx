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
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F4] to-[#F9F9FA] flex flex-col items-center">
      <div className="w-full max-w-4xl mx-auto mt-10">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold font-hakgyoansim text-orange-500 mb-2">오늘의 감정</h1>
          <p className="text-lg font-hakgyoansim text-gray-600">
            {text ? 'AI 분석에 실패했습니다. 직접 감정을 선택해주세요.' : '지금 느끼는 감정을 선택해주세요'}
          </p>
        </div>
        {/* 텍스트 미리보기 (텍스트가 있는 경우) */}
        {text && (
          <div className="mb-8">
            <div className="bg-white/80 backdrop-blur-sm border-0 rounded-2xl p-4 shadow font-hakgyoansim">
              <h3 className="text-base font-bold text-orange-400 mb-2">일기 내용</h3>
              <p className="text-gray-700 text-base line-clamp-3">{text}</p>
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {emotions.map((emotion) => (
            <button
              key={emotion.id}
              onClick={() => handleEmotionSelect(emotion.id)}
              className={`rounded-2xl shadow-lg bg-white/70 p-8 flex flex-col items-center border-2 transition-all font-hakgyoansim
                ${selectedEmotion === emotion.id
                  ? 'border-mint-aurora scale-105 shadow-xl'
                  : 'border-transparent hover:border-mint-aurora/50 hover:scale-105'}
              `}
            >
              <div className="text-4xl mb-2">{emotion.emoji}</div>
              <div className="text-xl font-bold mb-1">{emotion.name}</div>
              <div className="text-sm text-gray-500">{emotion.description}</div>
            </button>
          ))}
        </div>
        <Button
          onClick={handleNext}
          disabled={!selectedEmotion}
          className="w-full py-3 mt-4 rounded-xl font-hakgyoansim bg-mint-aurora hover:bg-mint-aurora/90 text-charcoal disabled:bg-charcoal/20 disabled:text-charcoal/40"
        >
          <span className="mr-2">다음</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default EmotionSelection;