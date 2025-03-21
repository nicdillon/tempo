import { Button } from "@/components/ui/button";
import { PlayIcon, PauseIcon, RotateCcwIcon } from "lucide-react";

interface TimerControlsProps {
  isRunning: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  className?: string;
}

export function TimerControls({
  isRunning,
  onStart,
  onPause,
  onReset,
  className,
}: TimerControlsProps) {
  return (
    <div className={`flex justify-center space-x-3 sm:space-x-4 ${className}`}>
      {!isRunning ? (
        <Button onClick={onStart} className="bg-primary hover:bg-primary/90 px-3 sm:px-4">
          <PlayIcon className="mr-1 sm:mr-2 h-4 w-4" />
          <span className="text-sm sm:text-base">Start</span>
        </Button>
      ) : (
        <Button onClick={onPause} className="bg-primary hover:bg-primary/90 px-3 sm:px-4">
          <PauseIcon className="mr-1 sm:mr-2 h-4 w-4" />
          <span className="text-sm sm:text-base">Pause</span>
        </Button>
      )}
      <Button
        onClick={onReset}
        variant="outline"
        className="border-border px-3 sm:px-4"
      >
        <RotateCcwIcon className="mr-1 sm:mr-2 h-4 w-4" />
        <span className="text-sm sm:text-base">Reset</span>
      </Button>
    </div>
  );
}
