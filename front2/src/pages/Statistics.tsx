import { useState } from "react";
import { TrendingUp, Calendar, Heart, BarChart3, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";

interface EmotionStat {
  emotion: string;
  name: string;
  emoji: string;
  count: number;
  percentage: number;
  color: string;
}

interface MoodTrend {
  date: string;
  mood: number; // 1-5 scale
}

const Statistics = () => {
  const navigate = useNavigate();

  // 샘플 데이터
  const emotionStats: EmotionStat[] = [
    { emotion: "happy", name: "기쁨", emoji: "😊", count: 12, percentage: 40, color: "bg-happy" },
    { emotion: "calm", name: "평온", emoji: "😌", count: 8, percentage: 27, color: "bg-calm" },
    { emotion: "excited", name: "설렘", emoji: "🤗", count: 5, percentage: 17, color: "bg-excited" },
    { emotion: "sad", name: "슬픔", emoji: "😢", count: 3, percentage: 10, color: "bg-sad" },
    { emotion: "anxious", name: "불안", emoji: "😰", count: 2, percentage: 6, color: "bg-anxious" },
  ];

  const moodTrends: MoodTrend[] = [
    { date: "12/01", mood: 4 },
    { date: "12/02", mood: 3 },
    { date: "12/03", mood: 5 },
    { date: "12/04", mood: 4 },
    { date: "12/05", mood: 2 },
    { date: "12/06", mood: 3 },
    { date: "12/07", mood: 4 },
  ];

  const totalEntries = emotionStats.reduce((sum, stat) => sum + stat.count, 0);
  const averageMood = moodTrends.reduce((sum, trend) => sum + trend.mood, 0) / moodTrends.length;

  const getMoodColor = (mood: number) => {
    if (mood >= 4.5) return "text-happy";
    if (mood >= 3.5) return "text-calm";
    if (mood >= 2.5) return "text-excited";
    if (mood >= 1.5) return "text-sad";
    return "text-anxious";
  };

  const getMoodEmoji = (mood: number) => {
    if (mood >= 4.5) return "😊";
    if (mood >= 3.5) return "😌";
    if (mood >= 2.5) return "😐";
    if (mood >= 1.5) return "😢";
    return "😰";
  };

  return (
    <div
      className="min-h-screen font-hakgyoansim"
      style={{
        backgroundImage: `
          linear-gradient(135deg, #F9F9FA 0%, #FFF9F4 100%),
          radial-gradient(circle at 20% 80%, rgba(235, 84, 5, 0.03) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(255, 226, 122, 0.03) 0%, transparent 50%)
        `
      }}
    >
      {/* 헤더 */}
      <div className="w-full max-w-2xl mx-auto pt-12 px-6">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="text-orange-500 hover:bg-orange-100/60 rounded-full font-hakgyoansim px-4 py-2"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            뒤로 가기
          </Button>
          <div className="flex-1" />
        </div>
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-orange-500 font-hakgyoansim mb-2">감정 통계</h1>
          <p className="text-lg text-gray-500 font-hakgyoansim">나의 감정 패턴을 확인해보세요</p>
        </div>
      </div>

      <div className="px-6 max-w-2xl mx-auto space-y-8 pb-16">
            {/* 주요 지표 */}
            <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/80 rounded-xl p-6 shadow text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-orange-400" />
              <span className="text-base text-orange-500 font-bold">총 일기 수</span>
            </div>
            <div className="text-2xl font-bold text-gray-800">{totalEntries}</div>
            <div className="text-xs text-gray-400">이번 달</div>
                    </div>
          <div className="bg-white/80 rounded-xl p-6 shadow text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Heart className="w-5 h-5 text-orange-400" />
              <span className="text-base text-orange-500 font-bold">평균 기분</span>
            </div>
            <div className={`text-2xl font-bold ${getMoodColor(averageMood)}`}>{averageMood.toFixed(1)} {getMoodEmoji(averageMood)}</div>
            <div className="text-xs text-gray-400">5점 만점</div>
              </div>
            </div>

        {/* 감정 분포 */}
        <div className="bg-white/80 rounded-xl p-6 shadow">
          <h3 className="font-bold text-orange-500 mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-orange-400" />감정 분포</h3>
          <div className="grid grid-cols-3 gap-4">
                {emotionStats.map((stat) => (
                  <div key={stat.emotion} className="text-center">
                    <div className={`w-16 h-16 rounded-full ${stat.color} flex items-center justify-center text-2xl mx-auto mb-2`}>
                      {stat.emoji}
                    </div>
                    <div className="text-sm font-medium">{stat.name}</div>
                <div className="text-xs text-gray-400">{stat.percentage}%</div>
                  </div>
                ))}
              </div>
            </div>

        {/* 최근 기분 변화 */}
        <div className="bg-white/80 rounded-xl p-6 shadow">
          <h3 className="font-bold text-orange-500 mb-4">최근 기분 변화</h3>
              <div className="space-y-3">
                {moodTrends.map((trend, index) => (
                  <div key={index} className="flex items-center gap-4">
                <div className="w-12 text-sm text-gray-400">{trend.date}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                    <div className="w-full bg-gray-100 rounded-full h-2">
                          <div 
                        className="bg-orange-200 h-2 rounded-full" 
                            style={{ width: `${(trend.mood / 5) * 100}%` }}
                          ></div>
                        </div>
                    <span className={`text-sm font-medium ${getMoodColor(trend.mood)}`}>{trend.mood}.0</span>
                      </div>
                    </div>
                    <span className="text-lg">{getMoodEmoji(trend.mood)}</span>
                  </div>
                ))}
              </div>
            </div>
      </div>
    </div>
  );
};

export default Statistics;