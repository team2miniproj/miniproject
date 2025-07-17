import { useState } from "react";
import { ArrowLeft, Edit3, Share, Trash2, Play, Pause, Heart, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { getFeedbackByEmotion } from "@/lib/feedback";
import FImg from '../assets/F.png';
import TImg from '../assets/T.png';

interface DiaryDetailData {
  id: string;
  date: string;
  title: string;
  emotion: string;
  emotionEmoji: string;
  summary: string;
  content?: string;
  audioRecording?: boolean;
  images?: string[];
  weather?: string;
  location?: string;
}

const DiaryDetail = (props) => {
  // emotion을 props, location.state, context 등에서 받아옴
  const location = useLocation();
  // 실제로는 라우팅 state, context 등에서 받아오면 됨
  let emotion = "calm";
  let diaryData = null;
  try {
    if (location.state && location.state.diary) {
      diaryData = location.state.diary;
      emotion = diaryData.emotion;
    } else if (props.emotion) {
      emotion = props.emotion;
    }
  } catch {}
  const feedback = getFeedbackByEmotion(emotion);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const navigate = useNavigate();

  // 감정명 한글 변환 함수 추가
  const getEmotionLabel = (emotion: string) => {
    const labels = {
      happy: "기쁨",
      sad: "슬픔",
      angry: "화남",
      excited: "설렘",
      calm: "평온",
      anxious: "불안"
    };
    return labels[emotion as keyof typeof labels] || emotion;
  };

  // diaryData가 없으면 로딩 또는 에러 처리
  if (!diaryData) {
    return <div className="p-8 text-center text-charcoal">일기 데이터를 불러오는 중입니다...</div>;
  }

  const getEmotionStyle = (emotion: string) => {
    const styles = {
      happy: "bg-emotion-happy",
      sad: "bg-emotion-sad", 
      angry: "bg-emotion-angry",
      excited: "bg-emotion-excited",
      calm: "bg-emotion-calm",
      anxious: "bg-emotion-anxious"
    };
    return styles[emotion as keyof typeof styles] || "bg-muted";
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleEdit = () => {
    // 수정 기능은 아직 미구현
  };

  const handleShare = () => {
    // 공유 기능은 아직 미구현
  };

  const handleDelete = () => {
    if (!diaryData) return;
    // localStorage에서 해당 일기 삭제
    const prev = JSON.parse(localStorage.getItem('diaries') || '[]');
    const filtered = prev.filter((entry: any) => entry.date !== diaryData.date || entry.text !== diaryData.text);
    localStorage.setItem('diaries', JSON.stringify(filtered));
    navigate('/calendar'); // 삭제 후 캘린더로 이동
  };

  const toggleAudioPlayback = () => {
    setIsPlaying(!isPlaying);
  };

  const toggleLike = () => {
    setIsLiked(!isLiked);
  };

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

  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 */}
        <div 
        className="relative h-48 bg-gradient-header overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-header/70"></div>
        <div className="relative z-10 flex justify-between items-start p-6 pt-12">
            <Button
              onClick={handleBack}
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            
          <div className="flex items-center gap-2">
              <Button
                onClick={handleEdit}
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
              >
                <Edit3 className="w-5 h-5" />
              </Button>
              <Button
                onClick={handleShare}
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
              >
                <Share className="w-5 h-5" />
              </Button>
              <Button
                onClick={handleDelete}
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
              >
                <Trash2 className="w-5 h-5" />
              </Button>
            </div>
          </div>
        
        <div className="relative z-10 text-center text-white mt-4">
          <h1 className="text-xl font-bold">{diaryData.title}</h1>
          <p className="text-white/80 text-sm mt-1">{diaryData.date}</p>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="px-6 py-6">
        {/* 감정 및 메타 정보 */}
        <div className="bg-card rounded-lg p-4 shadow-card mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full ${getEmotionStyle(diaryData.emotion)} flex items-center justify-center text-2xl`}>
                {emotionEmoji}
              </div>
              <div>
                <h3 className="font-semibold text-lg">오늘의 감정</h3>
                <p className="text-muted-foreground text-sm">{getEmotionLabel ? getEmotionLabel(diaryData.emotion) : diaryData.emotion}</p>
              </div>
            </div>
            
            <Button
              onClick={toggleLike}
              variant="ghost"
              size="icon"
              className={isLiked ? "text-red-500" : "text-muted-foreground"}
            >
              <Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">날짜: </span>
              <span>{diaryData.date}</span>
            </div>
            {/*
        <div>
          <span className="text-muted-foreground">장소: </span>
          <span>{diaryData.location || '-'}</span>
        </div>
        */}
          </div>
          </div>

          {/* 음성 녹음 재생 */}
          {diaryData.audioRecording && (
          <div className="bg-card rounded-lg p-4 shadow-card mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button
                    onClick={toggleAudioPlayback}
                  size="icon"
                  className="bg-gradient-primary"
                  >
                  {isPlaying ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4 ml-0.5" />
                  )}
                  </Button>
                  <div>
                  <h4 className="font-medium">음성 일기</h4>
                  <p className="text-muted-foreground text-sm">2:34</p>
                </div>
                  </div>
              
              <div className="flex items-center gap-2">
                <div className="w-24 h-1 bg-muted rounded-full overflow-hidden">
                  <div className="w-1/3 h-full bg-gradient-primary"></div>
                </div>
                <span className="text-xs text-muted-foreground">0:52</span>
              </div>
              </div>
            </div>
          )}

        {/* 일기 내용 */}
        <div className="bg-card rounded-lg p-4 shadow-card">
          <h3 className="font-semibold text-lg mb-4">일기 내용</h3>
          <div className="prose prose-sm max-w-none">
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
              {diaryData.text}
              </p>
          </div>
        </div>

        {/* 하단 액션 */}
        <div className="flex items-center justify-center gap-4 mt-6">
            <Button
            variant="outline"
              size="sm"
            className="flex items-center gap-2"
            >
            <MessageCircle className="w-4 h-4" />
            메모 추가
            </Button>
            <Button
            onClick={handleShare}
            variant="outline"
              size="sm"
            className="flex items-center gap-2"
            >
            <Share className="w-4 h-4" />
            공유하기
            </Button>
        </div>
      </div>
      {/* 피드백 메시지 (F, T 모두 표시) */}
      <div className="px-6 pb-8">
        {/* F(강아지) 피드백 */}
        <div className="flex items-start gap-3 mb-3">
          <img src={FImg} alt="F" className="w-14 h-14 rounded-full border-2 border-white shadow-md" />
          <div className="bg-orange-50 rounded-2xl px-5 py-3 shadow flex-1">
            <div className="text-gray-700">{feedback.F}</div>
          </div>
        </div>
        {/* T(고양이) 피드백 */}
        <div className="flex items-end gap-3 justify-end">
          <div className="bg-blue-50 rounded-2xl px-5 py-3 shadow flex-1 text-left">
            <div className="text-gray-700">{feedback.T}</div>
          </div>
          <img src={TImg} alt="T" className="w-14 h-14 rounded-full border-2 border-white shadow-md" />
        </div>
      </div>
      {/* // 피드백 메시지 끝 */}
    </div>
  );
};

export default DiaryDetail;