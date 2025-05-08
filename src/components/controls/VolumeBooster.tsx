import { Slider } from "@/components/ui/slider";
import { useState } from "react";

interface VolumeBoosterProps {
    onChange: (value: number) => void;
}

export function VolumeBooster({ onChange }: VolumeBoosterProps) {
    const [boost, setBoost] = useState([0]);

    const handleChange = (v: number[]) => {
        setBoost(v);
        onChange(v[0]);
    };

    return (
        <div className="flex flex-col items-center space-y-2 w-full max-w-md">
            <label className="text-sm font-medium">Volume Boost: {boost}%</label>
            <Slider
                min={0}
                max={300}
                step={5}
                value={boost}
                onValueChange={handleChange}
            />
        </div>
    );
}