import { Slider } from "@/components/ui/slider";
import { useState } from "react";

interface SpeedSliderProps {
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
}

export function SpeedSlider({
    onChange,
    min = 0.5,
    max = 2,
    step = 0.05
}: SpeedSliderProps) {
    const [speed, setSpeed] = useState([1.0]);

    const handleChange = (v: number[]) => {
        setSpeed(v);
        onChange(v[0]);
    };

    return (
        <div className="flex flex-col items-center space-y-2 w-full max-w-md">
            <label className="text-sm font-medium">Speed: {speed[0].toFixed(2)}x</label>
            <Slider
                id="speed-slider"
                min={min}
                max={max}
                step={step}
                value={speed}
                onValueChange={handleChange}
            />
        </div>
    );
}
