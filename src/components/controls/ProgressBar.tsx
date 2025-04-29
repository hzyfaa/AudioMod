// src/components/controls/ProgressBar.tsx
import { Slider } from "@/components/ui/slider";

interface ProgressBarProps {
    currentTime: number;
    duration: number;
    onSeek: (time: number) => void;
}

export function ProgressBar({ currentTime, duration, onSeek }: ProgressBarProps) {
    const handleSeek = (value: number[]) => {
        onSeek(value[0]);
    };

    const formatTime = (sec: number) => {
        const minutes = Math.floor(sec / 60);
        const seconds = Math.floor(sec % 60)
            .toString()
            .padStart(2, "0");
        return `${minutes}:${seconds}`;
    };

    return (
        <div className="w-full max-w-md flex flex-col items-center space-y-1">
            <Slider
                min={0}
                max={duration}
                step={0.1}
                value={[currentTime]}
                onValueChange={handleSeek}
            />
            <div className="w-full flex justify-between text-xs text-muted-foreground">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
            </div>
        </div>
    );
}
