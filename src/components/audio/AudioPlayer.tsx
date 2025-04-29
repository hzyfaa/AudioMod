import { useAudio } from "@/hooks/useAudio";
import { UploadButton } from "@/components/audio/UploadButton";
import { Button } from "@/components/ui/button";
import { SpeedSlider } from "@/components/controls/SpeedSlider";
import { ProgressBar } from "@/components/controls/ProgressBar";
import { Play, Pause } from 'lucide-react';

/**
 * AudioPlayer component handles uploading, playing, and pausing audio.
 */
export function AudioPlayer() {
    const { audioRef, audioFile, fileName, speed, progress, duration, isPlaying, uploadAudio, changeSpeed, seek, toggleState } = useAudio();

    return (
        <div className="flex flex-col items-center justify-center space-y-6">
            {/* Upload button */}
            <UploadButton onUpload={uploadAudio} />

            {/* Song title */}
            <p className="text-sm text-muted-foreground">{fileName}</p>

            {/* Controls are only shown after audio is uploaded */}
            {audioFile && (
                <>
                    <audio ref={audioRef} src={audioFile} preload="metadata" hidden />

                    {/* Play/Pause Button */}
                    <Button size="icon" className="rounded-full cursor-pointer" onClick={toggleState}>
                        {isPlaying ? <Pause size={38} /> : <Play size={36} />}
                    </Button>

                    {/* Audio Seek */}
                    <ProgressBar currentTime={progress} duration={duration} onSeek={seek} />

                    {/* Speed Slider */}
                    <SpeedSlider value={speed} onChange={changeSpeed} />
                </>
            )}
        </div>
    );
}
