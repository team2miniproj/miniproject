import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useState } from "react";
import { motion } from "framer-motion";
import { Settings, User, Plus, BookMarked, Mic } from "lucide-react";
import Bookmark1 from '../assets/bookmark1.jpg';
import Bookmark2 from '../assets/bookmark2.jpg';
import Bookmark3 from '../assets/bookmark3.png';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

// 예시 감정 데이터
const sampleEmotionData = [
  { date: new Date(2024, 3, 1), emotion: 'joy', intensity: 0.8 },
  { date: new Date(2024, 3, 5), emotion: 'sadness', intensity: 0.6 },
  { date: new Date(2024, 3, 10), emotion: 'anger', intensity: 0.4 },
  { date: new Date(2024, 3, 15), emotion: 'surprise', intensity: 0.9 },
  { date: new Date(2024, 3, 20), emotion: 'fear', intensity: 0.3 },
  { date: new Date(2024, 3, 25), emotion: 'neutral', intensity: 0.5 },
];

// 예시 북마크 데이터
const sampleBookmarks = [
  {
    id: 1,
    title: "봄날의 기억",
    image: Bookmark1,
    description: "벚꽃이 만개한 날의 일기들",
    count: 5,
  },
  {
    id: 2,
    title: "여름 하늘",
    image: Bookmark2,
    description: "구름이 예쁜 날의 기록",
    count: 3,
  },
  {
    id: 3,
    title: "특별한 순간들",
    image: Bookmark3,
    description: "소중한 추억",
    count: 7,
  },
];

// 감정 색상 매핑 (EmotionCalendar와 동일하게 사용)
const emotionColors = {
  joy: '#FFE27A',      // 기쁨
  sadness: '#A7C7E7',  // 슬픔
  anger: '#F79B8B',    // 분노
  fear: '#C5A8D2',     // 두려움
  surprise: '#C4F3E2', // 놀람
  disgust: '#D3F07D',  // 혐오
  neutral: '#E2DFD7',  // 중성
};

// 날짜별 감정 데이터 매핑 함수
function getEmotionForDate(date: Date) {
  const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  const found = sampleEmotionData.find(d => {
    return (
      d.date.getFullYear() === date.getFullYear() &&
      d.date.getMonth() === date.getMonth() &&
      d.date.getDate() === date.getDate()
    );
  });
  return found ? found.emotion : null;
}

export default function Home() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [showDialog, setShowDialog] = useState(false);
  const [showBookmarkDialog, setShowBookmarkDialog] = useState(false);
  const user = auth.currentUser;

  // isSelected를 컴포넌트 내부로 이동
  function isSelected(date: Date) {
    return (
      selectedDate &&
      date.getFullYear() === selectedDate.getFullYear() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getDate() === selectedDate.getDate()
    );
  }

  const handleDateSelect = (date: Date, hasEmotion: boolean) => {
    setSelectedDate(date);
    
    if (hasEmotion) {
      navigate(`/diary/1`);
    } else {
      setShowDialog(true);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("로그아웃 중 오류 발생:", error);
    }
  };

  const handleStartRecording = () => {
    setShowDialog(false);
    navigate("/recording");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-gradient-to-br from-[#FFF9F4] to-[#F9F9FA] font-hakgyoansim"
      style={{ 
        backgroundImage: `
          linear-gradient(135deg, #F9F9FA 0%, #FFF9F4 100%),
          radial-gradient(circle at 20% 80%, rgba(235, 84, 5, 0.03) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(255, 226, 122, 0.03) 0%, transparent 50%)
        `
      }}
    >
      {/* 헤더 영역 */}
      <div className="px-4 py-3 flex justify-between items-center max-w-2xl mx-auto">
        {/* 로고 */}
        <motion.h1 
          className="text-3xl font-bold tracking-tight font-hakgyoansim text-orange-500 drop-shadow"
          style={{ transform: 'rotate(-1deg)' }}
        >
          오늘어때?
        </motion.h1>
        {/* 우측 아이콘들 */}
        <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10 text-orange-400 hover:bg-orange-100/60 rounded-full shadow font-hakgyoansim">
                <User className="h-6 w-6" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64 rounded-2xl shadow-xl border border-orange-100 bg-white/95 p-0 mt-2">
            <DropdownMenuLabel className="flex items-center gap-3 px-5 py-4">
              <Avatar className="h-12 w-12 text-lg font-bold bg-teal-400">
                <AvatarImage src={user?.photoURL || ""} />
                <AvatarFallback className="bg-teal-400 text-white text-lg font-bold font-hakgyoansim">
                  {user?.displayName?.[0] || user?.email?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="font-bold text-base text-gray-800 font-hakgyoansim">{user?.displayName || "사용자"}</span>
                <span className="text-sm text-gray-500 font-hakgyoansim font-semibold">{user?.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="my-0 bg-orange-100" />
            <DropdownMenuItem onClick={handleSignOut} className="px-5 py-3 text-gray-700 font-hakgyoansim text-base hover:bg-orange-50 rounded-b-2xl cursor-pointer">
              로그아웃
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
          <Button variant="ghost" size="icon" className="h-10 w-10 text-orange-400 hover:bg-orange-100/60 rounded-full shadow font-hakgyoansim" onClick={() => navigate('/settings')}>
            <Settings className="h-6 w-6" />
        </Button>
        </div>
      </div>
      {/* 메인 컨텐츠 영역 */}
      <div className="container mx-auto px-4 py-8 max-w-xl">
        {/* 감정 달력 */}
        <motion.div 
          className="bg-white/90 rounded-3xl shadow-xl p-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
            <Calendar
            onChange={(date) => {
              if (Array.isArray(date)) return;
              setSelectedDate(date);
              // 감정 데이터 연동
              const emotion = getEmotionForDate(date);
              handleDateSelect(date, !!emotion);
            }}
            value={selectedDate}
            minDate={new Date(2024, 0, 1)}
            maxDate={new Date(2025, 11, 31)}
            tileContent={({ date, view }) => {
              const emotion = getEmotionForDate(date);
              return emotion ? (
                <div className="w-2 h-2 rounded-full mx-auto mt-1" style={{ background: emotionColors[emotion] }} />
              ) : null;
            }}
            tileClassName={({ date, view }) =>
              isSelected(date) ? "border-2 border-orange-400 rounded-full" : ""
            }
            calendarType="gregory"
            locale="ko-KR"
            next2Label={null}
            prev2Label={null}
            className="font-hakgyoansim"
          />
          {/* 감정 범례 */}
          <div className="grid grid-cols-4 gap-2 mt-6 p-3 bg-white rounded-lg shadow-sm font-hakgyoansim">
            <div className="flex flex-col items-center gap-1">
              <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: emotionColors.joy }} />
              <span className="text-xs text-gray-600">기쁨</span>
          </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: emotionColors.sadness }} />
              <span className="text-xs text-gray-600">슬픔</span>
        </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: emotionColors.anger }} />
              <span className="text-xs text-gray-600">분노</span>
              </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: emotionColors.fear }} />
              <span className="text-xs text-gray-600">두려움</span>
          </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: emotionColors.surprise }} />
              <span className="text-xs text-gray-600">놀람</span>
        </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: emotionColors.disgust }} />
              <span className="text-xs text-gray-600">혐오</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: emotionColors.neutral }} />
              <span className="text-xs text-gray-600">중성</span>
            </div>
          </div>
        </motion.div>
        {/* 북마크 섹션 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold font-hakgyoansim text-gray-800">나의 일기장</h2>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="text-base font-hakgyoansim text-gray-500 hover:text-orange-500"
                onClick={() => navigate('/bookmarks')}
              >
                전체보기
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-base font-hakgyoansim text-gray-600 hover:text-orange-500"
                onClick={() => setShowBookmarkDialog(true)}
              >
                <Plus className="h-5 w-5 mr-1" />
                새 일기장
              </Button>
            </div>
          </div>
          <div className="relative">
            <Swiper
              spaceBetween={10}
              slidesPerView={1.2}
              centeredSlides={false}
              grabCursor={true}
              style={{ paddingBottom: '1rem' }}
              breakpoints={{
                640: { slidesPerView: 1.5, spaceBetween: 10, centeredSlides: false },
                1024: { slidesPerView: 2.2, spaceBetween: 12, centeredSlides: false },
              }}
            >
                {sampleBookmarks.map((bookmark) => (
                <SwiperSlide key={bookmark.id}>
                  <motion.div
                    whileHover={{ y: -5, scale: 1.03 }}
                    className="relative shrink-0 cursor-pointer"
                    style={{ width: '160px' }}
                    onClick={() => navigate(`/bookmark/${bookmark.id}`)}
                  >
                    <div className="aspect-[3/4] rounded-2xl overflow-hidden shadow-xl bg-white/90 border-0 flex flex-col justify-end">
                      <div className="absolute inset-0 rounded-2xl" style={{ 
                        background: 'linear-gradient(to bottom, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.32) 100%)',
                        maskImage: 'radial-gradient(white, black)',
                        WebkitMaskImage: 'radial-gradient(white, black)'
                      }} />
                      <img
                        src={bookmark.image}
                        alt={bookmark.title}
                        className="w-full h-full object-cover rounded-2xl"
                      />
                      <div className="absolute bottom-0 left-0 right-0 p-4 text-white font-hakgyoansim">
                        <h3 className="text-base font-bold mb-1 line-clamp-1 drop-shadow">{bookmark.title}</h3>
                        <p className="text-xs opacity-90 line-clamp-2 drop-shadow">{bookmark.description}</p>
                        <div className="flex items-center mt-2 text-xs">
                          <BookMarked className="h-4 w-4 mr-1" />
                          {bookmark.count}개의 일기
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </SwiperSlide>
                ))}
            </Swiper>
          </div>
        </motion.div>
      </div>
      {/* 기록 유도 모달 */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md font-hakgyoansim">
          <DialogHeader>
            <DialogTitle>오늘의 감정을 기록해보세요</DialogTitle>
            <DialogDescription>
              {selectedDate?.toLocaleDateString('ko-KR')}의 하루는 어땠나요?
              음성으로 간편하게 기록해보세요.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowDialog(false)} className="font-hakgyoansim">
              나중에
            </Button>
            <Button
              onClick={handleStartRecording}
              style={{ backgroundColor: '#EB5405' }}
              className="font-hakgyoansim text-white"
            >
              기록하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* 새 일기장 생성 모달 */}
      <Dialog open={showBookmarkDialog} onOpenChange={setShowBookmarkDialog}>
        <DialogContent className="sm:max-w-md font-hakgyoansim">
          <DialogHeader>
            <DialogTitle>새 일기장 만들기</DialogTitle>
            <DialogDescription>
              특별한 주제로 일기장을 만들어보세요.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBookmarkDialog(false)} className="font-hakgyoansim">
              취소
            </Button>
            <Button
              onClick={() => setShowBookmarkDialog(false)}
              style={{ backgroundColor: '#EB5405' }}
              className="font-hakgyoansim text-white"
            >
              만들기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}