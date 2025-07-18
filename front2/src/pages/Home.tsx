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
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Settings, User, Plus, BookMarked, Mic, BarChart2 } from "lucide-react";
import Bookmark1 from '../assets/bookmark1.jpg';
import Bookmark2 from '../assets/bookmark2.jpg';
import Bookmark3 from '../assets/bookmark3.png';
import Bookmark4 from '../assets/bookmark4.png';
import Bookmark5 from '../assets/bookmark5.png';
import Bookmark6 from '../assets/bookmark6.png';
import Bookmark7 from '../assets/bookmark7.png';
import Bookmark8 from '../assets/bookmark8.png';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import EmotionCalendar, { EmotionData } from '@/components/EmotionCalendar';
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

// 예시 감정 데이터
const sampleEmotionData = [
  { date: new Date(2024, 3, 1), emotion: 'joy' as const, intensity: 0.8 },
  { date: new Date(2024, 3, 5), emotion: 'sadness' as const, intensity: 0.6 },
  { date: new Date(2024, 3, 10), emotion: 'anger' as const, intensity: 0.4 },
  { date: new Date(2024, 3, 15), emotion: 'surprise' as const, intensity: 0.9 },
  { date: new Date(2024, 3, 20), emotion: 'fear' as const, intensity: 0.3 },
  { date: new Date(2024, 3, 25), emotion: 'neutral' as const, intensity: 0.5 },
];

// 예시 일기장 데이터
const sampleDiaries = [
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



const LOCAL_KEY = "diarybooks";

export default function Home() {
  const navigate = useNavigate();

  const [showDialog, setShowDialog] = useState(false);
  const [showBookmarkDialog, setShowBookmarkDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const user = auth.currentUser;

  // 일기장 생성 관련 상태
  const [diaryTitle, setDiaryTitle] = useState("");
  const [diaryDesc, setDiaryDesc] = useState("");
  const [coverType, setCoverType] = useState<'default'|'upload'|null>(null);
  const [selectedCover, setSelectedCover] = useState<string>(""); // url or base64
  const [uploadedFile, setUploadedFile] = useState<File|null>(null);
  const defaultCovers = [Bookmark1, Bookmark2, Bookmark3, Bookmark4, Bookmark5, Bookmark6, Bookmark7, Bookmark8];

  // 파일 업로드 핸들러
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setCoverType('upload');
      const reader = new FileReader();
      reader.onload = (ev) => {
        setSelectedCover(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  // 기본 이미지 선택 핸들러
  const handleDefaultCover = (img: string) => {
    setCoverType('default');
    setSelectedCover(img);
    setUploadedFile(null);
  };
  // 일기장 생성 완료 핸들러
  const handleCreateDiary = () => {
    if (!diaryTitle || !selectedCover) return;
    const newDiary = {
      id: Date.now(),
      title: diaryTitle,
      image: selectedCover,
      description: diaryDesc,
      count: 0,
    };
    setDiaries([newDiary, ...diaries]);
    setShowBookmarkDialog(false);
    setDiaryTitle("");
    setDiaryDesc("");
    setSelectedCover("");
    setCoverType(null);
    setUploadedFile(null);
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

  // 날짜 선택 핸들러
  const handleDateSelect = (date: Date, hasEmotion: boolean) => {
    setSelectedDate(date);
    if (hasEmotion) {
      // 일기가 있는 경우 - 일기 상세 페이지로 이동
      navigate(`/diary/1`);
    } else {
      // 일기가 없는 경우 - 일기 작성 모달 표시
      setShowDialog(true);
    }
  };

  const [diaries, setDiaries] = useState([]);
  const [emotionData, setEmotionData] = useState<EmotionData[]>([]);

  // localStorage에서 불러오기
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_KEY);
    if (saved) {
      try {
        setDiaries(JSON.parse(saved));
      } catch {}
    }
  }, []);
  // localStorage에 저장 (Home에서 일기장 추가 시)
  useEffect(() => {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(diaries));
  }, [diaries]);

  useEffect(() => {
    if (!user) return;
    const fetchDiaries = async () => {
      const q = query(
        collection(db, "diaries"),
        where("uid", "==", user.uid)
      );
      const querySnapshot = await getDocs(q);
      const data: EmotionData[] = [];
      querySnapshot.forEach((doc) => {
        const d = doc.data();
        console.log('Firestore diary doc:', d);
        let dateObj: Date | null = null;
        if (typeof d.date === "string") {
          // "YYYY-MM-DD" 문자열
          const [year, month, day] = d.date.split('-').map(Number);
          dateObj = new Date(year, month - 1, day);
        } else if (d.date && typeof d.date.toDate === "function") {
          // Firestore Timestamp 객체
          dateObj = d.date.toDate();
        }
        if (dateObj && d.emotion_analysis?.primary_emotion) {
          const emotionDatum = {
            date: dateObj,
            emotion: d.emotion_analysis.primary_emotion,
            intensity: d.emotion_analysis.primary_emotion_score
          };
          console.log('Converted emotionData:', emotionDatum);
          data.push(emotionDatum);
        }
      });
      setEmotionData(data);
      console.log('최종 emotionData 배열:', data);
    };
    fetchDiaries();
  }, [user]);

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
      <div className="px-4 py-4 flex justify-between items-center max-w-xl mx-auto">
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
              <DropdownMenuItem onClick={handleSignOut} className="px-5 py-3 text-gray-700 font-hakgyoansim text-base hover:bg-orange-100/60 hover:text-orange-500 rounded-b-2xl cursor-pointer focus:bg-orange-100/60 focus:text-orange-500 active:bg-orange-100/60 active:text-orange-500">
                로그아웃
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 text-orange-400 hover:bg-orange-100/60 rounded-full shadow font-hakgyoansim"
            onClick={() => navigate('/statistics')}
          >
            <BarChart2 className="h-6 w-6" />
          </Button>
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
            <EmotionCalendar
              emotionData={emotionData}
              onDateSelect={handleDateSelect}
            />
        </motion.div>
        {/* 일기장 섹션 */}
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
                className="text-base font-hakgyoansim text-gray-500 hover:bg-orange-100/60 hover:text-orange-500"
                onClick={() => navigate('/diaries')}
              >
                전체보기
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-base font-hakgyoansim text-gray-600 hover:bg-orange-100/60 hover:text-orange-500"
                onClick={() => setShowBookmarkDialog(true)}
              >
                <Plus className="h-5 w-5 mr-1" />
                새 일기장
              </Button>
            </div>
          </div>
          <div className="relative">
            <Swiper
              modules={[Pagination]}
              spaceBetween={24}
              slidesPerView={3}
              centeredSlides={false}
              loop={false}
              pagination={{
                clickable: true,
                bulletClass: 'custom-swiper-bullet',
                bulletActiveClass: 'custom-swiper-bullet-active',
                renderBullet: (index, className) => `<span class=\"${className}\"></span>`
              }}
              breakpoints={{
                0: { slidesPerView: 1, spaceBetween: 12 },
                640: { slidesPerView: 2, spaceBetween: 16 },
                1024: { slidesPerView: 3, spaceBetween: 24 },
              }}
              style={{ paddingBottom: '2.2rem' }}
            >
              {diaries.map((diary) => (
                <SwiperSlide key={diary.id}>
                  <div
                    className="relative rounded-2xl overflow-hidden shadow-lg cursor-pointer"
                    style={{ aspectRatio: '4/3', width: '100%', maxWidth: 400, margin: '0 auto' }}
                    onClick={() => navigate(`/diarybook/${diary.id}`)}
                  >
                    <img
                      src={diary.image}
                      alt={diary.title}
                      className="w-full h-full object-cover"
                    />
                    {/* 텍스트 오버레이 */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-4 py-3">
                      <h3 className="text-white text-base font-bold mb-1 font-hakgyoansim line-clamp-1">{diary.title}</h3>
                      <p className="text-white/80 text-xs mb-1 font-hakgyoansim line-clamp-2">{diary.description}</p>
                      <div className="flex items-center text-xs text-white/90 font-hakgyoansim">
                        <BookMarked className="h-4 w-4 mr-1" />
                        {diary.count}개의 일기
                      </div>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
            {/* 인디케이터 스타일 */}
            <style>{`
              .custom-swiper-bullet {
                display: inline-block;
                width: 7px;
                height: 7px;
                background: #e0e0e0;
                border-radius: 50%;
                margin: 0 5px;
                opacity: 0.7;
                transition: background 0.2s;
              }
              .custom-swiper-bullet-active {
                background: #EB5405;
                opacity: 1;
              }
            `}</style>
          </div>
        </motion.div>
      </div>
      {/* 기록 유도 모달 */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md font-hakgyoansim">
          <DialogHeader>
            <DialogTitle>오늘의 감정을 기록해보세요</DialogTitle>
            <DialogDescription>
              {selectedDate ? selectedDate.toLocaleDateString('ko-KR') : '오늘'}의 하루는 어땠나요?
              음성으로 간편하게 기록해보세요.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowDialog(false)} className="font-hakgyoansim hover:bg-orange-100/60 hover:text-orange-500">
              나중에
            </Button>
            <Button
              onClick={handleStartRecording}
              style={{ backgroundColor: '#EB5405' }}
              className="font-hakgyoansim text-white hover:bg-orange-100/60 hover:text-white"
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
              특별한 주제로 일기장을 만들어보세요.<br/>
              커버사진은 필수로 선택해야 해요.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="block text-sm font-bold mb-1">제목 <span className="text-orange-500">*</span></label>
              <input type="text" value={diaryTitle} onChange={e=>setDiaryTitle(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 font-hakgyoansim focus:border-orange-400 focus:ring-orange-100" placeholder="일기장 제목" maxLength={20} />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">설명</label>
              <input type="text" value={diaryDesc} onChange={e=>setDiaryDesc(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 font-hakgyoansim focus:border-orange-400 focus:ring-orange-100" placeholder="일기장 설명 (선택)" maxLength={40} />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">커버사진 <span className="text-orange-500">*</span></label>
              <div className="flex flex-wrap gap-2 mb-2">
                {defaultCovers.map((img, idx) => (
                  <button type="button" key={idx} onClick={()=>handleDefaultCover(img)}
                    className={`w-16 h-16 rounded-xl border-2 ${coverType==='default'&&selectedCover===img?'border-orange-500':'border-transparent'} overflow-hidden shadow hover:scale-105 transition`}
                  >
                    <img src={img} alt={`커버${idx+1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
                <label className="w-16 h-16 rounded-xl border-2 border-dashed border-orange-200 flex items-center justify-center cursor-pointer bg-orange-50 hover:bg-orange-100/60 shadow">
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  <span className="text-xs text-orange-400 font-bold">내 사진<br/>업로드</span>
                </label>
              </div>
              {/* 업로드 미리보기 */}
              {coverType==='upload' && selectedCover && (
                <div className="mb-2">
                  <img src={selectedCover} alt="업로드 미리보기" className="w-32 h-20 object-cover rounded-lg border shadow" />
                  <button type="button" onClick={()=>{setCoverType(null);setSelectedCover("");setUploadedFile(null);}} className="ml-2 text-xs text-gray-500 underline">삭제</button>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setShowBookmarkDialog(false)} className="font-hakgyoansim hover:bg-orange-100/60 hover:text-orange-500">
              취소
            </Button>
            <Button
              onClick={handleCreateDiary}
              style={{ backgroundColor: '#EB5405' }}
              className="font-hakgyoansim text-white hover:bg-orange-100/60 hover:text-white"
              disabled={!diaryTitle || !selectedCover}
            >
              만들기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}