import { Slider } from "@/components/ui/slider";

interface ReverbSliderProps {
    /* current reverb value (0-1) */
    value: number;
    /* on reverb change */
    onChange: (value: number) => void;
    /* min reverb amount (default: 0) */
    min?: number;
    /* max reverb amount (default: 100) */
    max?: number;
    /* step (default: 5) */
    step?: number;
}

// slider control for adjusting reverb strength
export function ReverbSlider({
    onChange,
    value,
    min = 0,
    max = 100,
    step = 5
}: ReverbSliderProps) {
    return (
        <div className="flex flex-col items-center space-y-2 w-full max-w-md">
            <label className="text-sm font-medium">Reverb: {value.toFixed(0)}%</label>
            <Slider
                min={min}
                max={max}
                step={step}
                value={[value]}
                onValueChange={([v]) => onChange(v)}
            />
        </div>
    );
}