import { useRef, useState, useEffect } from "react";

/**
 * Custom hook to manage audio upload and playback
 * Handles creating audio URLs, play/pause controls, and cleanup
 */
export function useAudio() {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [audioFile, setAudioFile] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [speed, setSpeed] = useState(1.0);
    const [progress, setProgress] = useState(0); // in seconds
    const [duration, setDuration] = useState(0); // total length in seconds
    const [isPlaying, setIsPlaying] = useState(false); // Track play/pause state

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

        // remove extension from name
        const name = file.name.replace(/\.[^/.]+$/, "");
        setFileName(name);
    };

    // progress bar
    const seek = (value: number) => {
        if (audioRef.current) {
            audioRef.current.currentTime = value;
        }
    };

    // adjust speed
    const changeSpeed = (value: number) => {
        setSpeed(value);
        if (audioRef.current) {
            audioRef.current.playbackRate = value;
        }
    };

    // play audio
    const play = () => {
        audioRef.current?.play();
        setIsPlaying(true);
    };

    // pause audio
    const pause = () => {
        audioRef.current?.pause();
        setIsPlaying(false);
    };

    // Toggle between play and pause
    const toggleState = () => {
        if (!audioRef.current) return;
        if (audioRef.current.paused) {
            play();
        } else {
            pause();
        }
    };

    // track audio
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        // Update current time as audio plays
        const updateProgress = () => {
            setProgress(audio.currentTime);
        };

        // Capture duration once metadata is loaded
        const onLoadedMetadata = () => {
            setDuration(audio.duration);
        };

        // Update play state on end
        const onEnded = () => {
            setIsPlaying(false);
        };

        audio.addEventListener("timeupdate", updateProgress);
        audio.addEventListener("loadedmetadata", onLoadedMetadata);
        audio.addEventListener("ended", onEnded);

        return () => {
            audio.removeEventListener("timeupdate", updateProgress);
            audio.removeEventListener("loadedmetadata", onLoadedMetadata);
            audio.removeEventListener("ended", onEnded);
        };
    }, [audioFile]);

    // Cleanup URL object when component unmounts
    useEffect(() => {
        return () => {
            if (audioFile) {
                URL.revokeObjectURL(audioFile);
            }
        };
    }, [audioFile]);

    return { audioRef, audioFile, fileName, speed, progress, duration, isPlaying, uploadAudio, toggleState, changeSpeed, seek };
}