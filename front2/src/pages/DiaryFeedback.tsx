import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, Edit3, Calendar } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import FImg from '../assets/F.png';
import TImg from '../assets/T.png';

// 날씨 아이콘 컴포넌트 및 옵션 추가
import { Sun, Cloud, CloudRain, CloudSnow } from 'lucide-react';
const weatherOptions = [
  { id: 'sunny', label: '맑음', icon: <Sun className="h-5 w-5 text-yellow-500" /> },
  { id: 'cloudy', label: '흐림', icon: <Cloud className="h-5 w-5 text-gray-500" /> },
  { id: 'rainy', label: '비', icon: <CloudRain className="h-5 w-5 text-blue-500" /> },
  { id: 'snowy', label: '눈', icon: <CloudSnow className="h-5 w-5 text-blue-300" /> },
];

interface FeedbackData {
  emotion_analysis: {
    primary_emotion: string;
    primary_emotion_score: number;
    primary_emotion_emoji: string;
    all_emotions: Array<{
      emotion: string;
      score: number;
      emoji: string;
    }>;
    confidence: number;
  };
  ai_feedback: {
    feedback_text: string;
    style: string;
    confidence: number;
  };
  original_text: string;
  diary_text?: string; // 일기체 변환된 텍스트 추가
  comic_data: {
    images: string[];
    generated_text?: string;
  };
  selected_date?: string; // 선택된 날짜 추가
  weather?: string; // 날씨 정보 추가
}

export default function DiaryFeedback() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [feedbackData, setFeedbackData] = useState<FeedbackData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState('');
  // 날씨 인덱스 상태로 관리 (화살표로 순환)
  const [weatherIndex, setWeatherIndex] = useState(0);
  const selectedWeather = weatherOptions[weatherIndex].id;

  useEffect(() => {
    // localStorage에서 분석 결과 받기
    let analysisResult = localStorage.getItem('analysisResult');
    if (!analysisResult) {
      // 샘플 데이터 자동 세팅 (디자인 미리보기용)
      const sample = {
        emotion_analysis: {
          primary_emotion: 'happy',
          primary_emotion_score: 0.95,
          primary_emotion_emoji: '😊',
          all_emotions: [],
          confidence: 0.9
        },
        ai_feedback: {
          feedback_text: '오늘도 힘내줘서 고마워! 넌 정말 멋진 친구야!',
          style: 'empathetic',
          confidence: 0.9
        },
        original_text: '오늘은 정말 즐거운 하루였다.',
        diary_text: '오늘은 정말 즐거운 하루였다.',
        comic_data: {
          images: ['https://placehold.co/400x200?text=AI+Image']
        },
        selected_date: '2024-06-13',
        weather: 'sunny' // 샘플 데이터에 날씨 정보 추가
      };
      localStorage.setItem('analysisResult', JSON.stringify(sample));
      analysisResult = JSON.stringify(sample);
    }
    if (analysisResult) {
      try {
        const parsedData = JSON.parse(analysisResult);
        setFeedbackData(parsedData);
        setEditedText(parsedData.diary_text || parsedData.original_text);
        // 날씨 정보가 있으면 인덱스 세팅
        if (parsedData.weather) {
          const idx = weatherOptions.findIndex(w => w.id === parsedData.weather);
          setWeatherIndex(idx >= 0 ? idx : 0);
        }
        // 데이터를 사용했으니 삭제 (디자인 미리보기 시에는 남겨둬도 됨)
        // localStorage.removeItem('analysisResult');
      } catch (error) {
        console.error('분석 결과 파싱 실패:', error);
        navigate('/');
      }
    } else {
      console.error('분석 결과를 불러올 수 없습니다.');
      navigate('/');
    }
    setIsLoading(false);
  }, [navigate]);

  const handleBack = () => {
    navigate('/');
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (feedbackData) {
      setFeedbackData({
        ...feedbackData,
        original_text: editedText
      });
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedText(feedbackData?.diary_text || feedbackData?.original_text || '');
    setIsEditing(false);
  };

  const handleSaveDiary = async () => {
    if (!feedbackData || !currentUser) {
      console.error('로그인이 필요합니다.');
      return;
    }

    setIsSaving(true);

    try {
      // 선택된 날짜가 있으면 사용, 없으면 현재 날짜 사용
      let dateToSave: Date;
      if (feedbackData.selected_date) {
        // YYYY-MM-DD 문자열을 Date 객체로 변환
        const [year, month, day] = feedbackData.selected_date.split('-').map(Number);
        dateToSave = new Date(year, month - 1, day); // month는 0-based
      } else {
        dateToSave = new Date();
      }

      // Firebase Firestore에 일기 데이터 저장
      const diaryData = {
        uid: currentUser.uid,
        date: dateToSave, // Date 객체로 저장
        text: editedText,
        weather: selectedWeather, // 날씨 정보 추가
        emotion_analysis: {
          primary_emotion: feedbackData.emotion_analysis.primary_emotion,
          primary_emotion_score: feedbackData.emotion_analysis.primary_emotion_score,
          primary_emotion_emoji: feedbackData.emotion_analysis.primary_emotion_emoji,
          all_emotions: feedbackData.emotion_analysis.all_emotions,
          confidence: feedbackData.emotion_analysis.confidence
        },
        ai_feedback: {
          feedback_text: feedbackData.ai_feedback.feedback_text,
          style: feedbackData.ai_feedback.style,
          confidence: feedbackData.ai_feedback.confidence
        },
        comic_data: feedbackData.comic_data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // 'diaries' 컬렉션에 문서 추가
      const docRef = await addDoc(collection(db, 'diaries'), diaryData);
      console.log('일기 저장 성공, Document ID:', docRef.id);
      
      // 선택된 날짜 정보 삭제
      localStorage.removeItem('selectedDate');
      
      navigate('/');
    } catch (error) {
      console.error('일기 저장 실패:', error);
      console.error('일기 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-100 to-rose-200 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500 mb-4 mx-auto"></div>
          <p className="text-rose-800">AI 분석 결과를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!feedbackData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-100 to-rose-200 flex items-center justify-center">
        <div className="text-center">
          <p className="text-rose-800">분석 결과를 불러올 수 없습니다.</p>
          <Button onClick={() => navigate('/')} className="mt-4">
            홈으로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

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
      {/* 종이 박스 */}
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
        {/* 상단: 날짜/감정/제목/날씨 */}
        <div className="flex items-center justify-between px-8 pt-7 pb-2">
          <span className="text-base text-[#222]">{feedbackData.selected_date || '날짜 없음'}</span>
          <div className="flex items-center gap-4">
            <span className="flex flex-col items-center justify-center">
              <span className="inline-flex items-center justify-center w-8 h-8 text-xl bg-[#FFF9F4] border border-[#FFE27A] rounded-full shadow-sm mb-0.5" style={{ lineHeight: 1.1 }} title="감정">{feedbackData.emotion_analysis.primary_emotion_emoji}</span>
              {/* 감정명 텍스트 제거 */}
            </span>
            {/* 날씨 선택: 화살표로 넘기는 방식 (위치 고정) */}
            <div className="flex items-center gap-2 ml-4 min-w-[140px] justify-center">
              <button
                type="button"
                onClick={() => setWeatherIndex((weatherIndex - 1 + weatherOptions.length) % weatherOptions.length)}
                className="rounded-full px-2 py-1 text-xl text-[#EB5405] hover:bg-[#FFE27A] transition"
                aria-label="이전 날씨"
                style={{ minWidth: 32 }}
              >{'<'}</button>
              <span className="flex items-center gap-1 min-w-[70px] justify-center">
                <span className="flex items-center justify-center w-7 h-7">{weatherOptions[weatherIndex].icon}</span>
                <span className="text-base ml-1">{weatherOptions[weatherIndex].label}</span>
              </span>
              <button
                type="button"
                onClick={() => setWeatherIndex((weatherIndex + 1) % weatherOptions.length)}
                className="rounded-full px-2 py-1 text-xl text-[#EB5405] hover:bg-[#FFE27A] transition"
                aria-label="다음 날씨"
                style={{ minWidth: 32 }}
              >{'>'}</button>
            </div>
          </div>
        </div>
        {/* 제목 */}
        <div className="px-8 pb-2 text-lg text-[#222]">제목: 오늘의 일기</div>
        {/* 이미지-본문-피드백 한 덩어리 */}
        <div className="px-8 pb-8">
          {/* 이미지 */}
        {feedbackData.comic_data.images && feedbackData.comic_data.images.length > 0 && (
            <div className="w-full h-48 rounded-[10px] overflow-hidden mb-4" style={{border: '1.5px solid #F5E9DE'}}>
              <img src={feedbackData.comic_data.images[0]} alt="AI 이미지" className="object-cover w-full h-full" />
              </div>
          )}
          {/* 본문(일기 텍스트) */}
          <div
            className="w-full mb-4 bg-[#fff] rounded-[14px] border border-[#F5E9DE] py-8 px-7 shadow-sm diary-font text-[20px] text-[#333] whitespace-pre-line relative"
            style={{
              minHeight: '180px',
              lineHeight: '2.2',
              maxWidth: '100%',
              backgroundImage: `
                url('data:image/svg+xml;utf8,<svg width=\"40\" height=\"40\" viewBox=\"0 0 40 40\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><rect x=\"0\" y=\"0\" width=\"40\" height=\"40\" fill=\"none\"/><path d=\"M0 0h40v40H0V0zm0 0v40m40-40v40M0 0h40M0 40h40\" stroke=\"%23E2DFD7\" stroke-width=\"1.2\" stroke-opacity=\"0.13\"/></svg>')
              `,
              backgroundRepeat: 'repeat',
              backgroundSize: '40px 40px',
              backgroundPosition: 'left top',
              boxSizing: 'border-box',
            }}
          >
            {/* 수정(연필) 버튼 - 우측 상단, 아이콘만 */}
            {!isEditing && (
              <button
                onClick={handleEdit}
                className="absolute top-3 right-6 text-orange-400 hover:text-[#EB5405] p-0.5 rounded-full bg-transparent border-none shadow-none transition-colors duration-150"
                aria-label="수정"
                type="button"
                style={{ boxShadow: 'none', background: 'none', border: 'none' }}
              >
                <Edit3 className="w-4 h-4" />
              </button>
            )}
            {isEditing ? (
              <Textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                className="min-h-[120px] resize-none border-rose-300 focus:border-rose-500 bg-transparent text-[20px] diary-font"
                placeholder="일기 내용을 입력하세요..."
                style={{background: 'none'}}
              />
            ) : (
              <span>{editedText}</span>
            )}
          </div>
          {/* 피드백 말풍선 (DiaryDetail 구조 참고) */}
          <div className="w-full flex flex-col gap-4 mt-6">
            {/* F(강아지) - 왼쪽 말풍선 */}
            <div className="flex items-center gap-3 mb-2">
              <img src={FImg} alt="F" className="w-9 h-9 rounded-full object-cover" />
              <span className="bg-[#FFF9C4] rounded-2xl px-4 py-2 diary-font text-[15px] text-gray-700 min-h-[36px] flex items-center shadow-sm">
                {feedbackData.ai_feedback.feedback_text}
              </span>
            </div>
            {/* T(고양이) - 오른쪽 말풍선 (예시, 실제 피드백 2개라면 분리) */}
            <div className="flex items-center gap-3 justify-end">
              <span className="bg-blue-50 rounded-2xl px-4 py-2 diary-font text-[15px] text-gray-700 min-h-[36px] flex items-center shadow-sm">
                {feedbackData.ai_feedback.feedback_text}
              </span>
              <img src={TImg} alt="T" className="w-9 h-9 rounded-full object-cover" />
            </div>
          </div>
          {/* 저장/수정 버튼 */}
          <div className="flex justify-end pt-6 gap-2">
            {/* 하단 수정 버튼 완전히 제거 */}
          <Button
            onClick={handleSaveDiary}
            disabled={isSaving}
              className="px-8 py-3 text-lg rounded-lg font-bold shadow bg-[#EB5405] hover:bg-[#FF8A3D] text-white border-none transition-colors duration-200"
              style={{ minWidth: 160 }}
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                저장 중...
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                일기 저장하기
              </>
            )}
          </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 