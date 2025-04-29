// src/components/controls/SpeedSlider.tsx
import { Slider } from "@/components/ui/slider";

interface SpeedSliderProps {
    value: number;
    onChange: (value: number) => void;
}

export function SpeedSlider({ value, onChange }: SpeedSliderProps) {
    const handleChange = (vals: number[]) => {
        onChange(vals[0]);
    };

    return (
        <div className="flex flex-col items-center space-y-2 w-full max-w-md">
            <label className="text-sm font-medium">Speed: {value.toFixed(1)}x</label>
            <Slider
                min={0.5}
                max={2}
                step={0.1}
                value={[value]}
                onValueChange={handleChange}
            />
        </div>
    );
}
