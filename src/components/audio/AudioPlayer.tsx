import { useAudio } from "@/hooks/useAudio";
import { UploadButton } from "@/components/audio/UploadButton";
import { Button } from "@/components/ui/button";

/**
 * AudioPlayer component handles uploading, playing, and pausing audio.
 */
export function AudioPlayer() {
    const { audioRef, audioFile, fileName, uploadAudio, play, pause } = useAudio();

    // Get next 5 days
    //const getTitle = 

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

                    <div className="flex space-x-4">
                        <Button onClick={play}>Play</Button>
                        <Button onClick={pause}>Pause</Button>
                    </div>
                </>
            )}
        </div>
    );
}
