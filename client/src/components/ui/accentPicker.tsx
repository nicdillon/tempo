import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";

const accentColors = [
  { name: "Red", value: "#FF5252" },
  { name: "Blue", value: "#2196F3" },
  { name: "Green", value: "#4CAF50" },
  { name: "Yellow", value: "#FFC107" },
  { name: "Purple", value: "#9C27B0" },
];

interface AccentPickerProps {
  onSelect?: (color: string) => void;
  className?: string;
}

export function AccentPicker({ onSelect, className }: AccentPickerProps) {
  const { accentColor, setAccentColor } = useTheme();

  const handleColorSelect = (color: string) => {
    setAccentColor(color);
    if (onSelect) {
      onSelect(color);
    }
  };

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      {accentColors.map((color) => (
        <Button
          key={color.value}
          type="button"
          variant="outline"
          className={cn(
            "w-8 h-8 rounded-full p-0 flex items-center justify-center",
            accentColor === color.value && "ring-2 ring-primary ring-offset-2"
          )}
          style={{ backgroundColor: color.value }}
          aria-label={`${color.name} accent color`}
          onClick={() => handleColorSelect(color.value)}
        />
      ))}
    </div>
  );
}
