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
    step = 0.1
}: ProgressBarProps) {
    return (
        <div className="max-w-sm w-full">
            <Slider
                min={min}
                max={max}
                step={step}
                value={[currentTime]}
                onValueChange={([v]) => { onSeek(v) }}
            />
            <div className="mt-1 flex justify-between text-xs font-medium text-muted-foreground">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
            </div>
        </div>
    );
}