import { cn } from "@/lib/utils";

interface TimerDisplayProps {
  time: number;
  className?: string;
  isRunning?: boolean;
  timerState?: {
    pomodoroState?: 'work' | 'break';
    currentCycle?: number;
    totalCycles?: number;
  };
}

export function TimerDisplay({ 
  time, 
  className,
  isRunning = false,
  timerState
}: TimerDisplayProps) {
  // Format time as hh:mm:ss
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    
    return [
      h.toString().padStart(2, '0'),
      m.toString().padStart(2, '0'),
      s.toString().padStart(2, '0')
    ].join(':');
  };

  return (
    <div className={cn("flex flex-col items-center", className)}>
      {/* Pomodoro state indicator */}
      {timerState && timerState.pomodoroState && isRunning && (
        <div className="mb-4">
          <div 
            className={cn(
              "inline-flex items-center px-3 py-1 rounded-full text-sm",
              timerState.pomodoroState === 'work' 
                ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" 
                : "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
            )}
          >
            <span>{timerState.pomodoroState === 'work' ? 'Work' : 'Break'}</span>
            <span className="ml-1 font-mono">
              {timerState.currentCycle}/{timerState.totalCycles}
            </span>
          </div>
        </div>
      )}
      
      {/* Timer display */}
      <div className="font-mono text-8xl font-bold tracking-tight py-8 tabular-nums">
        {formatTime(time)}
      </div>
    </div>
  );
}
