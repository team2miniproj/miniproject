import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, Edit3, Calendar } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

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
}

export default function DiaryFeedback() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [feedbackData, setFeedbackData] = useState<FeedbackData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState('');

  useEffect(() => {
    // localStorage에서 분석 결과 받기
    const analysisResult = localStorage.getItem('analysisResult');
    if (analysisResult) {
      try {
        const parsedData = JSON.parse(analysisResult);
        setFeedbackData(parsedData);
        // 일기체 변환된 텍스트가 있으면 사용, 없으면 원본 텍스트 사용
        setEditedText(parsedData.diary_text || parsedData.original_text);
        // 데이터를 사용했으니 삭제
        localStorage.removeItem('analysisResult');
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
    <div className="min-h-screen bg-gradient-to-br from-rose-100 to-rose-200">
      {/* 헤더 */}
      <header className="flex items-center justify-between p-4 border-b border-rose-200">
        <Button 
          variant="ghost" 
          onClick={handleBack}
          className="text-rose-800 hover:bg-rose-200/50"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        
        <h1 className="text-lg font-semibold text-rose-800">AI 분석 결과</h1>
        
        <div className="flex gap-2">
          {!isEditing ? (
            <Button
              onClick={handleEdit}
              variant="outline"
              size="sm"
              className="text-rose-800 border-rose-300 hover:bg-rose-200/50"
            >
              <Edit3 className="w-4 h-4 mr-1" />
              수정
            </Button>
          ) : (
            <>
              <Button
                onClick={handleSaveEdit}
                variant="outline"
                size="sm"
                className="text-green-700 border-green-300 hover:bg-green-100"
              >
                저장
              </Button>
              <Button
                onClick={handleCancelEdit}
                variant="outline"
                size="sm"
                className="text-gray-700 border-gray-300 hover:bg-gray-100"
              >
                취소
              </Button>
            </>
          )}
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        {/* 생성된 만화 이미지 */}
        {feedbackData.comic_data.images && feedbackData.comic_data.images.length > 0 && (
          <Card className="bg-white/80 backdrop-blur-sm border-rose-200">
            <CardHeader>
              <CardTitle className="text-rose-800 flex items-center gap-2">
                🎨 AI가 그린 4컷 만화
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                <img 
                  src={feedbackData.comic_data.images[0]} 
                  alt="AI 생성 만화"
                  className="max-w-full h-auto rounded-lg shadow-lg"
                  style={{ maxHeight: '600px' }}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* 오늘의 일기 */}
        <Card className="bg-white/80 backdrop-blur-sm border-rose-200">
          <CardHeader>
            <CardTitle className="text-rose-800 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              {feedbackData.selected_date ? 
                `${feedbackData.selected_date}의 일기` : 
                '오늘의 일기'
              }
              <span className="text-2xl ml-2">
                {feedbackData.emotion_analysis.primary_emotion_emoji}
              </span>
              <span className="text-sm font-normal text-rose-600">
                {feedbackData.emotion_analysis.primary_emotion}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <Textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                className="min-h-[120px] resize-none border-rose-300 focus:border-rose-500"
                placeholder="일기 내용을 입력하세요..."
              />
            ) : (
              <div className="bg-rose-50/50 border border-rose-200 rounded-lg p-4">
                <p className="text-rose-800 leading-relaxed whitespace-pre-wrap">
                  {editedText}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI 피드백 */}
        <Card className="bg-white/80 backdrop-blur-sm border-rose-200">
          <CardHeader>
            <CardTitle className="text-rose-800 flex items-center gap-2">
              💬 AI 피드백
              <span className="text-sm font-normal text-rose-600">
                ({feedbackData.ai_feedback.style === 'empathetic' ? '공감형' : 
                  feedbackData.ai_feedback.style === 'encouraging' ? '격려형' : 
                  feedbackData.ai_feedback.style === 'analytical' ? '분석형' : '일반형'})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-rose-50/50 border border-rose-200 rounded-lg p-4">
              <p className="text-rose-800 leading-relaxed">
                {feedbackData.ai_feedback.feedback_text}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 저장 버튼 */}
        <div className="flex justify-center pt-6">
          <Button
            onClick={handleSaveDiary}
            disabled={isSaving}
            className="bg-rose-500 hover:bg-rose-600 text-white px-8 py-3 text-lg"
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
  );
} 