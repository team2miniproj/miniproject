import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// 감정-색상 매핑 (두 번째 사진 기준)
export const emotionColors = {
  joy: '#FFE27A',      // 기쁨 - 밝은 노란색
  sadness: '#A7C7E7',  // 슬픔 - 연한 파란색
  anger: '#F79B8B',    // 분노 - 연한 산호색
  fear: '#C5A8D2',     // 두려움 - 연한 라벤더
  surprise: '#C4F3E2', // 놀람 - 연한 민트색
  disgust: '#D3F07D',  // 혐오 - 연한 라임색
  neutral: '#E2DFD7',  // 중성 - 연한 회색
};

export type EmotionType = keyof typeof emotionColors;

interface EmotionData {
  date: Date;
  emotion: EmotionType;
  intensity?: number;
}

interface EmotionCalendarProps {
  emotionData?: EmotionData[];
  onDateSelect?: (date: Date, hasEmotion: boolean) => void;
  className?: string;
}

// 감정별 붓터치 SVG (직사각형 붓터치)
const brushSvgs: Record<EmotionType, string> = {
  joy: `<svg width='50' height='25' viewBox='0 0 50 25' fill='none' xmlns='http://www.w3.org/2000/svg'><rect x='2' y='2' width='46' height='21' rx='8' fill='#FFE27A' fill-opacity='0.8'/><rect x='4' y='4' width='42' height='17' rx='6' fill='#FFE27A' fill-opacity='0.6'/></svg>`,
  sadness: `<svg width='50' height='25' viewBox='0 0 50 25' fill='none' xmlns='http://www.w3.org/2000/svg'><rect x='2' y='2' width='46' height='21' rx='8' fill='#A7C7E7' fill-opacity='0.8'/><rect x='4' y='4' width='42' height='17' rx='6' fill='#A7C7E7' fill-opacity='0.6'/></svg>`,
  anger: `<svg width='50' height='25' viewBox='0 0 50 25' fill='none' xmlns='http://www.w3.org/2000/svg'><rect x='2' y='2' width='46' height='21' rx='8' fill='#F79B8B' fill-opacity='0.8'/><rect x='4' y='4' width='42' height='17' rx='6' fill='#F79B8B' fill-opacity='0.6'/></svg>`,
  fear: `<svg width='50' height='25' viewBox='0 0 50 25' fill='none' xmlns='http://www.w3.org/2000/svg'><rect x='2' y='2' width='46' height='21' rx='8' fill='#C5A8D2' fill-opacity='0.8'/><rect x='4' y='4' width='42' height='17' rx='6' fill='#C5A8D2' fill-opacity='0.6'/></svg>`,
  surprise: `<svg width='50' height='25' viewBox='0 0 50 25' fill='none' xmlns='http://www.w3.org/2000/svg'><rect x='2' y='2' width='46' height='21' rx='8' fill='#C4F3E2' fill-opacity='0.8'/><rect x='4' y='4' width='42' height='17' rx='6' fill='#C4F3E2' fill-opacity='0.6'/></svg>`,
  disgust: `<svg width='50' height='25' viewBox='0 0 50 25' fill='none' xmlns='http://www.w3.org/2000/svg'><rect x='2' y='2' width='46' height='21' rx='8' fill='#D3F07D' fill-opacity='0.8'/><rect x='4' y='4' width='42' height='17' rx='6' fill='#D3F07D' fill-opacity='0.6'/></svg>`,
  neutral: `<svg width='50' height='25' viewBox='0 0 50 25' fill='none' xmlns='http://www.w3.org/2000/svg'><rect x='2' y='2' width='46' height='21' rx='8' fill='#E2DFD7' fill-opacity='0.8'/><rect x='4' y='4' width='42' height='17' rx='6' fill='#E2DFD7' fill-opacity='0.6'/></svg>`,
};

export default function EmotionCalendar({
  emotionData = [],
  onDateSelect,
  className
}: EmotionCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // 감정 데이터를 날짜별로 매핑
  const emotionMap = new Map<string, EmotionData>();
  emotionData.forEach(data => {
    const key = `${data.date.getFullYear()}-${data.date.getMonth()}-${data.date.getDate()}`;
    emotionMap.set(key, data);
  });

  // 현재 월의 첫 번째 날과 마지막 날
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  
  // 첫 번째 날의 요일 (0: 일요일, 1: 월요일, ...)
  const firstDayWeekday = firstDayOfMonth.getDay();
  
  // 달력에 표시할 모든 날짜 생성 (빈 칸 + 현재 월 + 빈 칸)
  const daysInMonth = [];
  
  // 이전 월의 마지막 날짜들 (빈 칸으로 채우기)
  for (let i = 0; i < firstDayWeekday; i++) {
    daysInMonth.push(null);
  }
  
  // 현재 월의 모든 날짜
  for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
    daysInMonth.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
  }
  
  // 다음 월의 날짜들 (6주 표시를 위해)
  const remainingDays = 42 - daysInMonth.length; // 6주 * 7일 = 42
  for (let i = 0; i < remainingDays; i++) {
    daysInMonth.push(null);
  }

  // 요일별로 그룹화 (7개씩)
  const weeks = [];
  for (let i = 0; i < daysInMonth.length; i += 7) {
    weeks.push(daysInMonth.slice(i, i + 7));
  }

  // 이전/다음 월 이동
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // 날짜 선택 핸들러
  const handleDateClick = (date: Date) => {
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    const hasEmotion = emotionMap.has(key);
    onDateSelect?.(date, hasEmotion);
  };

  // 오늘 날짜 확인
  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() && 
           date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear();
  };

  // 월 이름
  const monthNames = [
    '1월', '2월', '3월', '4월', '5월', '6월',
    '7월', '8월', '9월', '10월', '11월', '12월'
  ];

  // 요일 이름
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <div className={`w-full ${className}`}>
      {/* 달력 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={goToPreviousMonth}
          className="h-8 w-8 rounded-full bg-orange-100/60 hover:bg-orange-200/80 transition-colors"
        >
          <ChevronLeft className="h-4 w-4 text-gray-700" />
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 text-lg font-semibold text-gray-800 hover:bg-orange-100/60 hover:text-orange-500 rounded-xl px-3 py-2 transition-colors">
              <span className="font-hakgyoansim">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
              <ChevronDown className="h-4 w-4 text-gray-500" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 rounded-2xl shadow-xl border border-orange-100 bg-white p-4 mt-2">
            {/* 연도 선택 */}
            <div className="mb-4">
              <div className="text-sm font-medium text-gray-700 mb-3 font-hakgyoansim">연도</div>
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 10 }, (_, i) => {
                  const year = new Date().getFullYear() - 5 + i;
                  const isCurrentYear = year === currentDate.getFullYear();
                  return (
                    <DropdownMenuItem
                      key={year}
                      onClick={() => setCurrentDate(new Date(year, currentDate.getMonth(), 1))}
                      className={`text-center text-sm py-2 rounded-lg transition-colors font-hakgyoansim ${
                        isCurrentYear 
                          ? 'bg-orange-100 text-orange-600 font-semibold' 
                          : 'hover:bg-orange-50 hover:text-orange-500'
                      }`}
                    >
                      {year}
                    </DropdownMenuItem>
                  );
                })}
              </div>
            </div>
            
            <div className="border-t border-orange-100 my-3" />
            
            {/* 월 선택 */}
            <div>
              <div className="text-sm font-medium text-gray-700 mb-3 font-hakgyoansim">월</div>
              <div className="grid grid-cols-3 gap-2">
                {monthNames.map((month, index) => {
                  const isCurrentMonth = index === currentDate.getMonth();
                  return (
                    <DropdownMenuItem
                      key={index}
                      onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), index, 1))}
                      className={`text-center text-sm py-2 rounded-lg transition-colors font-hakgyoansim ${
                        isCurrentMonth 
                          ? 'bg-orange-100 text-orange-600 font-semibold' 
                          : 'hover:bg-orange-50 hover:text-orange-500'
                      }`}
                    >
                      {month}
                    </DropdownMenuItem>
                  );
                })}
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={goToToday}
            className="text-sm font-medium text-gray-700 hover:bg-orange-100/60 hover:text-orange-500 rounded-xl px-3 py-2 transition-colors font-hakgyoansim"
          >
            오늘
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={goToNextMonth}
            className="h-8 w-8 rounded-full bg-orange-100/60 hover:bg-orange-200/80 transition-colors"
          >
            <ChevronRight className="h-4 w-4 text-gray-700" />
          </Button>
        </div>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((day, index) => (
          <div
            key={day}
            className={`h-8 flex items-center justify-center text-sm font-medium ${
              index === 0 || index === 6 
                ? 'text-orange-500' 
                : 'text-gray-700'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* 달력 그리드 */}
      <div className="grid grid-cols-7 gap-1">
        {weeks.map((week, weekIndex) => (
          <React.Fragment key={weekIndex}>
            {week.map((date, dayIndex) => {
              // 빈 칸인 경우
              if (!date) {
                return (
                  <div
                    key={dayIndex}
                    className="h-12 w-full flex items-center justify-center"
                  />
                );
              }

              const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    const emotionData = emotionMap.get(key);
              const today = isToday(date);

    // 감정 붓터치 배경
    const brushBg = emotionData
      ? `url('data:image/svg+xml;utf8,${encodeURIComponent(brushSvgs[emotionData.emotion])}')`
      : undefined;

    return (
                <button
                  key={dayIndex}
                  onClick={() => handleDateClick(date)}
                  className="relative h-12 w-full flex items-center justify-center rounded-lg hover:bg-gray-50 transition-colors"
                >
        {/* 감정 붓터치 배경 */}
        {emotionData && (
          <div
            className="absolute inset-0 z-0"
            style={{
              backgroundImage: brushBg,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center',
                        backgroundSize: '85% 75%',
              borderRadius: 8,
                        opacity: 0.9,
                        transform: `rotate(${Math.random() * 6 - 3}deg)`,
            }}
          />
        )}
                  
                  {/* 오늘 표시 */}
                  {today && (
          <motion.div
                      className="absolute inset-0 z-10 rounded-full border-2"
                      style={{ 
                        borderColor: '#EB5405',
                        backgroundColor: '#EB5405'
                      }}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
          />
        )}
                  
        {/* 날짜 숫자 */}
                  <span className={`relative z-20 text-sm font-medium ${
                    today ? 'text-white' : 'text-gray-800'
                  }`}>
                    {date.getDate()}
        </span>
                </button>
              );
            })}
          </React.Fragment>
        ))}
      </div>
      
      {/* 감정 범례 */}
      <div className="mt-1 p-4 bg-white rounded-lg shadow-sm">
        <h4 className="text-sm font-medium text-gray-700 mb-3">감정 범례</h4>
        <div className="grid grid-cols-4 gap-3">
          {Object.entries(emotionColors).map(([emotion, color]) => (
            <div key={emotion} className="flex flex-col items-center gap-1">
              <div
                className="w-6 h-3 rounded-sm"
                style={{ 
                  backgroundColor: color,
                  transform: `rotate(${Math.random() * 4 - 2}deg)`,
                  opacity: 0.8,
                }}
              />
              <span className="text-xs text-gray-600 font-hakgyoansim">
                {emotion === 'joy' && '기쁨'}
                {emotion === 'sadness' && '슬픔'}
                {emotion === 'anger' && '분노'}
                {emotion === 'fear' && '두려움'}
                {emotion === 'surprise' && '놀람'}
                {emotion === 'disgust' && '혐오'}
                {emotion === 'neutral' && '중성'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 