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
    <div className={`flex justify-center space-x-4 ${className}`}>
      {!isRunning ? (
        <Button onClick={onStart} className="bg-primary hover:bg-primary/90">
          <PlayIcon className="mr-2 h-4 w-4" />
          Start
        </Button>
      ) : (
        <Button onClick={onPause} className="bg-primary hover:bg-primary/90">
          <PauseIcon className="mr-2 h-4 w-4" />
          Pause
        </Button>
      )}
      <Button
        onClick={onReset}
        variant="outline"
        className="border-border"
      >
        <RotateCcwIcon className="mr-2 h-4 w-4" />
        Reset
      </Button>
    </div>
  );
}
