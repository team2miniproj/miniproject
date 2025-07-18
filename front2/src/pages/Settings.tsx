import { useState, useEffect, useRef } from "react";
import { Bell, BellOff, Clock, Heart, Calendar, Volume2, VolumeX, ChevronRight, Lock, Unlock, ArrowLeft, Mic, MicOff, Play, Pause, Square, Upload, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { db, storage } from "@/lib/firebase";
import { doc, getDoc, setDoc, collection, addDoc, query, orderBy, limit, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { useAuth } from "@/contexts/AuthContext";
import PinInput from "@/components/PinInput";

interface NotificationSetting {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  time?: string;
}

type PinSetupStep = 'none' | 'setup' | 'confirm' | 'change_current' | 'change_new' | 'change_confirm';

const Settings = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  // 보안 설정 상태
  const [lockEnabled, setLockEnabled] = useState(false);
  const [loadingLock, setLoadingLock] = useState(true);
  const [pinSetupStep, setPinSetupStep] = useState<PinSetupStep>('none');
  const [tempPin, setTempPin] = useState('');
  const [pinError, setPinError] = useState('');

  // 기존 알림 설정 상태
  const [masterNotification, setMasterNotification] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const { toast } = useToast();

  // 오디오 테스트 상태
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isTestingSTT, setIsTestingSTT] = useState(false);
  const [sttResult, setSttResult] = useState<string>("");
  const [savedAudios, setSavedAudios] = useState<Array<{id: string, url: string, name: string, createdAt: string}>>([]);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [notifications, setNotifications] = useState<NotificationSetting[]>([
    {
      id: "daily_reminder",
      title: "일일 일기 알림",
      description: "매일 저녁 일기 작성을 알려드립니다",
      enabled: true,
      time: "20:00"
    },
    {
      id: "mood_check",
      title: "기분 체크 알림",
      description: "하루 3번 기분 상태를 확인합니다",
      enabled: true,
      time: "09:00, 15:00, 21:00"
    },
    {
      id: "streak_reminder",
      title: "연속 작성 격려",
      description: "연속으로 일기를 작성할 때 격려 메시지를 보냅니다",
      enabled: true
    },
  ]);

  const [editingTimeId, setEditingTimeId] = useState<string | null>(null);

  // 간단한 해시 함수
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

  // Firestore에서 lock 정보 불러오기
  useEffect(() => {
    if (!currentUser) return;
    setLoadingLock(true);
    const fetchLock = async () => {
      try {
        const ref = doc(db, "users", currentUser.uid, "security", "lock");
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          setLockEnabled(!!data.enabled);
        }
      } catch (error) {
        console.error("잠금 설정 불러오기 실패:", error);
      }
      setLoadingLock(false);
    };
    fetchLock();
  }, [currentUser]);

  // 잠금 토글 핸들러
  const handleLockToggle = (checked: boolean) => {
    if (checked) {
      // 잠금 활성화 - PIN 설정 시작
      setPinSetupStep('setup');
    } else {
      // 잠금 비활성화
      handleDisableLock();
    }
  };

  // 잠금 비활성화
  const handleDisableLock = async () => {
    if (!currentUser) return;
    
    try {
      const ref = doc(db, "users", currentUser.uid, "security", "lock");
      await setDoc(ref, {
        enabled: false,
        pin: null,
        updatedAt: new Date().toISOString(),
      });
      setLockEnabled(false);
      toast({ title: "잠금이 비활성화되었습니다." });
    } catch (error) {
      console.error("잠금 비활성화 실패:", error);
      toast({ title: "오류가 발생했습니다.", variant: "destructive" });
    }
  };

  // PIN 설정 완료 핸들러
  const handlePinComplete = async (pin: string) => {
    if (!currentUser) return;

    switch (pinSetupStep) {
      case 'setup':
        setTempPin(pin);
        setPinSetupStep('confirm');
        break;
        
      case 'confirm':
        if (pin === tempPin) {
          // PIN 일치 - 저장
          try {
            const ref = doc(db, "users", currentUser.uid, "security", "lock");
            await setDoc(ref, {
              enabled: true,
              pin: simpleHash(pin),
              updatedAt: new Date().toISOString(),
            });
            setLockEnabled(true);
            setPinSetupStep('none');
            setTempPin('');
            setPinError('');
            toast({ title: "잠금이 설정되었습니다." });
          } catch (error) {
            console.error("PIN 저장 실패:", error);
            setPinError("저장 중 오류가 발생했습니다.");
          }
        } else {
          setPinError("비밀번호가 일치하지 않습니다.");
        }
        break;
        
      case 'change_current':
        // 현재 PIN 확인
        try {
          const ref = doc(db, "users", currentUser.uid, "security", "lock");
          const snap = await getDoc(ref);
          if (snap.exists()) {
            const data = snap.data();
            if (data.pin === simpleHash(pin)) {
              setPinSetupStep('change_new');
              setPinError('');
            } else {
              setPinError("현재 비밀번호가 올바르지 않습니다.");
            }
          }
        } catch (error) {
          setPinError("확인 중 오류가 발생했습니다.");
        }
        break;
        
      case 'change_new':
        setTempPin(pin);
        setPinSetupStep('change_confirm');
        break;
        
      case 'change_confirm':
        if (pin === tempPin) {
          // 새 PIN 저장
          try {
            const ref = doc(db, "users", currentUser.uid, "security", "lock");
            await setDoc(ref, {
              enabled: true,
              pin: simpleHash(pin),
              updatedAt: new Date().toISOString(),
            });
            setPinSetupStep('none');
            setTempPin('');
            setPinError('');
            toast({ title: "비밀번호가 변경되었습니다." });
          } catch (error) {
            setPinError("저장 중 오류가 발생했습니다.");
          }
        } else {
          setPinError("새 비밀번호가 일치하지 않습니다.");
        }
        break;
    }
  };

  // PIN 설정 취소
  const handlePinCancel = () => {
    setPinSetupStep('none');
    setTempPin('');
    setPinError('');
  };

  // PIN 변경 시작
  const handleChangePin = () => {
    setPinSetupStep('change_current');
  };

  // 에러 클리어
  const clearError = () => {
    setPinError('');
  };

 
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast({ title: "녹음 완료", description: "녹음이 완료되었습니다." });
    }
  };

  const playAudio = () => {
    if (audioUrl && audioRef.current) {
      audioRef.current.src = audioUrl;
      audioRef.current.play();
      setIsPlaying(true);
      
      audioRef.current.onended = () => {
        setIsPlaying(false);
      };
    }
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const uploadToFirebase = async () => {
    if (!audioBlob || !currentUser) return;
    
    setIsUploading(true);
    try {
      const fileName = `audio_test_${Date.now()}.wav`;
      const storageRef = ref(storage, `users/${currentUser.uid}/audio_tests/${fileName}`);
      
      // 파일 업로드
      const snapshot = await uploadBytes(storageRef, audioBlob);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      // Firestore에 메타데이터 저장
      await addDoc(collection(db, "users", currentUser.uid, "audio_tests"), {
        name: fileName,
        url: downloadURL,
        createdAt: new Date().toISOString(),
        size: audioBlob.size,
        type: audioBlob.type
      });
      
      toast({ title: "업로드 완료", description: "오디오 파일이 저장되었습니다." });
      loadSavedAudios(); // 저장된 오디오 목록 새로고침
    } catch (error) {
      console.error('업로드 실패:', error);
      toast({ title: "업로드 실패", description: "파일 업로드에 실패했습니다.", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };


  const loadSavedAudios = async () => {
    if (!currentUser) return;
    
    try {
      const q = query(
        collection(db, "users", currentUser.uid, "audio_tests"),
        orderBy("createdAt", "desc"),
        limit(5)
      );
      const querySnapshot = await getDocs(q);
      
      const audios = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Array<{id: string, url: string, name: string, createdAt: string}>;
      
      setSavedAudios(audios);
    } catch (error) {
      console.error('저장된 오디오 불러오기 실패:', error);
    }
  };

  const clearRecording = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setSttResult("");
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
  };

  // 저장된 오디오 목록 로드
  useEffect(() => {
    if (currentUser) {
      loadSavedAudios();
    }
  }, [currentUser]);

  // PIN 설정 단계별 제목과 부제목
  const getPinStepInfo = () => {
    switch (pinSetupStep) {
      case 'setup':
        return { 
          title: "비밀번호 설정", 
          subtitle: "4자리 숫자를 입력해주세요",
          backgroundType: 'setup' as const
        };
      case 'confirm':
        return { 
          title: "비밀번호 확인", 
          subtitle: "같은 비밀번호를 다시 입력해주세요",
          backgroundType: 'confirm' as const
        };
      case 'change_current':
        return { 
          title: "현재 비밀번호", 
          subtitle: "현재 비밀번호를 입력해주세요",
          backgroundType: 'current' as const
        };
      case 'change_new':
        return { 
          title: "새 비밀번호", 
          subtitle: "새로운 4자리 비밀번호를 입력해주세요",
          backgroundType: 'new' as const
        };
      case 'change_confirm':
        return { 
          title: "새 비밀번호 확인", 
          subtitle: "새 비밀번호를 다시 입력해주세요",
          backgroundType: 'confirm' as const
        };
      default:
        return { 
          title: "", 
          subtitle: "",
          backgroundType: 'setup' as const
        };
    }
  };

  // PIN 입력 화면 표시
  if (pinSetupStep !== 'none') {
    const { title, subtitle, backgroundType } = getPinStepInfo();
    return (
      <PinInput
        key={pinSetupStep} // 단계별 고유 key 제공
        title={title}
        subtitle={subtitle}
        backgroundType={backgroundType}
        onComplete={handlePinComplete}
        onBack={handlePinCancel}
        error={pinError}
        clearError={clearError}
      />
    );
  }

  // 나머지 기존 함수들...
  const toggleNotification = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, enabled: !notif.enabled } : notif
      )
    );
    
    const notification = notifications.find(n => n.id === id);
    toast({
      title: notification?.enabled ? "알림 비활성화" : "알림 활성화",
      description: `${notification?.title}이(가) ${notification?.enabled ? "비활성화" : "활성화"}되었습니다.`,
    });
  };

  const handleTimeInputChange = (id: string, newTime: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, time: newTime } : notif
      )
    );
    setEditingTimeId(null);
  };

  const handleTimeChange = (id: string) => {
    toast({
      title: "시간 설정",
      description: "알림 시간을 변경할 수 있습니다.",
    });
  };

  const handleTestNotification = () => {
    toast({
      title: "🔔 테스트 알림",
      description: "안녕하세요! 오늘의 감정은 어떠신가요?",
    });
  };

  return (
    <div className="min-h-screen bg-[#FFF9F4] font-hakgyoansim">
      {/* 숨겨진 오디오 태그 */}
      <audio ref={audioRef} style={{ display: 'none' }} />
      {loadingLock && <div className="p-6 text-center text-muted-foreground">보안 설정 불러오는 중...</div>}
      {/* 헤더 */}
      <div className="bg-white p-8 pt-16 rounded-b-2xl mb-10 border-b border-orange-100">
        <div className="w-full max-w-2xl mx-auto">
          <div className="flex items-center mb-4">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="text-orange-500 hover:bg-orange-100/60 rounded-full font-hakgyoansim px-4 py-2 ml-[1px]"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              뒤로 가기
            </Button>
            <div className="flex-1" />
          </div>
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-bold font-hakgyoansim text-orange-500 mb-2">환경설정</h1>
          <p className="text-lg font-hakgyoansim text-gray-500">앱의 다양한 환경을 설정할 수 있습니다</p>
        </div>
      </div>
      <div className="p-6 space-y-10 max-w-2xl mx-auto">
        {/* 보안 설정 */}
        <div className="bg-white rounded-xl p-6 border border-orange-100">
          <h3 className="font-bold mb-4 flex items-center gap-2 text-lg text-orange-500"><Lock className="w-5 h-5 text-primary" />보안 설정</h3>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {lockEnabled ? (
                <Lock className="w-6 h-6 text-primary" />
              ) : (
                <Unlock className="w-6 h-6 text-muted-foreground" />
              )}
              <div>
                <h4 className="font-medium font-hakgyoansim">화면잠금(비밀번호)</h4>
                <p className="text-sm text-muted-foreground font-hakgyoansim">앱 실행 시 4자리 비밀번호로 잠금화면을 표시합니다</p>
              </div>
            </div>
            <Switch checked={lockEnabled} onCheckedChange={handleLockToggle} />
          </div>
          {lockEnabled && (
            <div className="mt-4">
              <Button variant="outline" onClick={handleChangePin} className="w-full font-hakgyoansim">비밀번호 변경</Button>
            </div>
          )}
        </div>
        {/* 전체 알림 설정 */}
        <div className="bg-white rounded-xl p-6 border border-orange-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {masterNotification ? (
                <Bell className="w-6 h-6 text-primary" />
              ) : (
                <BellOff className="w-6 h-6 text-muted-foreground" />
              )}
              <div>
                <h3 className="font-bold font-hakgyoansim">전체 알림</h3>
                <p className="text-sm text-muted-foreground font-hakgyoansim">모든 알림을 {masterNotification ? "활성화" : "비활성화"}</p>
              </div>
            </div>
            <Switch checked={masterNotification} onCheckedChange={setMasterNotification} />
          </div>
          {masterNotification && (
            <>
              <Separator className="my-4" />
              {/* 사운드 및 진동 설정 */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {soundEnabled ? (
                      <Volume2 className="w-5 h-5 text-primary" />
                    ) : (
                      <VolumeX className="w-5 h-5 text-muted-foreground" />
                    )}
                    <Label htmlFor="sound" className="font-hakgyoansim">알림 소리</Label>
                  </div>
                  <Switch id="sound" checked={soundEnabled} onCheckedChange={setSoundEnabled} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 flex items-center justify-center">📳</div>
                    <Label htmlFor="vibration" className="font-hakgyoansim">진동</Label>
                  </div>
                  <Switch id="vibration" checked={vibrationEnabled} onCheckedChange={setVibrationEnabled} />
                </div>
              </div>
            </>
          )}
        </div>
        {/* 개별 알림 설정 */}
        <div className="bg-white rounded-xl p-6 border border-orange-100">
          <h3 className="font-bold mb-4 flex items-center gap-2 text-lg text-orange-500"><Heart className="w-5 h-5 text-primary" />상세 알림 설정</h3>
          <div className="space-y-4">
            {notifications.filter(notification => notification.id !== 'memory_reminder').map((notification, index) => (
              <div key={notification.id}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="font-bold text-base font-hakgyoansim">{notification.title}</h4>
                      {notification.enabled && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-hakgyoansim">ON</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2 font-hakgyoansim">{notification.description}</p>
                    {/* 시간 표시/변경 */}
                    {notification.id === 'daily_reminder' && notification.enabled && (
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="w-4 h-4 text-orange-400" />
                        {editingTimeId === notification.id ? (
                          <input
                            type="time"
                            value={notification.time || "20:00"}
                            onChange={e => handleTimeInputChange(notification.id, e.target.value)}
                            onBlur={() => setEditingTimeId(null)}
                            className="px-2 py-1 rounded border border-orange-200 font-hakgyoansim text-base focus:outline-none focus:ring-2 focus:ring-orange-200"
                            autoFocus
                          />
                        ) : (
                          <button
                            onClick={() => setEditingTimeId(notification.id)}
                            className="text-base text-orange-500 font-hakgyoansim underline underline-offset-2 hover:text-orange-600"
                          >
                            {notification.time || "20:00"}
                          </button>
                        )}
                      </div>
                    )}
                    {/* 기존 시간(여러개) 표시: 기분 체크 알림 등 */}
                    {notification.id !== 'daily_reminder' && notification.time && notification.enabled && (
                      <div className={`flex items-center gap-2 mt-1 text-xs font-hakgyoansim ${notification.id === 'mood_check' ? 'text-orange-500 font-bold' : 'text-gray-400'}`}>
                        <Clock className="w-3 h-3" />
                        {notification.time}
                        {/* mood_check는 > 아이콘 제거, 나머지는 표시 */}
                        {notification.id !== 'mood_check' && <ChevronRight className="w-3 h-3" />}
                      </div>
                    )}
                  </div>
                  <Switch
                    checked={notification.enabled && masterNotification}
                    onCheckedChange={() => toggleNotification(notification.id)}
                    disabled={!masterNotification}
                  />
                </div>
                {index < notifications.length - 1 && <Separator className="my-4" />}
              </div>
            ))}
          </div>
        </div>
        {/* 알림 시간대 설정 */}
        <div className="bg-white rounded-xl p-6 border border-orange-100">
          <h3 className="font-bold mb-4 flex items-center gap-2 text-lg text-orange-500"><Calendar className="w-5 h-5 text-primary" />방해 금지 시간</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold font-hakgyoansim">야간 방해 금지</h4>
                <p className="text-xs text-muted-foreground font-hakgyoansim">22:00 - 08:00 알림을 받지 않습니다</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator className="my-2" />
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold font-hakgyoansim">주말 방해 금지</h4>
                <p className="text-xs text-muted-foreground font-hakgyoansim">주말에는 알림을 최소화합니다</p>
              </div>
              <Switch />
            </div>
          </div>
        </div>
        
        {/* 테스트 및 추가 옵션 */}
        <div className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4 font-hakgyoansim">
            <h4 className="font-bold text-sm mb-2">💡 알림 활용 팁</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• 일정한 시간에 알림을 받으면 일기 작성 습관을 기를 수 있어요</li>
              <li>• 기분 체크 알림으로 감정 변화를 더 잘 파악할 수 있어요</li>
              <li>• 방해 금지 시간을 설정하여 필요할 때만 알림을 받으세요</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;