import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div
      className="min-h-screen flex items-center justify-center font-hakgyoansim"
      style={{
        backgroundImage: `
          linear-gradient(135deg, #F9F9FA 0%, #FFF9F4 100%),
          radial-gradient(circle at 20% 80%, rgba(235, 84, 5, 0.03) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(255, 226, 122, 0.03) 0%, transparent 50%)
        `
      }}
    >
      <div className="text-center p-10 rounded-3xl shadow-lg bg-white/80 border border-orange-100">
        <h1 className="text-7xl font-hakgyoansim text-orange-500 mb-4 drop-shadow-lg">404</h1>
        <p className="text-2xl text-gray-700 mb-6 font-hakgyoansim">페이지를 찾을 수 없습니다</p>
        <p className="text-base text-gray-500 mb-8 font-hakgyoansim">요청하신 페이지가 존재하지 않거나,<br/>주소가 잘못 입력되었습니다.</p>
        <a
          href="/"
          className="inline-block px-8 py-3 rounded-full bg-orange-100 text-orange-600 font-hakgyoansim text-lg shadow hover:bg-orange-200 hover:text-orange-700 transition-all"
        >
          홈으로 가기
        </a>
      </div>
    </div>
  );
};

export default NotFound;
