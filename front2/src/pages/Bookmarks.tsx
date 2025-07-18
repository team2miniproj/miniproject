import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BookMarked, Search, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import Bookmark1 from '../assets/bookmark1.jpg';
import Bookmark2 from '../assets/bookmark2.jpg';
import Bookmark3 from '../assets/bookmark3.png';
import Bookmark4 from '../assets/bookmark4.png';
import Bookmark5 from '../assets/bookmark5.png';
import Bookmark6 from '../assets/bookmark6.png';
import Bookmark7 from '../assets/bookmark7.png';
import Bookmark8 from '../assets/bookmark8.png';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";


// 임시 데이터 (나중에 실제 데이터로 대체)
const initialDiaries = [
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
  {
    id: 4,
    title: "행복한 하루",
    image: Bookmark4,
    description: "웃음이 가득했던 날",
    count: 2,
  },
];

const LOCAL_KEY = "diarybooks";

export default function Diaries() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [diaries, setDiaries] = useState(initialDiaries);
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // localStorage에서 불러오기
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_KEY);
    if (saved) {
      try {
        setDiaries(JSON.parse(saved));
      } catch {}
    }
  }, []);
  // localStorage에 저장
  useEffect(() => {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(diaries));
  }, [diaries]);

  // 삭제 기능
  const handleDeleteDiary = (id: number) => {
    if (window.confirm("정말 삭제할까요?")) {
      setDiaries(diaries.filter(d => d.id !== id));
    }
  };

  // 일기장 생성 관련 상태
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [diaryTitle, setDiaryTitle] = useState("");
  const [diaryDesc, setDiaryDesc] = useState("");
  const [coverType, setCoverType] = useState<'default'|'upload'|null>(null);
  const [selectedCover, setSelectedCover] = useState<string>("");
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
  // 일기장 생성 완료 핸들러(임시)
  const handleCreateDiary = () => {
    if (!diaryTitle || !selectedCover) return;
    // 새 일기장 객체 생성
    const newDiary = {
      id: Date.now(),
      title: diaryTitle,
      image: selectedCover,
      description: diaryDesc,
      count: 0,
    };
    setDiaries([newDiary, ...diaries]);
    setShowCreateDialog(false);
    setDiaryTitle("");
    setDiaryDesc("");
    setSelectedCover("");
    setCoverType(null);
    setUploadedFile(null);
    // 알림 등 추가 가능
  };

  // 체크박스 토글
  const toggleSelect = (id: number) => {
    setSelectedIds(selectedIds.includes(id)
      ? selectedIds.filter(i => i !== id)
      : [...selectedIds, id]);
  };
  // 전체 선택/해제
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredDiaries.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredDiaries.map(d => d.id));
    }
  };
  // 선택 삭제 실행
  const handleDeleteSelected = () => {
    setDiaries(diaries.filter(d => !selectedIds.includes(d.id)));
    setSelectedIds([]);
    setDeleteMode(false);
    setShowDeleteDialog(false);
  };

  const filteredDiaries = diaries.filter(diary =>
    diary.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-[#FFF9F4] to-[#F9F9FA] p-6 flex flex-col items-center"
    >
      {/* 헤더 */}
      <div className="flex items-center gap-4 mb-8 w-full max-w-3xl">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 text-orange-400 hover:bg-orange-100/60 rounded-full shadow font-hakgyoansim"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-2xl font-bold font-hakgyoansim text-orange-500">나의 일기장</h1>
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto text-base font-hakgyoansim text-gray-600 hover:bg-orange-100/60 hover:text-orange-500"
          onClick={()=>setShowCreateDialog(true)}
        >
          + 새 일기장
        </Button>
        <Button
          variant={deleteMode ? "default" : "ghost"}
          size="sm"
          className={`text-base font-hakgyoansim ml-2 ${deleteMode ? 'bg-orange-100/60 text-orange-500' : 'text-gray-600 hover:bg-orange-100/60 hover:text-orange-500'}`}
          onClick={() => {
            setDeleteMode(!deleteMode);
            setSelectedIds([]);
          }}
        >
          {deleteMode ? "삭제 취소" : "삭제"}
        </Button>
        {deleteMode && (
          <Button
            variant="destructive"
            size="sm"
            className="ml-2 text-base font-hakgyoansim bg-orange-500 text-white hover:bg-orange-600"
            disabled={selectedIds.length === 0}
            onClick={()=>setShowDeleteDialog(true)}
          >
            선택 삭제
          </Button>
        )}
      </div>

      {/* 새 일기장 생성 모달 */}
      {showCreateDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md font-hakgyoansim relative">
            <button className="absolute top-3 right-3 text-gray-400 hover:text-orange-500" onClick={()=>setShowCreateDialog(false)}>&times;</button>
            <h2 className="text-xl font-bold mb-2 text-orange-500">새 일기장 만들기</h2>
            <p className="text-sm mb-4 text-gray-600">특별한 주제로 일기장을 만들어보세요.<br/>커버사진은 필수로 선택해야 해요.</p>
            <div className="space-y-4">
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
            <div className="flex gap-2 mt-6 justify-end">
              <Button variant="outline" onClick={()=>setShowCreateDialog(false)} className="font-hakgyoansim hover:bg-orange-100/60 hover:text-orange-500">
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
            </div>
          </div>
        </div>
      )}

      {/* 검색 */}
      <div className="relative mb-10 w-full max-w-3xl">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
          type="text"
          placeholder="일기장 검색하기"
          className="pl-12 bg-white/80 rounded-xl font-hakgyoansim shadow"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* 일기장 그리드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 w-full max-w-3xl">
        {filteredDiaries.map((diary) => (
          <motion.div
            key={diary.id}
            whileHover={{ y: -8, scale: 1.03 }}
            className={`relative group cursor-pointer ${deleteMode ? 'opacity-90' : ''}`}
            onClick={() => !deleteMode && navigate(`/diarybook/${diary.id}`)}
          >
            <div className="aspect-[3/4] rounded-2xl overflow-hidden shadow-xl bg-white/90 border-0 flex flex-col justify-end">
              <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/50 rounded-2xl" />
              <img
                src={diary.image}
                alt={diary.title}
                className="w-full h-full object-cover rounded-2xl"
              />
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white font-hakgyoansim">
                <h3 className="text-lg font-bold mb-1 drop-shadow">{diary.title}</h3>
                <p className="text-sm opacity-90 mb-1 drop-shadow">{diary.description}</p>
                <div className="flex items-center mt-1 text-xs opacity-80">
                  <BookMarked className="h-4 w-4 mr-1" />
                  {diary.count}개의 일기
                </div>
              </div>
              {deleteMode && (
                <input
                  type="checkbox"
                  checked={selectedIds.includes(diary.id)}
                  onChange={()=>toggleSelect(diary.id)}
                  className="absolute top-3 left-3 w-5 h-5 rounded border-2 border-orange-400 bg-white/80 focus:ring-orange-400"
                  style={{ boxShadow: '0 2px 8px rgba(235,84,5,0.08)' }}
                  onClick={e=>e.stopPropagation()}
                />
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* 삭제 확인 모달 (Home.tsx 스타일) */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md font-hakgyoansim">
          <DialogHeader>
            <DialogTitle>정말 삭제하시겠습니까?</DialogTitle>
            <DialogDescription>
              선택한 일기장은 복구할 수 없습니다.<br/>
              삭제하시려면 아래 버튼을 눌러주세요.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setShowDeleteDialog(false)} className="font-hakgyoansim hover:bg-orange-100/60 hover:text-orange-500">
              취소
            </Button>
            <Button
              onClick={handleDeleteSelected}
              style={{ backgroundColor: '#EB5405' }}
              className="font-hakgyoansim text-white hover:bg-orange-100/60 hover:text-white"
            >
              삭제하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
} 