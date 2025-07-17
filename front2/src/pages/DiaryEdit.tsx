import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Edit3, Loader2, Sparkles, Calendar, Cloud, CloudRain, Sun, CloudLightning, Snowflake } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils';
import { DialogOverlay } from '@radix-ui/react-dialog';
import { motion } from 'framer-motion';

// 날씨 아이콘 컴포넌트
const WeatherIcon = ({ type, className }: { type: string; className?: string }) => {
  const iconMap = {
    sunny: <Sun className={cn("h-5 w-5 text-yellow-500", className)} />,
    cloudy: <Cloud className={cn("h-5 w-5 text-gray-500", className)} />,
    rainy: <CloudRain className={cn("h-5 w-5 text-blue-500", className)} />,
    stormy: <CloudLightning className={cn("h-5 w-5 text-gray-600", className)} />,
    snowy: <Snowflake className={cn("h-5 w-5 text-blue-300", className)} />
  };
  
  return iconMap[type as keyof typeof iconMap] || iconMap.sunny;
};

export default function DiaryEdit() {
  const navigate = useNavigate();
  const initialText = localStorage.getItem("transcribedText") || "";
  
  const [text, setText] = useState(initialText);
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedWeather, setSelectedWeather] = useState('sunny');
  const [showDatePicker, setShowDatePicker] = useState(false);

  // 텍스트가 없으면 홈으로 리다이렉트
  useEffect(() => {
    if (!initialText) {
      navigate('/');
    }
  }, [initialText, navigate]);

  const handleBack = () => {
    setOpen(true);
  };

  const handleStartAnalysis = async () => {
    setIsLoading(true);
    
    try {
      // 수정된 텍스트와 날짜, 날씨 정보를 localStorage에 저장
      localStorage.setItem("transcribedText", text);
      localStorage.setItem("diaryDate", selectedDate.toISOString());
      localStorage.setItem("diaryWeather", selectedWeather);
      
      // TODO: 실제 백엔드 API 호출로 텍스트 전송
      // const response = await fetch('/api/analyze-text', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({ text, date: selectedDate, weather: selectedWeather }),
      // });
      
      // Mock 처리로 분석 페이지로 이동
      setTimeout(() => {
        navigate('/diary-generation');
      }, 500);
    } catch (error) {
      console.error('텍스트 분석 요청 실패:', error);
      // 오류 시 감정 선택 페이지로 이동
      navigate('/emotion-selection');
    }
  };

  const weatherOptions = [
    { id: 'sunny', label: '맑음', color: 'text-yellow-500' },
    { id: 'cloudy', label: '흐림', color: 'text-gray-500' },
    { id: 'rainy', label: '비', color: 'text-blue-500' },
    { id: 'stormy', label: '천둥번개', color: 'text-gray-600' },
    { id: 'snowy', label: '눈', color: 'text-blue-300' }
  ];

  if (isLoading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ 
          background: 'linear-gradient(135deg, #F9F9FA 0%, #FFF9F4 100%)',
          backgroundImage: `
            radial-gradient(circle at 20% 80%, rgba(235, 84, 5, 0.05) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255, 226, 122, 0.05) 0%, transparent 50%)
          `
        }}
      >
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-orange-500 mb-4 mx-auto" />
          <p className="text-gray-600">분석 페이지로 이동 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen"
      style={{ 
        background: 'linear-gradient(135deg, #F9F9FA 0%, #FFF9F4 100%)',
        backgroundImage: `
          radial-gradient(circle at 20% 80%, rgba(235, 84, 5, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(255, 226, 122, 0.05) 0%, transparent 50%)
        `
      }}
    >
      {/* 헤더 */}
      <header className="flex items-center justify-between p-4 border-b border-gray-200/50">
        <Button 
          variant="ghost" 
          onClick={() => setOpen(true)}
          className="text-gray-600 hover:bg-gray-100"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        
        <h1 className="text-lg font-semibold text-gray-800">일기 작성</h1>
        
        <div className="w-10" />
      </header>

      {/* 메인 콘텐츠 */}
      <div className="p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* 날짜 및 날씨 선택 */}
          <Card className="mb-6 bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                {/* 날짜 선택 */}
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700">날짜:</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDatePicker(true)}
                    className="flex items-center gap-2 border-gray-300 text-gray-700"
                  >
                    <Calendar className="h-4 w-4" />
                    {selectedDate.toLocaleDateString('ko-KR')}
                  </Button>
                </div>
                
                {/* 날씨 선택 */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">날씨:</span>
                  <div className="flex gap-1">
                    {weatherOptions.map((weather) => (
                      <Button
                        key={weather.id}
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedWeather(weather.id)}
                        className={cn(
                          "h-8 w-8 p-0 rounded-full transition-all",
                          selectedWeather === weather.id 
                            ? "bg-orange-100 border-2 border-orange-300" 
                            : "hover:bg-gray-100"
                        )}
                      >
                        <WeatherIcon type={weather.id} />
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 일기 본문 */}
          <Card className="bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-800 flex items-center gap-2">
                <Edit3 className="w-5 h-5" />
                오늘의 일기
              </CardTitle>
              <p className="text-gray-600 text-sm">
                AI가 음성을 텍스트로 변환했습니다. 내용을 확인하고 자유롭게 수정해주세요.
              </p>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* 텍스트 편집 영역 - 그림일기 느낌 */}
              <div className="relative">
                <Textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="변환된 텍스트가 여기에 표시됩니다..."
                  className="min-h-[400px] bg-white/90 border-gray-300/50 text-gray-800 placeholder:text-gray-400 focus:border-orange-300 focus:ring-orange-200 resize-none text-base leading-relaxed rounded-lg"
                  style={{
                    fontFamily: 'Georgia, serif',
                    lineHeight: '1.8',
                    backgroundImage: `
                      linear-gradient(90deg, transparent 0%, transparent 95%, rgba(235, 84, 5, 0.1) 95%, transparent 100%),
                      radial-gradient(circle at 20% 80%, rgba(255, 226, 122, 0.02) 0%, transparent 50%)
                    `
                  }}
                />
                
                {/* 그림일기 느낌의 장식 요소 */}
                <div className="absolute top-2 right-2 w-8 h-8 opacity-20">
                  <div 
                    className="w-full h-full rounded-full"
                    style={{ 
                      background: 'radial-gradient(circle, rgba(235, 84, 5, 0.3) 0%, transparent 70%)',
                      transform: 'rotate(15deg)'
                    }}
                  />
                </div>
              </div>

              {/* 글자 수 표시 */}
              <div className="flex justify-end">
                <div className="text-sm text-gray-500">
                  {text.length} 글자
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* 하단 버튼 */}
        <motion.div 
          className="mt-8 flex flex-col items-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <Button
            onClick={handleStartAnalysis}
            disabled={!text.trim()}
            className="bg-orange-500 hover:bg-orange-600 text-white disabled:bg-gray-300 disabled:text-gray-500 px-8 py-3 text-lg font-medium w-full max-w-xs shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            분석 시작하기
          </Button>
          <Button
            variant="outline"
            onClick={() => setOpen(true)}
            className="w-full max-w-xs text-gray-600 border-gray-300 hover:bg-gray-50"
          >
            다시 녹음하기
          </Button>
        </motion.div>

        {/* 날짜 선택 모달 */}
        <Dialog open={showDatePicker} onOpenChange={setShowDatePicker}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>날짜 선택</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <input
                type="date"
                value={selectedDate.toISOString().split('T')[0]}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDatePicker(false)}>
                취소
              </Button>
              <Button 
                onClick={() => setShowDatePicker(false)}
                style={{ backgroundColor: '#EB5405' }}
              >
                확인
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 모달 다이얼로그 */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogPrimitive.Portal>
            <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60" />
            <DialogPrimitive.Content
              className={cn(
                "fixed left-1/2 top-1/2 z-50 grid w-full max-w-xs translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg"
              )}
            >
              <DialogHeader>
                <DialogTitle className="tracking-wider text-base">녹음을 다시 진행하시겠습니까?</DialogTitle>
              </DialogHeader>
              <DialogFooter className="flex flex-row gap-2 justify-end pt-4">
                <Button variant="outline" onClick={() => setOpen(false)} className="min-w-[80px]">취소</Button>
                <Button 
                  onClick={() => navigate('/recording')} 
                  className="min-w-[80px]"
                  style={{ backgroundColor: '#EB5405' }}
                >
                  확인
                </Button>
              </DialogFooter>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        </Dialog>
      </div>
    </div>
  );
} 