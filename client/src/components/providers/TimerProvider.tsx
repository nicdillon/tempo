import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useToast } from "@/hooks/use-toast";
import { showNotification, playSound } from "@/lib/utils";
import { useAuth } from "@/components/providers/AuthProvider";
import { apiRequest } from "@/lib/queryClient";
// Import will be handled differently to avoid circular dependency

export type TimerType = "countdown" | "stopwatch" | "pomodoro";

export interface PomodoroSettings {
  workMinutes: number;
  breakMinutes: number;
  cycles: number;
}

interface TimerContextType {
  timerType: TimerType;
  setTimerType: (type: TimerType) => void;
  isRunning: boolean;
  displayTime: number;
  countdown: { hours: number; minutes: number; seconds: number };
  setCountdown: (countdown: { hours: number; minutes: number; seconds: number }) => void;
  pomodoroSettings: PomodoroSettings;
  setPomodoroSettings: (settings: PomodoroSettings) => void;
  pomodoroState?: "work" | "break";
  currentCycle: number;
  categoryId: string;
  setCategoryId: (id: string) => void;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  totalCycles: number;
  minimizedTimer: boolean;
  toggleMinimizedTimer: () => void;
}

export const TimerContext = createContext<TimerContextType | null>(null);

export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Timer state
  const [timerType, setTimerType] = useState<TimerType>(() => {
    const saved = localStorage.getItem('timerType');
    return (saved as TimerType) || "countdown";
  });
  
  const [isRunning, setIsRunning] = useState<boolean>(() => {
    return localStorage.getItem('timerRunning') === 'true';
  });
  
  const [displayTime, setDisplayTime] = useState<number>(() => {
    const saved = localStorage.getItem('displayTime');
    return saved ? parseInt(saved, 10) : 0;
  });
  
  const [countdown, setCountdown] = useState<{ hours: number; minutes: number; seconds: number }>(() => {
    try {
      const saved = localStorage.getItem('countdown');
      return saved ? JSON.parse(saved) : { hours: 0, minutes: 25, seconds: 0 };
    } catch {
      return { hours: 0, minutes: 25, seconds: 0 };
    }
  });
  
  const [pomodoroSettings, setPomodoroSettings] = useState<PomodoroSettings>(() => {
    try {
      const saved = localStorage.getItem('pomodoroSettings');
      return saved ? JSON.parse(saved) : { workMinutes: 25, breakMinutes: 5, cycles: 4 };
    } catch {
      return { workMinutes: 25, breakMinutes: 5, cycles: 4 };
    }
  });
  
  const [pomodoroState, setPomodoroState] = useState<"work" | "break">(() => {
    const saved = localStorage.getItem('pomodoroState');
    return (saved as "work" | "break") || "work";
  });
  
  const [currentCycle, setCurrentCycle] = useState<number>(() => {
    const saved = localStorage.getItem('currentCycle');
    return saved ? parseInt(saved, 10) : 1;
  });
  
  const [categoryId, setCategoryId] = useState<string>(() => {
    return localStorage.getItem('categoryId') || "";
  });
  
  // Session tracking
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  // Minimized timer state
  const [minimizedTimer, setMinimizedTimer] = useState<boolean>(() => {
    return localStorage.getItem('minimizedTimer') === 'true';
  });
  
  const intervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const { toast } = useToast();
  const { user, isPremium } = useAuth();

  // Save state to localStorage
  useEffect(() => {
    localStorage.setItem('timerType', timerType);
    localStorage.setItem('timerRunning', isRunning.toString());
    localStorage.setItem('displayTime', displayTime.toString());
    localStorage.setItem('countdown', JSON.stringify(countdown));
    localStorage.setItem('pomodoroSettings', JSON.stringify(pomodoroSettings));
    localStorage.setItem('pomodoroState', pomodoroState);
    localStorage.setItem('currentCycle', currentCycle.toString());
    localStorage.setItem('categoryId', categoryId);
    localStorage.setItem('minimizedTimer', minimizedTimer.toString());
    
    // Only store the last time the timer was running
    if (isRunning) {
      localStorage.setItem('lastRunningTime', Date.now().toString());
    }
  }, [
    timerType, 
    isRunning, 
    displayTime, 
    countdown, 
    pomodoroSettings, 
    pomodoroState, 
    currentCycle, 
    categoryId,
    minimizedTimer
  ]);

  // Calculate total time for countdown
  const calculateTotalSeconds = () => {
    return countdown.hours * 3600 + countdown.minutes * 60 + countdown.seconds;
  };

  // Initialize timer based on type
  const initializeTimer = () => {
    if (timerType === "countdown") {
      const totalSeconds = calculateTotalSeconds();
      setDisplayTime(totalSeconds);
    } else if (timerType === "stopwatch") {
      setDisplayTime(0);
    } else if (timerType === "pomodoro") {
      setPomodoroState("work");
      setCurrentCycle(1);
      setDisplayTime(pomodoroSettings.workMinutes * 60);
    }
  };

  // Handle timer persistence between sessions
  useEffect(() => {
    // If the timer was running when the page was closed
    if (isRunning) {
      const lastRunningTime = localStorage.getItem('lastRunningTime');
      if (lastRunningTime) {
        const elapsedSinceLastRunning = Math.floor((Date.now() - parseInt(lastRunningTime, 10)) / 1000);
        
        if (timerType === "countdown" || timerType === "pomodoro") {
          // For countdown and pomodoro, subtract elapsed time
          const newDisplayTime = Math.max(0, displayTime - elapsedSinceLastRunning);
          setDisplayTime(newDisplayTime);
          
          // If timer reached zero while away, handle it
          if (newDisplayTime === 0) {
            if (timerType === "countdown") {
              setIsRunning(false);
              // Notify user
              toast({
                title: "Timer Complete",
                description: "Your timer completed while you were away!",
              });
            } else if (timerType === "pomodoro") {
              // Handle pomodoro phase completion
              handlePomodoroPhaseComplete();
            }
          }
        } else if (timerType === "stopwatch") {
          // For stopwatch, add elapsed time
          setDisplayTime(displayTime + elapsedSinceLastRunning);
        }
        
        // Update the start time reference to account for the elapsed time
        startTimeRef.current = Date.now() - (elapsedSinceLastRunning * 1000);
      }
      
      // Restart the interval
      if (!intervalRef.current) {
        startTimeRef.current = Date.now() - (elapsedTime * 1000);
        intervalRef.current = window.setInterval(() => {
          updateTimer();
        }, 100);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset timer
  const resetTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
    initializeTimer();
    setElapsedTime(0);
    setSessionId(null);
    setSessionStartTime(null);
  };

  // Initialize on timer type change
  useEffect(() => {
    resetTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerType]);

  // Update timer
  const updateTimer = () => {
    const now = Date.now();
    const elapsed = Math.floor((now - startTimeRef.current) / 1000);

    if (timerType === "countdown") {
      const remaining = Math.max(0, displayTime - elapsed);
      setDisplayTime(remaining);
      setElapsedTime(elapsed);

      if (remaining <= 0) {
        completeTimer();
      }
    } else if (timerType === "stopwatch") {
      setDisplayTime(elapsed);
      setElapsedTime(elapsed);
    } else if (timerType === "pomodoro") {
      const remaining = Math.max(0, displayTime - elapsed);
      setDisplayTime(remaining);
      setElapsedTime(elapsed);

      if (remaining <= 0) {
        handlePomodoroPhaseComplete();
      }
    }
  };

  // Start timer
  const startTimer = async () => {
    if (isRunning || !categoryId) return;

    if (timerType === "countdown" && calculateTotalSeconds() <= 0) {
      toast({
        title: "Cannot start timer",
        description: "Please set a time greater than zero",
        variant: "destructive",
      });
      return;
    }

    // Save session if user is premium
    if (user && isPremium) {
      try {
        const response = await apiRequest("POST", "/api/timer-sessions", {
          categoryId: parseInt(categoryId),
          timerType,
          duration: 
            timerType === "countdown" 
              ? calculateTotalSeconds() 
              : timerType === "pomodoro"
              ? pomodoroSettings.workMinutes * 60 * pomodoroSettings.cycles +
                pomodoroSettings.breakMinutes * 60 * (pomodoroSettings.cycles - 1)
              : 0,
          pomodoroData: 
            timerType === "pomodoro" 
              ? {
                  workMinutes: pomodoroSettings.workMinutes,
                  breakMinutes: pomodoroSettings.breakMinutes,
                  cycles: pomodoroSettings.cycles,
                  completedCycles: 0,
                }
              : null,
        });
        
        const session = await response.json();
        setSessionId(session.id);
        setSessionStartTime(new Date());
      } catch (error) {
        console.error("Error creating session:", error);
        // Continue without saving session
      }
    }

    startTimeRef.current = Date.now();
    setIsRunning(true);

    intervalRef.current = window.setInterval(() => {
      updateTimer();
    }, 100);
  };

  // Pause timer
  const pauseTimer = () => {
    if (!isRunning) return;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setIsRunning(false);
  };

  // Complete timer (countdown reaches zero or manually completed)
  const completeTimer = () => {
    pauseTimer();

    // Notify user
    playSound("https://assets.mixkit.co/sfx/preview/mixkit-correct-answer-tone-2870.mp3");
    
    showNotification("Timer Complete", {
      body: "Your timer has finished!",
      icon: "/favicon.ico",
    });

    // Update session if exists
    if (sessionId) {
      apiRequest("PATCH", `/api/timer-sessions/${sessionId}`, {
        completed: true,
        endTime: new Date(),
      }).catch(console.error);
    }

    toast({
      title: "Timer Complete",
      description: "Your timer has finished!",
    });
  };

  // Handle pomodoro phase completion
  const handlePomodoroPhaseComplete = () => {
    if (pomodoroState === "work") {
      // Work phase complete, start break
      setPomodoroState("break");
      setDisplayTime(pomodoroSettings.breakMinutes * 60);
      
      playSound("https://assets.mixkit.co/sfx/preview/mixkit-correct-answer-tone-2870.mp3");
      
      showNotification("Break Time", {
        body: "Work session complete! Time for a break.",
        icon: "/favicon.ico",
      });
      
      toast({
        title: "Work Complete",
        description: "Time for a break!",
      });
    } else {
      // Break phase complete
      setCurrentCycle((prev) => prev + 1);
      
      if (currentCycle >= pomodoroSettings.cycles) {
        // All cycles complete
        completeTimer();
      } else {
        // Start next work phase
        setPomodoroState("work");
        setDisplayTime(pomodoroSettings.workMinutes * 60);
        
        playSound("https://assets.mixkit.co/sfx/preview/mixkit-correct-answer-tone-2870.mp3");
        
        showNotification("Work Time", {
          body: "Break over! Back to work.",
          icon: "/favicon.ico",
        });
        
        toast({
          title: "Break Complete",
          description: "Back to work!",
        });
      }
    }
    
    // Reset the timer interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    startTimeRef.current = Date.now();
    intervalRef.current = window.setInterval(() => {
      updateTimer();
    }, 100);
  };

  // Toggle minimized timer
  const toggleMinimizedTimer = () => {
    setMinimizedTimer(prev => !prev);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <TimerContext.Provider 
      value={{
        timerType,
        setTimerType,
        isRunning,
        displayTime,
        countdown,
        setCountdown,
        pomodoroSettings,
        setPomodoroSettings,
        pomodoroState,
        currentCycle,
        categoryId,
        setCategoryId,
        startTimer,
        pauseTimer,
        resetTimer,
        totalCycles: pomodoroSettings.cycles,
        minimizedTimer,
        toggleMinimizedTimer
      }}
    >
      {children}
      {/* We'll handle the minimized timer in the index.tsx file */}
    </TimerContext.Provider>
  );
};

export const useGlobalTimer = () => {
  const context = useContext(TimerContext);
  if (context === null) {
    throw new Error('useGlobalTimer must be used within a TimerProvider');
  }
  return context;
};