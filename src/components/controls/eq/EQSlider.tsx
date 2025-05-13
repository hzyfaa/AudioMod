import { Slider } from "@/components/ui/slider";
import { useState } from "react";

interface EQSliderProps {
    label: string;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
}

export function EQSlider({
    label,
    onChange,
    min = -12,
    max = 12,
}: EQSliderProps) {
    const [bandValue, setBandValue] = useState([0]);

    const handleChange = (v: number[]) => {
        setBandValue(v);
        onChange(v[0]);
    };

    return (
        <div className="flex flex-col items-center gap-2">
            <Slider
                orientation="vertical"
                min={min}
                max={max}
                value={bandValue}
                onValueChange={handleChange}
                className="bg-neutral-700 rounded-full"
            />
            <label className="text-xs font-medium text-gray-600">{label}</label>
        </div>
    );
}