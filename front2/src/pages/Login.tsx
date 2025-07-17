import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";

export default function Login() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    console.log("🔐 Login: Setting up auth listeners");
    
    // 리다이렉트 결과 처리
    const handleRedirectResult = async () => {
      try {
        console.log("🔐 Login: Checking redirect result...");
        const result = await getRedirectResult(auth);
        if (result) {
          console.log("✅ Login: Google login successful via redirect:", result.user.email);
          navigate("/");
        } else {
          console.log("ℹ️ Login: No redirect result found");
        }
      } catch (error) {
        console.error("❌ Login: Google login redirect failed:", error);
        setError("Google 로그인에 실패했습니다: " + error.message);
        setIsLoading(false);
      }
    };

    handleRedirectResult();

    // 인증 상태 변경 감지
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("🔐 Login: Auth state changed:", user ? `User: ${user.email}` : "No user");
      if (user) {
        console.log("✅ Login: User authenticated, navigating to home");
        navigate("/");
      }
    });

    return unsubscribe;
  }, [navigate]);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setError("");
      
      console.log("🔐 Login: Starting Google login");
      
      // 먼저 popup 방식 시도
      try {
        console.log("🔐 Login: Trying popup method...");
        const result = await signInWithPopup(auth, googleProvider);
        console.log("✅ Login: Popup login successful:", result.user.email);
        navigate("/");
      } catch (popupError) {
        console.warn("⚠️ Login: Popup failed, trying redirect:", popupError);
        
        // popup 실패 시 redirect 방식 시도
        if (popupError.code === 'auth/popup-blocked' || 
            popupError.code === 'auth/popup-closed-by-user' ||
            popupError.message.includes('Cross-Origin-Opener-Policy')) {
          
          console.log("🔐 Login: Switching to redirect method");
          await signInWithRedirect(auth, googleProvider);
          console.log("🔐 Login: Redirect initiated");
        } else {
          throw popupError;
        }
      }
    } catch (error) {
      console.error("❌ Login: Google login failed:", error);
      setError("Google 로그인에 실패했습니다: " + error.message);
      setIsLoading(false);
    }
  };

  const handleEmailLogin = () => {
    navigate("/email-login");
  };

  return (
    <div className="flex items-center justify-center min-h-screen relative overflow-hidden">
      {/* 배경 - 구겨진 종이 질감 */}
      <div 
        className="absolute inset-0"
        style={{ 
          backgroundColor: '#FFF9F4',
          backgroundImage: `
            /* 밝은 흰색 오버레이 */
            radial-gradient(circle at 30% 40%, rgba(255, 255, 255, 0.6) 0%, transparent 60%),
            radial-gradient(circle at 70% 60%, rgba(255, 255, 255, 0.5) 0%, transparent 50%),
            radial-gradient(circle at 20% 80%, rgba(255, 255, 255, 0.4) 0%, transparent 40%),
            radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.3) 0%, transparent 45%),
            
            /* 구겨진 종이 주름 효과 */
            radial-gradient(ellipse 100px 30px at 20% 30%, rgba(0,0,0,0.02) 0%, transparent 50%),
            radial-gradient(ellipse 80px 25px at 80% 70%, rgba(0,0,0,0.015) 0%, transparent 50%),
            radial-gradient(ellipse 120px 40px at 40% 80%, rgba(0,0,0,0.01) 0%, transparent 50%),
            radial-gradient(ellipse 60px 20px at 70% 20%, rgba(0,0,0,0.012) 0%, transparent 50%),
            radial-gradient(ellipse 90px 35px at 10% 60%, rgba(0,0,0,0.018) 0%, transparent 50%),
            
            /* 미세한 구겨진 선들 */
            repeating-linear-gradient(
              15deg,
              transparent,
              transparent 3px,
              rgba(0,0,0,0.006) 3px,
              rgba(0,0,0,0.006) 4px
            ),
            repeating-linear-gradient(
              -25deg,
              transparent,
              transparent 4px,
              rgba(0,0,0,0.004) 4px,
              rgba(0,0,0,0.004) 5px
            ),
            repeating-linear-gradient(
              45deg,
              transparent,
              transparent 5px,
              rgba(0,0,0,0.003) 5px,
              rgba(0,0,0,0.003) 6px
            ),
            
            /* 부드러운 그라데이션 오버레이 */
            linear-gradient(135deg, rgba(255, 249, 244, 0.95) 0%, rgba(249, 249, 250, 0.85) 50%, rgba(255, 249, 244, 0.9) 100%)
          `,
          backgroundSize: '300px 300px, 250px 250px, 200px 200px, 280px 280px, 200px 200px, 160px 160px, 240px 240px, 120px 120px, 180px 180px, 8px 8px, 10px 10px, 12px 12px, 100% 100%'
        }}
      />

      <div className="relative z-10 w-full max-w-md p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          {/* 앱 로고 - 손글씨 느낌 */}
          <h1 className="text-5xl font-bold tracking-tight mb-4 font-hakgyoansim" style={{ 
            color: '#EB5405',
            textShadow: '2px 2px 4px rgba(235, 84, 5, 0.1)',
            transform: 'rotate(-2deg)'
          }}>
            오늘어때?
          </h1>
          
          {/* 서브 문구들 */}
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-lg text-gray-700 mb-2 font-medium font-hakgyoansim"
          >
            오늘 하루, 어땠어?
          </motion.p>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-base text-gray-600 font-hakgyoansim"
          >
            너의 감정을 말해줘
          </motion.p>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg"
          >
            {error}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="space-y-4"
        >
          {/* 일반 로그인 버튼 - 주황색 배경 */}
          <Button
            onClick={handleEmailLogin}
            className="w-full h-14 text-lg font-medium font-hakgyoansim transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
            style={{ 
              backgroundColor: '#EB5405',
              border: 'none'
            }}
            disabled={isLoading}
          >
            이메일로 로그인
          </Button>
          
          {/* 구글 로그인 버튼 - 흰 배경 + 크레파스 테두리 */}
          <Button
            onClick={handleGoogleLogin}
            variant="outline"
            className="w-full h-14 text-lg font-medium font-hakgyoansim transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
            style={{ 
              backgroundColor: 'white',
              border: '3px dashed #EB5405',
              color: '#EB5405',
              borderRadius: '12px',
              filter: 'blur(0.2px)',
              boxShadow: '0 0 0 2px #EB5405 inset, 0 2px 8px rgba(235, 84, 5, 0.08)',
              borderStyle: 'dashed',
              borderWidth: '3px',
              borderColor: '#EB5405'
            }}
            disabled={isLoading}
          >
            {isLoading ? "로그인 중..." : "Google로 로그인"}
          </Button>
        </motion.div>
      </div>
    </div>
  );
} 