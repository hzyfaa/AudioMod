import { Slider } from "@/components/ui/slider";

interface ProgressBarProps {
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

// format seconds as [MM:SS]
const formatTime = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${mins}:${secs}`;
};

export function ProgressBar({
  currentTime,
  duration,
  onSeek,
  min = 0,
  max = duration,
  step = 0.1,
}: ProgressBarProps) {
  const canSeek = Number.isFinite(max) && max > min;
  const safeTime = Number.isFinite(currentTime)
    ? Math.max(min, Math.min(currentTime, canSeek ? max : min))
    : min;
  return (
    <div className="max-w-sm w-full">
      <Slider
        aria-label="Playback position"
        disabled={!canSeek}
        min={min}
        max={canSeek ? max : min + 1}
        step={step}
        value={[safeTime]}
        onValueChange={([v]) => {
          onSeek(v);
        }}
      />
      <div className="mt-1 flex justify-between text-xs font-medium text-muted-foreground">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
}
