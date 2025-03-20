import { useState, useEffect, useRef, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { showNotification, playSound } from "@/lib/utils";
import { useAuth } from "@/components/providers/AuthProvider";
import { apiRequest } from "@/lib/queryClient";

type TimerType = "countdown" | "stopwatch" | "pomodoro";

interface PomodoroSettings {
  workMinutes: number;
  breakMinutes: number;
  cycles: number;
}

interface UseTimerOptions {
  onComplete?: () => void;
  soundEnabled?: boolean;
  notificationsEnabled?: boolean;
}

export function useTimer({
  onComplete,
  soundEnabled = true,
  notificationsEnabled = true,
}: UseTimerOptions = {}) {
  const [timerType, setTimerType] = useState<TimerType>("countdown");
  const [isRunning, setIsRunning] = useState(false);
  const [displayTime, setDisplayTime] = useState(0);
  const [countdown, setCountdown] = useState({ hours: 0, minutes: 25, seconds: 0 });
  const [pomodoroSettings, setPomodoroSettings] = useState<PomodoroSettings>({
    workMinutes: 25,
    breakMinutes: 5,
    cycles: 4,
  });
  const [categoryId, setCategoryId] = useState<string>("");
  
  // Pomodoro state
  const [pomodoroState, setPomodoroState] = useState<"work" | "break">("work");
  const [currentCycle, setCurrentCycle] = useState(1);
  
  // Session tracking
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  const intervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const { toast } = useToast();
  const { user, isPremium } = useAuth();

  // Calculate total time for countdown
  const calculateTotalSeconds = useCallback(() => {
    return (
      countdown.hours * 3600 + countdown.minutes * 60 + countdown.seconds
    );
  }, [countdown]);

  // Initialize timer based on type
  const initializeTimer = useCallback(() => {
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
  }, [
    timerType,
    calculateTotalSeconds,
    pomodoroSettings.workMinutes,
  ]);

  // Reset timer
  const resetTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
    initializeTimer();
    setElapsedTime(0);
    setSessionId(null);
    setSessionStartTime(null);
  }, [initializeTimer]);

  // Initialize on timer type change
  useEffect(() => {
    resetTimer();
  }, [timerType, resetTimer]);

  // Update timer
  const updateTimer = useCallback(() => {
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
  }, [
    timerType,
    displayTime,
  ]);

  // Start timer
  const startTimer = useCallback(async () => {
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
  }, [
    isRunning,
    timerType,
    categoryId,
    updateTimer,
    calculateTotalSeconds,
    toast,
    user,
    isPremium,
    pomodoroSettings,
  ]);

  // Pause timer
  const pauseTimer = useCallback(() => {
    if (!isRunning) return;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setIsRunning(false);
  }, [isRunning]);

  // Complete timer (countdown reaches zero or manually completed)
  const completeTimer = useCallback(() => {
    pauseTimer();

    // Notify user
    if (soundEnabled) {
      playSound("https://assets.mixkit.co/sfx/preview/mixkit-correct-answer-tone-2870.mp3");
    }

    if (notificationsEnabled) {
      showNotification("Timer Complete", {
        body: "Your timer has finished!",
        icon: "/favicon.ico",
      });
    }

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

    if (onComplete) {
      onComplete();
    }
  }, [
    pauseTimer,
    sessionId,
    toast,
    onComplete,
    soundEnabled,
    notificationsEnabled,
  ]);

  // Handle pomodoro phase completion
  const handlePomodoroPhaseComplete = useCallback(() => {
    if (pomodoroState === "work") {
      // Work phase complete, start break
      setPomodoroState("break");
      setDisplayTime(pomodoroSettings.breakMinutes * 60);
      
      if (soundEnabled) {
        playSound("https://assets.mixkit.co/sfx/preview/mixkit-correct-answer-tone-2870.mp3");
      }
      
      if (notificationsEnabled) {
        showNotification("Break Time", {
          body: "Work session complete! Time for a break.",
          icon: "/favicon.ico",
        });
      }
      
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
        
        if (soundEnabled) {
          playSound("https://assets.mixkit.co/sfx/preview/mixkit-correct-answer-tone-2870.mp3");
        }
        
        if (notificationsEnabled) {
          showNotification("Work Time", {
            body: "Break over! Back to work.",
            icon: "/favicon.ico",
          });
        }
        
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
  }, [
    pomodoroState,
    currentCycle,
    pomodoroSettings,
    completeTimer,
    updateTimer,
    toast,
    soundEnabled,
    notificationsEnabled,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
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
  };
}
