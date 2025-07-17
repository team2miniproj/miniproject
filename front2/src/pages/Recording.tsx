import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, ArrowLeft, Play, Pause, Square, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Recording = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingPhase, setRecordingPhase] = useState<"initial" | "recording" | "paused" | "completed" | "processing">("initial");
  const [isProcessing, setIsProcessing] = useState(false);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          console.log('오디오 청크 수집:', event.data.size, 'bytes');
        }
      };
      
      mediaRecorder.onstop = () => {
        console.log('MediaRecorder 중지됨. 파일 처리 시작...');
        processAudioFile();
      };
      
      mediaRecorder.start(1000); // 1초마다 데이터 수집
      setIsRecording(true);
      setIsPaused(false);
      setRecordingPhase("recording");
      
      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('녹음 시작 실패:', error);
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
    }
    setIsPaused(true);
    setRecordingPhase("paused");
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
    }
    setIsPaused(false);
    setRecordingPhase("recording");
    intervalRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  const processAudioFile = async () => {
    try {
      console.log('오디오 청크 개수:', audioChunksRef.current.length);
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
      console.log('생성된 오디오 파일 크기:', audioBlob.size, 'bytes');
      
      if (audioBlob.size === 0) {
        console.error('오디오 파일이 비어있습니다!');
        navigate('/emotion-selection');
        return;
      }
      
      const audioFile = new File([audioBlob], 'recording.wav', { type: 'audio/wav' });
      
      // FormData 생성
      const formData = new FormData();
      formData.append('audio', audioFile);
      
      // STT 서버에 실제 API 호출
      const response = await fetch('http://localhost:8000/api/speech-to-text', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`STT 서버 오류: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        // 변환된 텍스트를 DiaryGeneration 페이지로 전달
        navigate('/diary-generation', {
          state: { text: result.text, audioFile: audioFile }
        });
      } else {
        // 오류 시 감정 선택 페이지로 이동 (백업)
        navigate('/emotion-selection');
      }
    } catch (error) {
      console.error('음성 처리 실패:', error);
      // 오류 시 감정 선택 페이지로 이동 (백업)
      navigate('/emotion-selection');
    } finally {
      setIsProcessing(false);
    }
  };

  const stopRecording = async () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    
    setIsRecording(false);
    setIsPaused(false);
    setRecordingPhase("processing");
    setIsProcessing(true);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const handleBack = () => {
    if (isRecording) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
      setIsRecording(false);
      setIsPaused(false);
      setRecordingTime(0);
      setRecordingPhase("initial");
    } else {
      navigate(-1);
    }
  };

  // 배경색과 텍스트색 상태에 따라 결정
  const getBackgroundClasses = () => {
    switch (recordingPhase) {
      case "initial":
        return "bg-orange-100"; // 피치스킨
      case "recording":
        return "bg-teal-100"; // 민트 계열
      case "paused":
        return "bg-amber-100"; // 일시정지 - 노란 계열
      case "completed":
        return "bg-green-100"; // 완료 - 연한 초록
      case "processing":
        return "bg-blue-100"; // 처리 중 - 파란 계열
      default:
        return "bg-orange-100";
    }
  };

  const getTextClasses = () => {
    switch (recordingPhase) {
      case "initial":
        return "text-orange-800";
      case "recording":
        return "text-teal-800";
      case "paused":
        return "text-amber-800";
      case "completed":
        return "text-green-800";
      case "processing":
        return "text-blue-800";
      default:
        return "text-orange-800";
    }
  };

  const getButtonClasses = () => {
    switch (recordingPhase) {
      case "initial":
        return "text-orange-800 hover:bg-orange-200/50";
      case "recording":
        return "text-teal-800 hover:bg-teal-200/50";
      case "paused":
        return "text-amber-800 hover:bg-amber-200/50";
      case "completed":
        return "text-green-800 hover:bg-green-200/50";
      case "processing":
        return "text-blue-800 hover:bg-blue-200/50";
      default:
        return "text-orange-800 hover:bg-orange-200/50";
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#FFF9F4] to-[#F9F9FA]">
      <div className="w-full max-w-md mx-auto rounded-3xl shadow-xl bg-white/80 p-8 mt-10 mb-10 flex flex-col items-center">
        {/* 상단 뒤로가기 버튼 */}
        <div className="flex items-center w-full mb-4">
          <Button
            onClick={handleBack}
            variant="ghost"
            size="icon"
            className="text-orange-400 hover:bg-orange-100/60 rounded-full shadow font-hakgyoansim"
            disabled={isProcessing}
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div className="flex-1" />
        </div>
        {/* 타이머 */}
        <div className="text-5xl font-hakgyoansim text-orange-500 mb-8 drop-shadow animate-fade-in">
          {formatTime(recordingTime)}
        </div>
        {/* 녹음/정지/일시정지 버튼 등 */}
        <div className="flex gap-6 mb-8">
          {(recordingPhase === "initial") && (
            <Button
              onClick={startRecording}
              size="lg"
              className="w-24 h-24 rounded-full bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-hakgyoansim"
            >
              <Mic className="w-10 h-10 text-primary-foreground" />
            </Button>
          )}
          {(recordingPhase === "recording" || recordingPhase === "paused") && (
            <>
              <Button
                onClick={recordingPhase === "recording" ? pauseRecording : resumeRecording}
                size="lg"
                className="w-16 h-16 rounded-full bg-amber-500 hover:bg-amber-600 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-hakgyoansim"
              >
                {recordingPhase === "recording" ? (
                  <Pause className="w-6 h-6 text-white" />
                ) : (
                  <Play className="w-6 h-6 text-white ml-1" />
                )}
              </Button>
              <Button
                onClick={stopRecording}
                size="lg"
                className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-hakgyoansim"
              >
                <Square className="w-8 h-8 text-white" />
              </Button>
            </>
          )}
        </div>
        {/* 안내문구 */}
        <div className="text-base text-gray-700 font-hakgyoansim text-center mb-4 animate-fade-in">
          {recordingPhase === "initial" && "마이크 버튼을 터치하여 음성 일기를 시작하세요"}
          {recordingPhase === "recording" && "자유롭게 이야기해보세요."}
          {recordingPhase === "paused" && "일시정지됨. 재개하거나 녹음을 완료하세요."}
          {recordingPhase === "processing" && "음성을 텍스트로 변환 중... 잠시만 기다려주세요"}
        </div>
        {/* 녹음 상태 표시 */}
        {(recordingPhase === "recording" || recordingPhase === "paused") && (
          <div className="flex items-center gap-2 mb-4">
            {recordingPhase === "recording" ? (
              <>
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-red-600 font-medium font-hakgyoansim">녹음 중</span>
              </>
            ) : (
              <>
                <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                <span className="text-amber-600 font-medium font-hakgyoansim">일시정지됨</span>
              </>
            )}
          </div>
        )}
        {/* 파동 애니메이션 - 녹음 중일 때만 */}
        {recordingPhase === "recording" && (
          <div className="relative w-40 h-40 flex items-center justify-center mt-6">
            <div className="absolute w-32 h-32 border-2 border-teal-300 rounded-full animate-pulse-wave opacity-20"></div>
            <div className="absolute w-40 h-40 border-2 border-teal-400 rounded-full animate-pulse-wave opacity-15 animation-delay-300"></div>
            <div className="absolute w-48 h-48 border-2 border-teal-500 rounded-full animate-pulse-wave opacity-10 animation-delay-600"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Recording;