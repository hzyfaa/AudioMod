import { Slider } from "@/components/ui/slider";

interface ProgressBarProps {
    /* playback position in seconds */
    currentTime: number;
    /* duration in seconds */
    duration: number;
    /* on new position set */
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

// audio seek bar
export function ProgressBar({
    currentTime,
    duration,
    onSeek,
    min = 0,
    max = duration,
    step = 0.1
}: ProgressBarProps) {
    return (
        <div className="w-full max-w-md space-y-2">
            <div className="w-full flex justify-between text-xs text-muted-foreground">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
            </div>
            <Slider
                min={min}
                max={max}
                step={step}
                value={[currentTime]}
                onValueChange={([v]) => { onSeek(v) }}
            />
        </div>
    );
}