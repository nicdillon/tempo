import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface CountdownSettingsProps {
  hours: number;
  minutes: number;
  seconds: number;
  onHoursChange: (hours: number) => void;
  onMinutesChange: (minutes: number) => void;
  onSecondsChange: (seconds: number) => void;
  disabled?: boolean;
}

export function CountdownSettings({
  hours,
  minutes,
  seconds,
  onHoursChange,
  onMinutesChange,
  onSecondsChange,
  disabled = false,
}: CountdownSettingsProps) {
  return (
    <div className="flex justify-center space-x-4 mb-6">
      <div className="space-y-1">
        <Label htmlFor="hours" className="text-xs text-center block">
          Hours
        </Label>
        <Input
          id="hours"
          type="number"
          min={0}
          max={23}
          value={hours}
          onChange={(e) => onHoursChange(parseInt(e.target.value) || 0)}
          className="w-16 text-center h-9"
          disabled={disabled}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="minutes" className="text-xs text-center block">
          Minutes
        </Label>
        <Input
          id="minutes"
          type="number"
          min={0}
          max={59}
          value={minutes}
          onChange={(e) => onMinutesChange(parseInt(e.target.value) || 0)}
          className="w-16 text-center h-9"
          disabled={disabled}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="seconds" className="text-xs text-center block">
          Seconds
        </Label>
        <Input
          id="seconds"
          type="number"
          min={0}
          max={59}
          value={seconds}
          onChange={(e) => onSecondsChange(parseInt(e.target.value) || 0)}
          className="w-16 text-center h-9"
          disabled={disabled}
        />
      </div>
    </div>
  );
}
