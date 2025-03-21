import React, { useState } from 'react';
import { useGlobalTimer } from "@/components/providers/TimerProvider";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlayIcon, PauseIcon, MaximizeIcon, ClockIcon, StopCircleIcon } from "lucide-react";
import { useLocation } from "wouter";
import { formatTimeDisplay } from "@/lib/utils";

export const GlobalTimerDisplay: React.FC = () => {
  const { 
    displayTime, 
    isRunning, 
    pauseTimer, 
    startTimer,
    resetTimer,
    toggleMinimizedTimer,
    timerType,
    pomodoroState,
    currentCycle,
    totalCycles,
    minimizedTimer
  } = useGlobalTimer();
  
  const [, setLocation] = useLocation();
  const [isHovered, setIsHovered] = useState(false);
  
  // Only render if the timer is minimized and running
  if (!minimizedTimer) {
    return null;
  }
  
  // Format time for display
  const formattedTime = formatTimeDisplay(displayTime);
  
  // Get background color based on timer type and state
  const getBgColor = () => {
    if (timerType === "pomodoro" && pomodoroState === "break") {
      return "bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-800";
    } else if (timerType === "pomodoro" && pomodoroState === "work") {
      return "bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-800";
    } else if (timerType === "countdown") {
      return "bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-800";
    } else {
      return "bg-primary/10 border-primary/20";
    }
  };
  
  // Get timer label based on type
  const getTimerLabel = () => {
    if (timerType === "pomodoro") {
      return `${pomodoroState === "work" ? "Work" : "Break"} ${currentCycle}/${totalCycles}`;
    }
    return timerType.charAt(0).toUpperCase() + timerType.slice(1);
  };
  
  // Get timer icon based on type
  const getTimerIcon = () => {
    if (timerType === "pomodoro") {
      return <ClockIcon className="h-4 w-4 mr-2" />;
    } else if (timerType === "countdown") {
      return <ClockIcon className="h-4 w-4 mr-2" />;
    } else {
      return <ClockIcon className="h-4 w-4 mr-2" />;
    }
  };
  
  // Handle restoring the timer to full view
  const handleRestoreTimer = () => {
    toggleMinimizedTimer();
    setLocation("/");
  };

  return (
    <Card 
      className={`fixed bottom-4 right-4 z-50 p-2 shadow-lg flex items-center ${getBgColor()} text-sm border transition-all duration-200 ${isHovered ? 'scale-105' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center">
        {getTimerIcon()}
        <div className="mr-3">
          <div className="font-semibold">{getTimerLabel()}</div>
          <div className="font-mono text-lg font-medium tabular-nums">{formattedTime}</div>
        </div>
        
        <div className="flex space-x-1">
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-7 w-7 p-0"
            onClick={handleRestoreTimer}
            title="Restore timer"
          >
            <MaximizeIcon className="h-4 w-4" />
          </Button>
          
          <Button 
            size="sm" 
            variant={isRunning ? "ghost" : "outline"} 
            className={`h-7 w-7 p-0 ${isRunning ? '' : 'border-green-500 hover:bg-green-500/10'}`}
            onClick={isRunning ? pauseTimer : startTimer}
            title={isRunning ? "Pause timer" : "Resume timer"}
          >
            {isRunning ? (
              <PauseIcon className="h-4 w-4" />
            ) : (
              <PlayIcon className="h-4 w-4 text-green-500" />
            )}
          </Button>
          
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-7 w-7 p-0 hover:bg-red-500/10 hover:text-red-500"
            onClick={() => {
              resetTimer();
              handleRestoreTimer();
            }}
            title="Reset timer"
          >
            <StopCircleIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};