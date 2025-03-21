import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface PomodoroSettingsProps {
  workMinutes: number;
  breakMinutes: number;
  cycles: number;
  onWorkMinutesChange: (minutes: number) => void;
  onBreakMinutesChange: (minutes: number) => void;
  onCyclesChange: (cycles: number) => void;
  disabled?: boolean;
}

export function PomodoroSettings({
  workMinutes,
  breakMinutes,
  cycles,
  onWorkMinutesChange,
  onBreakMinutesChange,
  onCyclesChange,
  disabled = false,
}: PomodoroSettingsProps) {
  return (
    <div className="flex justify-center space-x-3 md:space-x-4 mb-6">
      <div className="space-y-1">
        <Label htmlFor="work-minutes" className="text-xs text-center block">
          Work (min)
        </Label>
        <Input
          id="work-minutes"
          type="number"
          min={1}
          max={60}
          value={workMinutes}
          onChange={(e) => onWorkMinutesChange(parseInt(e.target.value) || 25)}
          className="w-14 sm:w-16 text-center h-9 px-2"
          disabled={disabled}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="break-minutes" className="text-xs text-center block">
          Break (min)
        </Label>
        <Input
          id="break-minutes"
          type="number"
          min={1}
          max={30}
          value={breakMinutes}
          onChange={(e) => onBreakMinutesChange(parseInt(e.target.value) || 5)}
          className="w-14 sm:w-16 text-center h-9 px-2"
          disabled={disabled}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="cycles" className="text-xs text-center block">
          Cycles
        </Label>
        <Input
          id="cycles"
          type="number"
          min={1}
          max={10}
          value={cycles}
          onChange={(e) => onCyclesChange(parseInt(e.target.value) || 4)}
          className="w-14 sm:w-16 text-center h-9 px-2"
          disabled={disabled}
        />
      </div>
    </div>
  );
}
