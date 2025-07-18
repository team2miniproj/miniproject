import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Lock, Delete, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useLock } from "@/contexts/LockContext";

// 간단한 해시 함수 (Settings와 동일)
function simpleHash(str: string) {
  let hash = 0, i, chr;
  if (str.length === 0) return hash.toString();
  for (i = 0; i < str.length; i++) {
    chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return hash.toString();
}

const LockScreen = () => {
  const { currentUser } = useAuth();
  const { unlockApp } = useLock();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isShaking, setIsShaking] = useState(false);

  const handleNumberClick = (num: string) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      setError("");
      if (newPin.length === 4) {
        setTimeout(() => handleSubmit(newPin), 100);
      }
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setError("");
  };

  const handleClear = () => {
    setPin("");
    setError("");
  };

  const handleSubmit = async (pinToCheck: string) => {
    if (!currentUser || pinToCheck.length !== 4) {
      setError("4자리 비밀번호를 입력해주세요");
      return;
    }
    try {
      const lockRef = doc(db, "users", currentUser.uid, "security", "lock");
      const lockSnap = await getDoc(lockRef);
      if (lockSnap.exists()) {
        const lockData = lockSnap.data();
        const savedPin = lockData?.pin;
        if (savedPin === simpleHash(pinToCheck)) {
          unlockApp();
        } else {
          setError("잘못된 비밀번호입니다");
          setPin("");
          setIsShaking(true);
          setTimeout(() => setIsShaking(false), 500);
        }
      } else {
        setError("잠금 설정을 찾을 수 없습니다");
      }
    } catch (error) {
      console.error("PIN 확인 실패:", error);
      setError("오류가 발생했습니다");
    }
  };

  // 에러 발생 시 흔들기 효과
  useEffect(() => {
    if (error) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    }
  }, [error]);

  const numbers = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["", "0", "⌫"]
  ];

  return (
    <div
      className="fixed inset-0 flex flex-col font-hakgyoansim bg-[#F9F9FA]"
      style={{
        backgroundImage: `
          linear-gradient(135deg, #F9F9FA 0%, #FFF9F4 100%),
          radial-gradient(circle at 20% 80%, rgba(235, 84, 5, 0.03) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(255, 226, 122, 0.03) 0%, transparent 50%)
        `
      }}
    >
      {/* 상단 뒤로가기(필요시) */}
      <div className="flex items-center justify-between p-4 pt-8">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 text-orange-400 hover:bg-orange-100/60 rounded-full font-hakgyoansim"
          style={{ visibility: 'hidden' }} // 필요시 visible로 변경
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1" />
        {pin.length > 0 && (
          <Button
            variant="ghost"
            onClick={handleClear}
            className="text-orange-600 hover:text-orange-700 font-hakgyoansim"
          >
            전체 삭제
          </Button>
        )}
      </div>
      {/* 메인 컨텐츠 */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ 
            opacity: 1, 
            y: 0,
            x: isShaking ? [-10, 10, -10, 10, 0] : 0
          }}
          transition={{ duration: 0.3 }}
          className="text-center mb-12"
        >
          <div className="flex flex-col items-center mb-4">
            <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center mb-2 border-2 border-orange-300">
              <Lock className="w-8 h-8 text-orange-400" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2 font-hakgyoansim">잠금 해제</h1>
          <p className="text-gray-600 text-lg font-hakgyoansim">4자리 비밀번호를 입력해주세요</p>
        </motion.div>
        {/* PIN 입력 표시 */}
        <div className="flex justify-center mb-12">
          <div className="flex gap-8">
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0.8 }}
                animate={{ 
                  scale: i < pin.length ? 1.15 : 1,
                  backgroundColor: i < pin.length ? '#ea580c22' : "#fff0"
                }}
                transition={{ duration: 0.2 }}
                className={`w-8 h-8 rounded-full border-2 ${i < pin.length ? 'border-orange-400' : 'border-orange-200'} shadow font-hakgyoansim`}
              />
            ))}
          </div>
        </div>
        {/* 숫자패드 */}
        <div className="flex flex-col items-center gap-4">
          {numbers.map((row, rowIdx) => (
            <div key={rowIdx} className="flex gap-8">
              {row.map((num, colIdx) => (
                <button
                  key={colIdx}
                  onClick={() => num && num !== "⌫" && handleNumberClick(num)}
                  className={`w-16 h-16 flex items-center justify-center rounded-full text-2xl font-bold font-hakgyoansim bg-white/80 shadow transition-all duration-200
                    ${num && num !== "⌫" ? "hover:bg-orange-50 hover:text-orange-600 active:bg-orange-100" : ""}
                    ${num === "⌫" ? "hover:bg-red-50 hover:text-red-600" : ""}
                    ${num === "" ? "opacity-0 pointer-events-none" : ""}
                  `}
                  style={{
                    border: num && num !== "" ? '2px solid #f3f4f6' : 'none',
                  }}
                  tabIndex={num === "" ? -1 : 0}
                  aria-label={num === "⌫" ? "지우기" : num}
                  onMouseDown={num === "⌫" ? handleDelete : undefined}
                >
                  {num === "⌫" ? (
                    <Delete className="w-6 h-6" />
                  ) : (
                    num
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>
        {/* 에러 메시지 */}
        {error && (
          <div className="mt-8 text-red-500 text-base font-hakgyoansim animate-shake">{error}</div>
        )}
      </div>
      {/* 안내문구 */}
      <div className="mb-8 text-xs text-[#AAA] font-hakgyoansim text-center">앱 보안을 위해 비밀번호를 입력해주세요</div>
    </div>
  );
};

export default LockScreen; 
