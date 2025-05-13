import { EQSlider } from "@/components/controls/eq/EQSlider";

const frequencies = ["60Hz", "150Hz", "400Hz", "1KHz", "2.4KHz", "15KHz"];

interface EqualizerProps {
    onChange: (index: number, value: number) => void;
}

export function Equalizer({ onChange }: EqualizerProps) {

    return (
        <div className="bg-transparent p-4">
            {/* SLIDERS */}
            <div className="flex justify-between gap-4">
                {frequencies.map((label, i) => (
                    <EQSlider
                        key={label}
                        label={label}
                        onChange={(v) => onChange(i, v)}
                    />
                ))}
            </div>
        </div>
    );
}
