import { Slider } from "@/components/ui/slider";
import { useState } from "react";
import { MAX_VOLUME_BOOST } from "@/audio/audioGraph";

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
      <label className="text-sm font-medium">Volume Boost: +{boost[0]}%</label>
      <Slider
        aria-label="Volume boost"
        min={0}
        max={MAX_VOLUME_BOOST}
        step={5}
        value={boost}
        onValueChange={handleChange}
      />
    </div>
  );
}
