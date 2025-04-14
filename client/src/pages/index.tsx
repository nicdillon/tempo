import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layouts/MainLayout";
import { TimerDisplay } from "@/components/timer/TimerDisplay";
import { TimerControls } from "@/components/timer/TimerControls";
import { CategorySelector } from "@/components/timer/CategorySelector";
import { PomodoroSettings } from "@/components/timer/PomodoroSettings";
import { CountdownSettings } from "@/components/timer/CountdownSettings";

import { UpgradePrompt } from "@/components/UpgradePrompt";
import { useGlobalTimer } from "@/components/providers/TimerProvider";
import { useCategories } from "@/hooks/use-categories";
import { useAuth } from "@/hooks/use-auth";
import { requestNotificationPermission } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MinimizeIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const { user, isPremium } = useAuth();
  const { categories, isLoading: categoriesLoading } = useCategories();
  const [notificationsPermission, setNotificationsPermission] = useState(false);
  
  const {
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
    totalCycles,
    toggleMinimizedTimer,
    minimizedTimer
  } = useGlobalTimer();

  // Request notification permission on component mount
  useEffect(() => {
    const checkPermission = async () => {
      const permission = await requestNotificationPermission();
      setNotificationsPermission(permission);
    };
    
    checkPermission();
  }, []);

  // Set initial category when categories are loaded
  useEffect(() => {
    if (categories.length > 0 && !categoryId) {
      setCategoryId(categories[0].id.toString());
    }
  }, [categories, categoryId, setCategoryId]);

  return (
    <MainLayout>
      <Card className="max-w-3xl mx-auto overflow-hidden">
        <CardContent className="pt-6 px-3 sm:px-6">
          {/* Timer Type Selection */}
          <Tabs
            value={timerType}
            onValueChange={(value) => setTimerType(value as any)}
            className="mb-6"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="countdown" disabled={isRunning}>Countdown</TabsTrigger>
              <TabsTrigger value="stopwatch" disabled={isRunning}>Stopwatch</TabsTrigger>
              <TabsTrigger value="pomodoro" disabled={isRunning}>Pomodoro</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Category Selection */}
          <div className="mb-8">
            <CategorySelector
              selectedCategory={categoryId}
              onSelectCategory={setCategoryId}
            />
          </div>

          {/* Timer Settings */}
          {timerType === "countdown" && !isRunning && (
            <CountdownSettings
              hours={countdown.hours}
              minutes={countdown.minutes}
              seconds={countdown.seconds}
              onHoursChange={(h) => setCountdown({ ...countdown, hours: h })}
              onMinutesChange={(m) => setCountdown({ ...countdown, minutes: m })}
              onSecondsChange={(s) => setCountdown({ ...countdown, seconds: s })}
            />
          )}

          {timerType === "pomodoro" && !isRunning && (
            <PomodoroSettings
              workMinutes={pomodoroSettings.workMinutes}
              breakMinutes={pomodoroSettings.breakMinutes}
              cycles={pomodoroSettings.cycles}
              onWorkMinutesChange={(m) =>
                setPomodoroSettings({ ...pomodoroSettings, workMinutes: m })
              }
              onBreakMinutesChange={(m) =>
                setPomodoroSettings({ ...pomodoroSettings, breakMinutes: m })
              }
              onCyclesChange={(c) =>
                setPomodoroSettings({ ...pomodoroSettings, cycles: c })
              }
            />
          )}

          {/* Timer Display */}
          <TimerDisplay
            time={displayTime}
            isRunning={isRunning}
            timerState={
              timerType === "pomodoro"
                ? {
                    pomodoroState,
                    currentCycle,
                    totalCycles,
                  }
                : undefined
            }
            className="mb-8"
          />

          {/* Timer Controls */}
          <div className="flex items-center mb-8">
            <TimerControls
              isRunning={isRunning}
              onStart={startTimer}
              onPause={pauseTimer}
              onReset={resetTimer}
              className="flex-1"
            />
            
            {isRunning && (
              <Button 
                variant="outline" 
                size="sm" 
                className="ml-2" 
                onClick={toggleMinimizedTimer}
              >
                <MinimizeIcon className="h-4 w-4 mr-2" />
                Minimize
              </Button>
            )}
          </div>
          
          {/* Premium Upgrade Prompt (show only for non-premium users) */}
          {user && !isPremium && (
            <UpgradePrompt className="mt-8" />
          )}
        </CardContent>
      </Card>
    </MainLayout>
  );
}
