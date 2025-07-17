import { useState } from "react";
import { motion } from "framer-motion";
import { BookMarked, Search, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import Bookmark1 from '../assets/bookmark1.jpg';
import Bookmark2 from '../assets/bookmark2.jpg';
import Bookmark3 from '../assets/bookmark3.png';
import Bookmark4 from '../assets/bookmark4.png';


// 임시 데이터 (나중에 실제 데이터로 대체)
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
  {
    id: 4,
    title: "행복한 하루",
    image: Bookmark4,
    description: "웃음이 가득했던 날",
    count: 2,
  },
];

export default function Bookmarks() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredBookmarks = sampleBookmarks.filter(bookmark =>
    bookmark.title.toLowerCase().includes(searchQuery.toLowerCase())
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
      </div>

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

      {/* 북마크 그리드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 w-full max-w-3xl">
        {filteredBookmarks.map((bookmark) => (
          <motion.div
            key={bookmark.id}
            whileHover={{ y: -8, scale: 1.03 }}
            className="relative group cursor-pointer"
            onClick={() => navigate(`/bookmark/${bookmark.id}`)}
          >
            <div className="aspect-[3/4] rounded-2xl overflow-hidden shadow-xl bg-white/90 border-0 flex flex-col justify-end">
              <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/50 rounded-2xl" />
              <img
                src={bookmark.image}
                alt={bookmark.title}
                className="w-full h-full object-cover rounded-2xl"
              />
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white font-hakgyoansim">
                <h3 className="text-lg font-bold mb-1 drop-shadow">{bookmark.title}</h3>
                <p className="text-sm opacity-90 mb-1 drop-shadow">{bookmark.description}</p>
                <div className="flex items-center mt-1 text-xs opacity-80">
                  <BookMarked className="h-4 w-4 mr-1" />
                  {bookmark.count}개의 일기
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
} 