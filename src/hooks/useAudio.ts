import { useRef, useState, useEffect } from "react";

/**
 * Custom hook to manage audio upload and playback.
 * Handles creating audio URLs, play/pause controls, and cleanup.
 */
export function useAudio() {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [audioFile, setAudioFile] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);

    /**
     * Uploads an audio file and creates a local URL.
     * @param file The uploaded audio file
     */
    const uploadAudio = (file: File) => {
        const url = URL.createObjectURL(file);
        setAudioFile((prev) => {
            if (prev) {
                // Revoke old URL to avoid memory leaks
                URL.revokeObjectURL(prev);
            }
            return url;
        });
        // remove extension
        const name = file.name.replace(/\.[^/.]+$/, "");
        setFileName(name);
    };

    /**
     * Play audio.
     */
    const play = () => {
        audioRef.current?.play();
    };

    /**
     * Pause audio.
     */
    const pause = () => {
        audioRef.current?.pause();
    };

    /**
     * Cleanup URL object when component unmounts
     */
    useEffect(() => {
        return () => {
            if (audioFile) {
                URL.revokeObjectURL(audioFile);
            }
        };
    }, [audioFile]);

    return { audioRef, audioFile, fileName, uploadAudio, play, pause };
}