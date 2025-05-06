import { Slider } from "@/components/ui/slider";

interface SpeedSliderProps {
    value: number;
    onChange: (value: number) => void;
    /* min (default: 0.5) */
    min?: number;
    /* max (default: 2) */
    max?: number;
    /* step (default: 0.05) */
    step?: number;
}

export function SpeedSlider({
    value,
    onChange,
    min = 0.5,
    max = 2,
    step = 0.05
}: SpeedSliderProps) {
    return (
        <div className="flex flex-col items-center space-y-2 w-full max-w-md">
            <label className="text-sm font-medium">Speed: {value}x</label>
            <Slider
                id="speed-slider"
                min={min}
                max={max}
                step={step}
                value={[value]}
                onValueChange={([v]) => onChange(v)}
            />
        </div>
    );
}
