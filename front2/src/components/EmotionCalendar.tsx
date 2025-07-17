import React from 'react';
import { motion } from 'framer-motion';
import { DayPicker, DayProps } from 'react-day-picker';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';

// 감정-색상 매핑 (디자인 시안 기준)
export const emotionColors = {
  joy: '#FFE27A',      // 기쁨
  sadness: '#A7C7E7',  // 슬픔
  anger: '#F79B8B',    // 분노
  fear: '#C5A8D2',     // 두려움
  surprise: '#C4F3E2', // 놀람
  disgust: '#D3F07D',  // 혐오
  neutral: '#E2DFD7',  // 중성
};

export type EmotionType = keyof typeof emotionColors;

interface EmotionData {
  date: Date;
  emotion: EmotionType;
  intensity?: number; // 0-1 사이의 값
}

interface EmotionCalendarProps {
  emotionData?: EmotionData[];
  onDateSelect?: (date: Date, hasEmotion: boolean) => void;
  className?: string;
  selected?: Date;
  mode?: 'single' | 'multiple' | 'range';
  disabled?: { before?: Date; after?: Date };
  fromDate?: Date;
  toDate?: Date;
}

// 감정별 붓터치 SVG (인라인)
const brushSvgs: Record<EmotionType, string> = {
  joy: `<svg width='60' height='32' viewBox='0 0 60 32' fill='none' xmlns='http://www.w3.org/2000/svg'><ellipse cx='30' cy='16' rx='28' ry='10' fill='#FFE27A' fill-opacity='0.7'/><ellipse cx='30' cy='16' rx='25' ry='8' fill='#FFE27A' fill-opacity='0.5'/></svg>`,
  sadness: `<svg width='60' height='32' viewBox='0 0 60 32' fill='none' xmlns='http://www.w3.org/2000/svg'><ellipse cx='30' cy='16' rx='28' ry='10' fill='#A7C7E7' fill-opacity='0.7'/><ellipse cx='30' cy='16' rx='25' ry='8' fill='#A7C7E7' fill-opacity='0.5'/></svg>`,
  anger: `<svg width='60' height='32' viewBox='0 0 60 32' fill='none' xmlns='http://www.w3.org/2000/svg'><ellipse cx='30' cy='16' rx='28' ry='10' fill='#F79B8B' fill-opacity='0.7'/><ellipse cx='30' cy='16' rx='25' ry='8' fill='#F79B8B' fill-opacity='0.5'/></svg>`,
  fear: `<svg width='60' height='32' viewBox='0 0 60 32' fill='none' xmlns='http://www.w3.org/2000/svg'><ellipse cx='30' cy='16' rx='28' ry='10' fill='#C5A8D2' fill-opacity='0.7'/><ellipse cx='30' cy='16' rx='25' ry='8' fill='#C5A8D2' fill-opacity='0.5'/></svg>`,
  surprise: `<svg width='60' height='32' viewBox='0 0 60 32' fill='none' xmlns='http://www.w3.org/2000/svg'><ellipse cx='30' cy='16' rx='28' ry='10' fill='#C4F3E2' fill-opacity='0.7'/><ellipse cx='30' cy='16' rx='25' ry='8' fill='#C4F3E2' fill-opacity='0.5'/></svg>`,
  disgust: `<svg width='60' height='32' viewBox='0 0 60 32' fill='none' xmlns='http://www.w3.org/2000/svg'><ellipse cx='30' cy='16' rx='28' ry='10' fill='#D3F07D' fill-opacity='0.7'/><ellipse cx='30' cy='16' rx='25' ry='8' fill='#D3F07D' fill-opacity='0.5'/></svg>`,
  neutral: `<svg width='60' height='32' viewBox='0 0 60 32' fill='none' xmlns='http://www.w3.org/2000/svg'><ellipse cx='30' cy='16' rx='28' ry='10' fill='#E2DFD7' fill-opacity='0.7'/><ellipse cx='30' cy='16' rx='25' ry='8' fill='#E2DFD7' fill-opacity='0.5'/></svg>`,
};

export default function EmotionCalendar({
  emotionData = [],
  onDateSelect,
  className,
  ...calendarProps
}: EmotionCalendarProps) {
  
  // 감정 데이터를 날짜별로 매핑
  const emotionMap = new Map<string, EmotionData>();
  emotionData.forEach(data => {
    const key = `${data.date.getFullYear()}-${data.date.getMonth()}-${data.date.getDate()}`;
    emotionMap.set(key, data);
  });

  // 붓터치 스타일의 감정 표시 컴포넌트
  const EmotionIndicator = ({ emotion, intensity = 1 }: { emotion: EmotionType; intensity?: number }) => (
    <motion.div
      className="absolute inset-0 rounded-md"
      style={{
        backgroundColor: emotionColors[emotion],
        opacity: 0.7 + (intensity * 0.3),
        transform: `rotate(${Math.random() * 4 - 2}deg)`,
      }}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {/* 붓터치 효과를 위한 추가 레이어 */}
      <div 
        className="absolute inset-0 rounded-md"
        style={{
          background: `radial-gradient(circle at ${30 + Math.random() * 40}% ${30 + Math.random() * 40}%, rgba(255,255,255,0.2) 0%, transparent 70%)`,
          transform: `rotate(${Math.random() * 360}deg)`,
        }}
      />
    </motion.div>
  );

  // 날짜 렌더링 함수 커스텀
  const renderDay = (day: Date, outside?: boolean) => {
    // outside day(해당 월이 아닌 날짜)는 렌더하지 않음
    if (outside) return null;
    const key = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
    const emotionData = emotionMap.get(key);
    const isToday = new Date().toDateString() === day.toDateString();

    // 감정 붓터치 배경
    const brushBg = emotionData
      ? `url('data:image/svg+xml;utf8,${encodeURIComponent(brushSvgs[emotionData.emotion])}')`
      : undefined;

    return (
      <div className="relative w-full h-full flex items-center justify-center" style={{ minHeight: 36 }}>
        {/* 감정 붓터치 배경 */}
        {emotionData && (
          <div
            className="absolute inset-0 z-0"
            style={{
              backgroundImage: brushBg,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center',
              backgroundSize: '90% 80%',
              borderRadius: 8,
              opacity: 0.95,
            }}
          />
        )}
        {/* 오늘 강조 */}
        {isToday && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-orange-500 z-10"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
          />
        )}
        {/* 날짜 숫자 */}
        <span className={cn(
          "relative z-20 flex items-center justify-center w-full h-full text-base font-hakgyoansim",
          isToday && "text-orange-500 font-bold"
        )}>
          {day.getDate()}
        </span>
      </div>
    );
  };

  // 날짜 선택 핸들러
  const handleDateSelect = (date: Date | undefined) => {
    if (!date || !onDateSelect) return;
    
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    const hasEmotion = emotionMap.has(key);
    
    onDateSelect(date, hasEmotion);
  };

  return (
    <div className={cn("w-full", className)}>
      <DayPicker
        locale={ko}
        mode="single"
        selected={calendarProps.selected}
        onSelect={handleDateSelect}
        showOutsideDays={false}
        disabled={calendarProps.disabled && calendarProps.disabled.before && calendarProps.disabled.after ? { before: calendarProps.disabled.before, after: calendarProps.disabled.after } : undefined}
        fromDate={calendarProps.fromDate}
        toDate={calendarProps.toDate}
        components={{
          Day: (props: any) => (
            <button
              type="button"
              className="w-full h-full p-0 bg-transparent border-0 focus:outline-none"
              tabIndex={props.tabIndex}
              aria-label={props['aria-label']}
              role={props.role}
              onClick={props.onClick}
              onPointerDown={props.onPointerDown}
              onMouseDown={props.onMouseDown}
              onKeyDown={props.onKeyDown}
              disabled={props.disabled}
              style={{ width: '100%', height: '100%' }}
            >
              {renderDay(props.date, props.outside)}
            </button>
          ),
        }}
        className="w-full p-0"
        classNames={{
          months: "block",
          month: "block",
          caption: "flex justify-center pt-1 relative items-center",
          caption_label: "text-sm font-medium font-hakgyoansim",
          nav: "space-x-1 flex items-center",
          nav_button: cn(
            "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
          ),
          nav_button_previous: "absolute left-1",
          nav_button_next: "absolute right-1",
          table: "table w-full border-collapse",
          head_row: "table-row",
          head_cell: "table-cell text-gray-500 rounded-md w-10 h-10 font-normal text-[0.8rem] text-center font-hakgyoansim",
          row: "table-row",
          cell: "table-cell p-0 text-center align-middle",
          day: "inline-block w-9 h-9 align-middle",
          day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
          day_today: "bg-accent text-accent-foreground",
          day_outside: "text-gray-300 opacity-70",
          day_disabled: "text-muted-foreground opacity-50",
          day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
          day_hidden: "invisible",
        }}
      />
      
      {/* 감정 범례 */}
      <div className="mt-4 p-3 bg-white rounded-lg shadow-sm">
        <h4 className="text-sm font-medium text-gray-700 mb-2">감정 범례</h4>
        <div className="grid grid-cols-4 gap-2">
          {Object.entries(emotionColors).map(([emotion, color]) => (
            <div key={emotion} className="flex flex-col items-center gap-1">
              <div
                className="w-4 h-4 rounded-sm"
                style={{ 
                  backgroundColor: color,
                  transform: `rotate(${Math.random() * 4 - 2}deg)`,
                }}
              />
              <span className="text-xs text-gray-600">
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