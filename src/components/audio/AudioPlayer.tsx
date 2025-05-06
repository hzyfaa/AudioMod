import { useAudio } from "@/hooks/useAudio";
import { UploadButton } from "@/components/audio/UploadButton";
import { SpeedSlider } from "@/components/controls/SpeedSlider";
import { ProgressBar } from "@/components/controls/ProgressBar";
import { ReverbSlider } from "@/components/controls/ReverbSlider";
import { Button } from "@/components/ui/button";
import { Play, Pause } from "lucide-react";

export function AudioPlayer() {
    const {
        audioRef,
        audioFile,
        fileName,
        speed,
        progress,
        duration,
        isPlaying,
        reverbAmount,
        uploadAudio,
        changeSpeed,
        seek,
        togglePlayback,
        changeReverb
    } = useAudio();

    return (
        <div className="flex flex-col items-center justify-center space-y-6">
            {/* Upload button */}
            <UploadButton accept="audio/*" onUpload={uploadAudio} />
            {/* audio controls - hidden until file is uploaded */}
            {audioFile && (
                <>
                    {/* Song title */}
                    <p className="text-base font-semibold py-5">
                        Playing: {fileName}
                    </p>
                    <audio preload="metadata" ref={audioRef} src={audioFile} />
                    {/* Play/Pause Button */}
                    <Button size="icon" className="rounded-full cursor-pointer hover:scale-105 transition-transform" onClick={togglePlayback}>
                        {isPlaying ? <Pause size={36} /> : <Play size={36} />}
                    </Button>
                    {/* Audio Seek */}
                    <ProgressBar currentTime={progress} duration={duration} onSeek={seek} />
                    {/* Speed Slider */}
                    <SpeedSlider value={speed} onChange={changeSpeed} />
                    {/* Reverb Slider */}
                    <ReverbSlider value={reverbAmount} onChange={changeReverb} />
                </>
            )}
        </div>
    );
}