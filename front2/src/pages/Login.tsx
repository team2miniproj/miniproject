/**
 * 로그인 페이지 - 감성적 드로잉 테두리 적용
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import logo from '../assets/logo.png';

export default function Login() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) navigate("/");
      } catch (error) {
        setError("Google 로그인에 실패했습니다: " + error.message);
        setIsLoading(false);
      }
    };
    handleRedirectResult();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) navigate("/");
    });
    return unsubscribe;
  }, [navigate]);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setError("");
      try {
        const result = await signInWithPopup(auth, googleProvider);
        navigate("/");
      } catch (popupError) {
        if (popupError.code === 'auth/popup-blocked' || 
            popupError.code === 'auth/popup-closed-by-user' ||
            popupError.message.includes('Cross-Origin-Opener-Policy')) {
          await signInWithRedirect(auth, googleProvider);
        } else {
          throw popupError;
        }
      }
    } catch (error) {
      setError("Google 로그인에 실패했습니다: " + error.message);
      setIsLoading(false);
    }
  };

  const handleEmailLogin = () => {
    navigate("/email-login");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen relative overflow-hidden bg-[#FFF9F4]">
      {/* 배경 질감 */}
      <div 
        className="absolute inset-0 z-0"
        style={{ 
          backgroundColor: '#FFF9F4',
          backgroundImage: `
            radial-gradient(circle at 30% 40%, rgba(255, 255, 255, 0.6) 0%, transparent 60%),
            radial-gradient(circle at 70% 60%, rgba(255, 255, 255, 0.5) 0%, transparent 50%),
            radial-gradient(circle at 20% 80%, rgba(255, 255, 255, 0.4) 0%, transparent 40%),
            radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.3) 0%, transparent 45%),
            radial-gradient(ellipse 100px 30px at 20% 30%, rgba(0,0,0,0.02) 0%, transparent 50%),
            radial-gradient(ellipse 80px 25px at 80% 70%, rgba(0,0,0,0.015) 0%, transparent 50%),
            radial-gradient(ellipse 120px 40px at 40% 80%, rgba(0,0,0,0.01) 0%, transparent 50%),
            radial-gradient(ellipse 60px 20px at 70% 20%, rgba(0,0,0,0.012) 0%, transparent 50%),
            radial-gradient(ellipse 90px 35px at 10% 60%, rgba(0,0,0,0.018) 0%, transparent 50%),
            repeating-linear-gradient(15deg,transparent,transparent 3px,rgba(0,0,0,0.006) 3px,rgba(0,0,0,0.006) 4px),
            repeating-linear-gradient(-25deg,transparent,transparent 4px,rgba(0,0,0,0.004) 4px,rgba(0,0,0,0.004) 5px),
            repeating-linear-gradient(45deg,transparent,transparent 5px,rgba(0,0,0,0.003) 5px,rgba(0,0,0,0.003) 6px),
            linear-gradient(135deg, rgba(255, 249, 244, 0.95) 0%, rgba(249, 249, 250, 0.85) 50%, rgba(255, 249, 244, 0.9) 100%)
          `,
          backgroundSize: '300px 300px, 250px 250px, 200px 200px, 280px 280px, 200px 200px, 160px 160px, 240px 240px, 120px 120px, 180px 180px, 8px 8px, 10px 10px, 12px 12px, 100% 100%'
        }}
      />
      <div className="relative z-10 w-full max-w-md flex flex-col items-center justify-center" style={{minHeight:'70vh'}}>
        {/* 타이틀 */}
        <img
          src={logo}
          alt="오늘어때?"
          width={380}
          height={120}
          className="mx-auto mb-2 select-none"
          style={{ display: 'block', maxWidth: '98%', height: 'auto' }}
        />
        {/* 서브 문구 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mb-12 text-center"
        >
          <p className="text-xl font-hakgyoansim text-gray-800 mb-1">오늘 하루, 어땠어?</p>
          <p className="text-lg font-hakgyoansim text-gray-600">너의 감정을 말해줘</p>
        </motion.div>
        {/* 에러 메시지 */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg"
          >
            {error}
          </motion.div>
        )}
        {/* 버튼 영역 */}
        <div className="w-full flex flex-col gap-7 items-center">
          {/* 이메일 로그인 버튼 */}
          <button
            onClick={handleEmailLogin}
            disabled={isLoading}
            className="w-full h-16 text-xl font-bold font-hakgyoansim rounded-[2rem] shadow-lg transition-all duration-300 flex items-center justify-center focus:outline-none bg-orange-500 hover:bg-orange-600 text-white"
            style={{
              letterSpacing: '0.08em',
              border: 'none',
              padding: 0,
              overflow: 'hidden',
            }}
          >
            이메일로 로그인
          </button>
          {/* 구글 로그인 버튼 - 드로잉 테두리 */}
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full h-16 text-xl font-bold font-hakgyoansim rounded-[2rem] shadow-lg transition-all duration-300 flex items-center justify-center focus:outline-none bg-white hover:bg-orange-50 text-orange-500 relative"
            style={{
              letterSpacing: '0.08em',
              border: 'none',
              padding: 0,
              overflow: 'visible',
            }}
          >
            {/* 드로잉 테두리 배경 */}
            <img
              src="/crayon-border.png"
              alt=""
              aria-hidden
              className="absolute inset-0 w-full h-full pointer-events-none select-none"
              style={{
                borderRadius: '2rem',
                zIndex: 1,
              }}
            />
            {/* 흰 배경 + 텍스트 */}
            <span
              className="relative z-10 flex items-center justify-center w-full h-full"
              style={{
                background: 'white',
                borderRadius: '2rem',
                height: '100%',
                width: '100%',
              }}
            >
              {isLoading ? "로그인 중..." : "Google로 로그인"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
} 