import { useState } from "react";
import { ArrowLeft, Sun, Cloud, CloudRain, CloudLightning, Umbrella, CloudSnow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import FImg from '../assets/F.png';
import TImg from '../assets/T.png';
import HandDrawnGrid from '../assets/HandDrawnGrid.png';

// HakgyoansimDoldamB.otf 폰트 적용 (컴포넌트 내부 style 태그)
const fontUrl = '/src/assets/fonts/HakgyoansimDoldamB.otf';

const weatherOptions = [
  { id: 'sunny', label: '맑음', icon: <Sun className="w-6 h-6" style={{color:'#EB5405'}} /> },
  { id: 'cloudy', label: '흐림', icon: <Cloud className="w-6 h-6" style={{color:'#A7C7E7'}} /> },
  { id: 'rainy', label: '비', icon: <CloudRain className="w-6 h-6" style={{color:'#7FC8A9'}} /> },
  { id: 'stormy', label: '천둥', icon: <CloudLightning className="w-6 h-6" style={{color:'#FFD600'}} /> },
  { id: 'umbrella', label: '우산', icon: <Umbrella className="w-6 h-6" style={{color:'#7FC8A9'}} /> },
  { id: 'snowy', label: '눈', icon: <CloudSnow className="w-6 h-6" style={{color:'#B3E5FC'}} /> },
];

const DUMMY_IMAGE = "https://placehold.co/400x200?text=AI+Image";

const DiaryDetail = (props) => {
  const location = useLocation();
  const navigate = useNavigate();
  // 더미 데이터
  const diaryData = location.state?.diary || {
    id: "1",
    date: "2024-06-07",
    title: "오늘의 일기",
    text: "오늘은 날씨가 맑아서 기분이 정말 좋았다. 친구들과 산책도 하고 맛있는 것도 먹었다. 앞으로도 이런 날이 자주 있었으면 좋겠다!",
    weather: "sunny",
    aiImage: DUMMY_IMAGE,
  };
  // 날짜 포맷 (YYYY-MM-DD → YYYY년 MM월 DD일)
  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return `${d.getFullYear()}년 ${d.getMonth()+1}월 ${d.getDate()}일`;
  };
  // DiaryFeedback에서 저장한 날씨 정보 사용
  const weather = diaryData.weather || 'sunny';
  const weatherObj = weatherOptions.find(opt => opt.id === weather) || weatherOptions[0];

  // 원고지 세팅 (7x7)
  // const gridSize = 7*7;
  // const textArr = (diaryData.text || "").split("").slice(0, gridSize);
  // while (textArr.length < gridSize) textArr.push("");

  // 줄노트: 텍스트를 18자 단위로 줄바꿈
  const lineLength = 18;
  const lines = [];
  const text = diaryData.text || "";
  for (let i = 0; i < text.length; i += lineLength) {
    lines.push(text.slice(i, i + lineLength));
  }

  // 감정 이모지 매핑
  const emotionEmojis = {
    happy: "😊",
    sad: "😢",
    angry: "😡",
    excited: "🤗",
    calm: "😌",
    anxious: "😰"
  };
  const emotionEmoji = emotionEmojis[diaryData.emotion] || "🙂";

  // 감정명 한글 변환 함수
  const getEmotionLabel = (emotion) => {
    const labels = {
      happy: "기쁨",
      sad: "슬픔",
      angry: "화남",
      excited: "설렘",
      calm: "평온",
      anxious: "불안"
    };
    return labels[emotion] || '';
  };

  // 피드백 더미 (실제 서비스에서는 getFeedbackByEmotion 등 사용)
  const feedback = {
    F: "오늘도 힘내줘서 고마워! 넌 정말 멋진 친구야!",
    T: "가끔은 쉬어가도 괜찮아. 네 마음을 응원해!"
  };

  // 마침표 뒤에 줄바꿈이 들어가도록 변환
  const displayText = (diaryData.text || '').replace(/\./g, '.\n');

  return (
    <div className="min-h-screen flex flex-col items-center py-8 bg-[#F9F9FA]">
      {/* 폰트 적용 스타일 */}
      <style>{`
        @font-face {
          font-family: 'HakgyoansimDoldamB';
          src: url('${fontUrl}') format('opentype');
          font-weight: normal;
          font-style: normal;
        }
        .diary-font { font-family: 'HakgyoansimDoldamB', 'Nanum Pen Script', sans-serif; }
        .diary-grid-cell { border: 1px solid #E2DFD7; background: #fff; }
        .diary-grid-cell:not(:empty) { color: #222; }
        .weather-btn { transition: box-shadow 0.15s, border 0.15s; }
        .weather-btn.selected { border: 2px solid #EB5405; background: #FFE27A; box-shadow: 0 2px 8px #ffe27a44; }
        .weather-btn:hover, .weather-btn:focus { border: 2px solid #EB5405; background: #FFF3E0; }
      `}</style>
      {/* 전체 일기 종이 박스 */}
      <div className="w-full max-w-lg mx-auto p-0 sm:p-0 rounded-[18px] shadow-[0_2px_16px_0_rgba(235,84,5,0.06)] border border-[#F5E9DE] diary-font"
        style={{
          backgroundColor: '#FFF9F4',
          backgroundImage: `
            radial-gradient(circle at 30% 40%, rgba(255, 255, 255, 0.6) 0%, transparent 60%),
            radial-gradient(circle at 70% 60%, rgba(255, 255, 255, 0.5) 0%, transparent 50%),
            radial-gradient(circle at 20% 80%, rgba(255, 255, 255, 0.4) 0%, transparent 40%),
            radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.3) 0%, transparent 45%),
            radial-gradient(ellipse 100px 30px at 20% 30%, rgba(0,0,0,0.02) 0%, transparent 50%),
            radial-gradient(ellipse 80px 25px at 80% 70%, rgba(0,0,0,0.015) 0%, transparent 50%),
            radial-gradient(ellipse 120px 40px at 40% 80%, rgba(0,0,0,0.01) 0%, transparent 50%),
            radial-gradient(ellipse 60px 20px at 70% 20%, rgba(0,0,0,0.012) 0%, transparent 50%),
            radial-gradient(ellipse 90px 35px at 10% 60%, rgba(0,0,0,0.018) 0%, transparent 50%),
            repeating-linear-gradient(15deg, transparent, transparent 3px, rgba(0,0,0,0.006) 3px, rgba(0,0,0,0.006) 4px),
            repeating-linear-gradient(-25deg, transparent, transparent 4px, rgba(0,0,0,0.004) 4px, rgba(0,0,0,0.004) 5px),
            repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(0,0,0,0.003) 5px, rgba(0,0,0,0.003) 6px),
            linear-gradient(135deg, rgba(255, 249, 244, 0.95) 0%, rgba(249, 249, 250, 0.85) 50%, rgba(255, 249, 244, 0.9) 100%)
          `,
          backgroundSize: '300px 300px, 250px 250px, 200px 200px, 280px 280px, 200px 200px, 160px 160px, 240px 240px, 120px 120px, 180px 180px, 8px 8px, 10px 10px, 12px 12px, 100% 100%',
          backgroundBlendMode: 'multiply',
          borderRadius: '18px',
        }}
      >
        {/* 상단: 날짜/감정이모지/날씨 */}
        <div className="flex items-center justify-between px-8 pt-7 pb-2">
          <span className="text-base text-[#222]">{formatDate(diaryData.date)}</span>
          <div className="flex items-center gap-4">
            <span className="flex flex-col items-center justify-center">
              <span className="inline-flex items-center justify-center w-8 h-8 text-xl bg-[#FFF9F4] border border-[#FFE27A] rounded-full shadow-sm mb-0.5" style={{ lineHeight: 1.1 }} title="감정">{emotionEmoji}</span>
              <span className="text-[11px] text-[#EB5405] mt-[-2px]">{getEmotionLabel(diaryData.emotion)}</span>
            </span>
            {/* 날씨 표시 (토글/수정 없이) */}
            <span className="flex items-center gap-1 ml-4">
              {weatherObj.icon}
              <span className="text-base ml-1">{weatherObj.label}</span>
            </span>
          </div>
        </div>
        {/* 제목 */}
        <div className="px-8 pb-2 text-lg text-[#222]">제목: {diaryData.title}</div>
        {/* 이미지-원고지-피드백 한 덩어리 */}
        <div className="px-8 pb-8">
          {/* 이미지 */}
          <div className="w-full h-48 rounded-[10px] overflow-hidden mb-4" style={{border: '1.5px solid #F5E9DE'}}>
            <img src={diaryData.aiImage} alt="AI 이미지" className="object-cover w-full h-full" />
          </div>
          {/* 감성적이고 가독성 좋은 일기 텍스트 박스 + 연한 격자 배경 */}
          <div
            className="w-full mb-4 bg-[#fff] rounded-[14px] border border-[#F5E9DE] py-8 px-7 shadow-sm diary-font text-[20px] text-[#333] whitespace-pre-line"
            style={{
              minHeight: '180px',
              lineHeight: '2.2',
              maxWidth: '100%',
              backgroundImage: `
                url('data:image/svg+xml;utf8,<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="40" height="40" fill="none"/><path d="M0 0h40v40H0V0zm0 0v40m40-40v40M0 0h40M0 40h40" stroke="%23E2DFD7" stroke-width="1.2" stroke-opacity="0.13"/></svg>')
              `,
              backgroundRepeat: 'repeat',
              backgroundSize: '40px 40px',
              backgroundPosition: 'left top',
              // textIndent: '1em',
              boxSizing: 'border-box',
            }}
          >
            {displayText}
          </div>
          {/* 피드백 (말풍선, F 왼쪽, T 오른쪽) */}
          <div className="w-full flex flex-col gap-1 mt-2">
            {/* F(강아지) - 왼쪽 말풍선 */}
            <div className="flex items-start gap-2">
              <img src={FImg} alt="F" className="w-6 h-6 rounded-full" />
              <span className="bg-[#FFF9C4] rounded-2xl px-3 py-1 diary-font text-[15px] text-gray-700 min-h-[32px] flex items-center shadow-sm">
                {feedback.F}
              </span>
            </div>
            {/* T(고양이) - 오른쪽 말풍선 */}
            <div className="flex items-end gap-2 justify-end">
              <span className="bg-blue-50 rounded-2xl px-3 py-1 diary-font text-[15px] text-gray-700 min-h-[32px] flex items-center shadow-sm">
                {feedback.T}
              </span>
              <img src={TImg} alt="T" className="w-6 h-6 rounded-full" />
            </div>
          </div>
        </div>
        {/* 뒤로가기 버튼 */}
        <div className="flex justify-end px-8 pb-6">
          <Button onClick={()=>navigate(-1)} variant="outline" className="rounded-full border-2 border-[#EB5405] text-[#EB5405] bg-[#FFF9F4] hover:bg-[#FFE27A] diary-font">뒤로가기</Button>
        </div>
      </div>
    </div>
  );
};

export default DiaryDetail;