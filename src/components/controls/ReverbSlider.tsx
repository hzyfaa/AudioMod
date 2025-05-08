import { Slider } from "@/components/ui/slider";
import { useState } from "react";

interface ReverbSliderProps {
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
}

export function ReverbSlider({
    onChange,
    min = 0,
    max = 100,
    step = 5
}: ReverbSliderProps) {
    const [reverbValue, setReverbValue] = useState([0]);

    const handleChange = (v: number[]) => {
        setReverbValue(v);
        onChange(v[0]);
    };

    return (
        <div className="flex flex-col items-center space-y-2 w-full max-w-md">
            <label className="text-sm font-medium">Reverb: {reverbValue[0].toFixed(0)}%</label>
            <Slider
                min={min}
                max={max}
                step={step}
                value={reverbValue}
                onValueChange={handleChange}
            />
        </div>
    );
}