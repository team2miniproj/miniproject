import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookMarked } from "lucide-react";

const LOCAL_KEY = "diarybooks";

// 임시 일기 데이터 (실제 연동 시 교체)
const sampleEntries = [
  { id: 1, title: "오늘의 일기", date: "2024-06-10", summary: "오늘은 날씨가 맑아서 기분이 좋았다.", emotion: "happy" },
  { id: 2, title: "친구와 놀기", date: "2024-06-09", summary: "친구와 공원에서 산책했다.", emotion: "happy" },
  { id: 3, title: "비오는 날", date: "2024-06-08", summary: "비가 와서 집에서 책을 읽었다.", emotion: "calm" },
];

export default function DiaryBookDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [diarybook, setDiarybook] = useState<any>(null);
  const [entries, setEntries] = useState<any[]>([]);

  useEffect(() => {
    // localStorage에서 일기장 정보 불러오기
    const saved = localStorage.getItem(LOCAL_KEY);
    if (saved) {
      try {
        const books = JSON.parse(saved);
        const found = books.find((b: any) => String(b.id) === String(id));
        setDiarybook(found);
      } catch {}
    }
    // 임시: 샘플 일기 데이터 사용 (실제 연동 시 해당 일기장에 속한 일기만 필터)
    setEntries(sampleEntries);
  }, [id]);

  if (!diarybook) {
    return (
      <div className="min-h-screen flex items-center justify-center font-hakgyoansim bg-orange-50">
        <div className="text-center">
          <p className="text-lg text-gray-500">일기장을 찾을 수 없습니다.</p>
          <Button onClick={()=>navigate(-1)} className="mt-4 bg-orange-100 text-orange-500 font-hakgyoansim rounded-full px-6 py-2 shadow hover:bg-orange-200">뒤로가기</Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-[#FFF9F4] to-[#F9F9FA] font-hakgyoansim"
      style={{
        backgroundImage: `
          linear-gradient(135deg, #F9F9FA 0%, #FFF9F4 100%),
          radial-gradient(circle at 20% 80%, rgba(235, 84, 5, 0.03) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(255, 226, 122, 0.03) 0%, transparent 50%)
        `
      }}
    >
      {/* 상단 정보 */}
      <div className="max-w-2xl mx-auto px-4 pt-8 pb-4 flex items-center gap-4">
        <Button variant="ghost" size="icon" className="h-10 w-10 text-orange-400 hover:bg-orange-100/60 rounded-full shadow font-hakgyoansim" onClick={()=>navigate(-1)}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <img src={diarybook.image} alt="커버" className="w-20 h-28 rounded-2xl object-cover shadow border border-orange-100 bg-white" />
        <div className="flex-1 ml-4">
          <h2 className="text-2xl font-bold text-orange-500 mb-1 font-hakgyoansim drop-shadow">{diarybook.title}</h2>
          <p className="text-base text-gray-700 mb-1 font-hakgyoansim">{diarybook.description}</p>
          <div className="flex items-center gap-2 text-sm text-gray-500 font-hakgyoansim">
            <BookMarked className="h-4 w-4 mr-1" />
            {diarybook.count ?? entries.length}개의 일기
          </div>
        </div>
      </div>
      {/* 일기 리스트 */}
      <div className="max-w-2xl mx-auto px-4 pb-12">
        <h3 className="text-lg font-bold text-gray-800 mb-4 font-hakgyoansim">일기 목록</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {entries.map(entry => (
            <div key={entry.id} className="bg-white/90 rounded-2xl shadow-lg p-5 flex flex-col gap-2 border border-orange-100 hover:shadow-xl transition cursor-pointer"
              onClick={() => navigate(`/diary/${entry.id}`)}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{entry.emotion === 'happy' ? '😊' : entry.emotion === 'calm' ? '😌' : '🙂'}</span>
                <span className="font-bold text-base text-orange-500 font-hakgyoansim">{entry.title}</span>
              </div>
              <div className="text-gray-600 text-sm font-hakgyoansim">{entry.date}</div>
              <div className="text-gray-700 text-base font-hakgyoansim line-clamp-2">{entry.summary}</div>
            </div>
          ))}
        </div>
        {entries.length === 0 && (
          <div className="text-center text-gray-400 py-10 font-hakgyoansim">아직 일기가 없습니다.</div>
        )}
      </div>
    </div>
  );
} 