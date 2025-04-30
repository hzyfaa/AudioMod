// ReverbSlider.tsx - Adjust reverb amount using Web Audio API
import { Slider } from "@/components/ui/slider";

interface ReverbSliderProps {
    value: number;
    onChange: (value: number) => void;
}

export function ReverbSlider({ value, onChange }: ReverbSliderProps) {
    const handleChange = (vals: number[]) => {
        onChange(vals[0] / 200);
    };

    return (
        <div className="flex flex-col items-center space-y-2 w-full max-w-md">
            <label className="text-sm font-medium">Reverb: {value.toFixed(0)}</label>
            <Slider
                min={0}
                max={100}
                step={5}
                value={[value]}
                onValueChange={handleChange}
            />
        </div>
    );
}