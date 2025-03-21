import React from 'react';
import { useGlobalTimer } from "@/components/providers/TimerProvider";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlayIcon, PauseIcon, MaximizeIcon } from "lucide-react";
import { useLocation } from "wouter";
import { formatTimeDisplay } from "@/lib/utils";

export const GlobalTimerDisplay: React.FC = () => {
  const { 
    displayTime, 
    isRunning, 
    pauseTimer, 
    startTimer,
    toggleMinimizedTimer,
    timerType,
    pomodoroState,
    currentCycle,
    totalCycles,
    minimizedTimer
  } = useGlobalTimer();
  
  const [, setLocation] = useLocation();
  
  // Only render if the timer is minimized and running
  if (!minimizedTimer || !isRunning) {
    return null;
  }
  
  // Format time for display
  const formattedTime = formatTimeDisplay(displayTime);
  
  // Get background color based on timer type and state
  const getBgColor = () => {
    if (timerType === "pomodoro" && pomodoroState === "break") {
      return "bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-800";
    }
    return "bg-primary/10 border-primary/20";
  };
  
  // Get timer label based on type
  const getTimerLabel = () => {
    if (timerType === "pomodoro") {
      return `${pomodoroState === "work" ? "Work" : "Break"} ${currentCycle}/${totalCycles}`;
    }
    return timerType.charAt(0).toUpperCase() + timerType.slice(1);
  };
  
  return (
    <Card className={`fixed bottom-4 right-4 z-50 p-2 shadow-lg flex items-center ${getBgColor()} text-sm border`}>
      <div className="mr-2">
        <div className="font-semibold">{getTimerLabel()}</div>
        <div className="font-mono text-lg tabular-nums">{formattedTime}</div>
      </div>
      <div className="flex flex-col space-y-1">
        <Button 
          size="sm" 
          variant="ghost" 
          className="h-7 w-7 p-0"
          onClick={() => {
            toggleMinimizedTimer();
            setLocation("/");
          }}
        >
          <MaximizeIcon className="h-4 w-4" />
        </Button>
        
        <Button 
          size="sm" 
          variant="ghost" 
          className="h-7 w-7 p-0"
          onClick={isRunning ? pauseTimer : startTimer}
        >
          {isRunning ? (
            <PauseIcon className="h-4 w-4" />
          ) : (
            <PlayIcon className="h-4 w-4" />
          )}
        </Button>
      </div>
    </Card>
  );
};