import { useRef, useState, useEffect } from "react";

// Generates a simple impulse response buffer used for simulating reverb
function createImpulseResponse(audioContext: AudioContext, duration = 2, decay = 2) {
    const rate = audioContext.sampleRate;
    const length = rate * duration;
    const impulse = audioContext.createBuffer(2, length, rate);

    for (let channel = 0; channel < 2; channel++) {
        const channelData = impulse.getChannelData(channel);
        for (let i = 0; i < length; i++) {
            // Fill buffer with exponentially decaying white noise
            channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
        }
    }
    return impulse;
}

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

    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
    const convolverRef = useRef<ConvolverNode | null>(null);
    const dryGainRef = useRef<GainNode | null>(null);
    const wetGainRef = useRef<GainNode | null>(null);
    const [reverbAmount, setReverbAmount] = useState(0); // 0 = dry only, 1 = full reverb

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

    /**
    * Updates the reverb wet/dry mix based on slider input.
    * @param value A number from 0 (dry) to 1 (full wet)
    */
    const changeReverb = (value: number) => {
        setReverbAmount(value);
        if (dryGainRef.current && wetGainRef.current) {
            dryGainRef.current.gain.value = 1 - value; // reduce dry as reverb increases
            wetGainRef.current.gain.value = value;     // increase wet
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

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !audioFile) return;

        const context = audioContextRef.current ?? new AudioContext();
        audioContextRef.current = context;

        if (context.state === "suspended") {
            context.resume();
        }

        // Create source only once — store a flag on the audio element itself to avoid re-wrapping
        if (!sourceRef.current) {
            try {
                sourceRef.current = context.createMediaElementSource(audio);
            } catch (e) {
                console.log("error: ", e);
                return;
            }
        }

        // Disconnect old nodes
        dryGainRef.current?.disconnect();
        wetGainRef.current?.disconnect();
        convolverRef.current?.disconnect();

        // Create gain and convolver nodes
        dryGainRef.current = context.createGain();
        wetGainRef.current = context.createGain();
        convolverRef.current = context.createConvolver();
        convolverRef.current.buffer = createImpulseResponse(context, 5, 5);

        // Connect audio graph:
        sourceRef.current.connect(dryGainRef.current).connect(context.destination);
        sourceRef.current.connect(convolverRef.current).connect(wetGainRef.current).connect(context.destination);

        dryGainRef.current.gain.value = 1 - reverbAmount;
        wetGainRef.current.gain.value = reverbAmount;
    }, [audioFile]);

    useEffect(() => {
        return () => {
            audioContextRef.current?.close();
        };
    }, []);

    return { audioRef, audioFile, fileName, speed, progress, duration, isPlaying, uploadAudio, toggleState, changeSpeed, seek, reverbAmount, changeReverb };
}