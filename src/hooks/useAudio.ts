import { useRef, useState, useEffect, useCallback } from "react";
import { createImpulseResponseBuffer } from "@/utils/audioUtils";

interface UseAudioReturn {
    audioRef: React.RefObject<HTMLAudioElement | null>;
    audioFile: string | null;
    fileName: string | null;
    speed: number;
    progress: number;
    duration: number;
    isPlaying: boolean;
    reverbAmount: number;
    uploadAudio: (file: File) => void;
    togglePlayback: () => void;
    changeSpeed: (value: number) => void;
    seek: (value: number) => void;
    changeReverb: (value: number) => void;
}

/**
 * audio playback with effects and controls
 * @returns audio controls and state
 */
export function useAudio(): UseAudioReturn {
    // audio element reference
    const audioRef = useRef<HTMLAudioElement>(null);
    // audio state
    const [audioFile, setAudioFile] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [speed, setSpeed] = useState(1.0);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [reverbAmount, setReverbAmount] = useState(0);
    // audio node references
    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
    const convolverRef = useRef<ConvolverNode | null>(null);
    const dryGainRef = useRef<GainNode | null>(null);
    const wetGainRef = useRef<GainNode | null>(null);
  
    // create local URL
    const uploadAudio = useCallback((file: File) => {
        // validate file type
        if (!file.type.startsWith('audio/')) {
            alert(`Invalid file type`);
            return;
        }
        // create local url
        setAudioFile((prev) => {
            // avoid memory leak
            if (prev) URL.revokeObjectURL(prev);
            return URL.createObjectURL(file);
        });
        setFileName(file.name.replace(/\.[^/.]+$/, ""));
    }, []);

    // toggle play/pause
    const togglePlayback = useCallback(() => {
        const audio = audioRef.current;
        if (!audio) return;

        if (audio.paused) {
            audio.play();
        } else {
            audio.pause();
        }
        setIsPlaying(!audio.paused);
    }, []);
  
    // seek to time
    const seek = useCallback((value: number) => {
        // value should be within bounds
        if (audioRef.current) audioRef.current.currentTime = value;
    }, []);

    // update playback speed
    const changeSpeed = useCallback((value: number) => {
        if (audioRef.current) {
            audioRef.current.playbackRate = value;
            audioRef.current.preservesPitch = false;
            setSpeed(value);
        }
    }, []);

    // update reverb strength
    const changeReverb = useCallback((value: number) => {
        if (dryGainRef.current && wetGainRef.current) {
            dryGainRef.current.gain.value = 1 - value;
            wetGainRef.current.gain.value = value;
            setReverbAmount(value);
        }
    }, []);
           
    // set up audio processing graph
    const setUpAudioGraph = useCallback(() => {
        const audio = audioRef.current;
        if (!audio || !audioFile) return;

        const context = audioContextRef.current ?? new AudioContext();
        audioContextRef.current = context;

        if (context.state === "suspended") context.resume();

        // flag audio element to avoid re-wrapping
        if (!sourceRef.current) {
            try {
                sourceRef.current = context.createMediaElementSource(audio);
            } catch (e) {
                console.log("error: ", e);
                return;
            }
        }

        // disconnect old nodes
        dryGainRef.current?.disconnect();
        wetGainRef.current?.disconnect();
        convolverRef.current?.disconnect();
        // create gain and convolver nodes
        dryGainRef.current = context.createGain();
        wetGainRef.current = context.createGain();
        convolverRef.current = context.createConvolver();
        // set impulse response
        convolverRef.current.buffer = createImpulseResponseBuffer(context, 5, 5);
        // connect nodes with graph
        sourceRef.current
            .connect(dryGainRef.current)
            .connect(context.destination);
        sourceRef.current
            .connect(convolverRef.current)
            .connect(wetGainRef.current)
            .connect(context.destination);
        // set initial reverb
        setReverbAmount(0);
    }, [audioFile]);

    // set up event listeners for audio element
    const setEventlisteners = useCallback(() => {
        const audio = audioRef.current;
        if (!audio) return;

        // update current time
        const updateProgress = () => setProgress(audio.currentTime);
        // capture duration once metadata is loaded
        const onLoadedMetadata = () => setDuration(audio.duration);
        // update play state on end
        const onEnded = () => setIsPlaying(false);

        audio.addEventListener("timeupdate", updateProgress);
        audio.addEventListener("loadedmetadata", onLoadedMetadata);
        audio.addEventListener("ended", onEnded);

        return () => {
            audio.removeEventListener("timeupdate", updateProgress);
            audio.removeEventListener("loadedmetadata", onLoadedMetadata);
            audio.removeEventListener("ended", onEnded);
        };
    }, []);

    // set up audio context and graph
    useEffect(() => setUpAudioGraph(), [setUpAudioGraph]);

    // set up audio event listeners
    useEffect(() => {
        setEventlisteners();
    }, [audioFile, setEventlisteners]);

    // close AudioContext on unmount
    useEffect(() => {
        return () => {
            audioContextRef.current?.close().catch(console.error);
        };
    }, []);

    return {
        audioRef,
        audioFile,
        fileName,
        speed,
        progress,
        duration,
        isPlaying,
        reverbAmount,
        uploadAudio,
        togglePlayback,
        changeSpeed,
        seek,
        changeReverb
    };
}