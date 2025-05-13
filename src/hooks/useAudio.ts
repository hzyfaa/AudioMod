import { useRef, useState, useEffect, useCallback } from "react";
import { createImpulseResponseBuffer } from "@/utils/audioUtils";

interface UseAudioReturn {
    audioRef: React.RefObject<HTMLAudioElement | null>;
    audioFile: string | null;
    fileName: string | null;
    progress: number;
    duration: number;
    isPlaying: boolean;
    uploadAudio: (file: File) => void;
    togglePlayback: () => void;
    updateSpeed: (value: number) => void;
    seek: (value: number) => void;
    updateReverb: (value: number) => void;
    updateVolumeBoost: (value: number) => void;
    updateEQ: (bandIndex: number, gain: number) => void;
}

/*
 * @returns audio controls and state
 */
export function useAudio(): UseAudioReturn {
    // audio elements
    const audioRef = useRef<HTMLAudioElement>(null);
    const [audioFile, setAudioFile] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const speed = useRef(1.0);
    const reverb = useRef(0);
    const volumeBoost = useRef(1.0);
    const eqBands = useRef<number[]>([0, 0, 0, 0, 0, 0]);

    // audio node references
    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
    const convolverRef = useRef<ConvolverNode | null>(null);
    const dryGainRef = useRef<GainNode | null>(null);
    const wetGainRef = useRef<GainNode | null>(null);
    const boostGainRef = useRef<GainNode | null>(null);
    const filtersRef = useRef<BiquadFilterNode[]>([]);

    // return local url and set file name
    const uploadAudio = useCallback((file: File) => {
        // validate file type
        if (!file.type.startsWith('audio/')) {
            alert(`Invalid file type`);
            return;
        }

        // pause current audio if active
        if (audioRef.current && !audioRef.current.paused) {
            audioRef.current.pause();
            setIsPlaying(false);
        }

        // create local url
        setAudioFile((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return URL.createObjectURL(file);
        });

        // sets name without extention for UI display
        setFileName(file.name.replace(/\.[^/.]+$/, ""));
    }, []);

    const togglePlayback = useCallback(() => {
        if (!audioRef.current) return;

        const audio = audioRef.current;

        if (audio.paused) {
            audio.play();
        } else {
            audio.pause();
        }

        setIsPlaying(!audio.paused);
    }, []);

    const seek = useCallback((value: number) => {
        if (audioRef.current) audioRef.current.currentTime = value;
    }, []);

    const updateSpeed = useCallback((value: number) => {
        if (!audioRef.current) return;

        speed.current = value;
        audioRef.current.playbackRate = value;
    }, []);

    const updateReverb = useCallback((value: number) => {
        if (dryGainRef.current && wetGainRef.current) {
            reverb.current = value;

            const gainValue = value / 200;

            dryGainRef.current.gain.value = 1 - gainValue;
            wetGainRef.current.gain.value = gainValue;
        }
    }, []);

    const updateVolumeBoost = useCallback((value: number) => {
        if (!boostGainRef.current) return;

        const clampedVal = Math.min(Math.max(value, 0), 300);
        // slider value range: [0, 300]%
        // actual node range: [0, 3]
        const gainValue = 1 + (clampedVal / 300) * 2;

        volumeBoost.current = gainValue;
        boostGainRef.current.gain.value = gainValue;
    }, []);

    // update EQ band gain
    const updateEQ = useCallback((bandIndex: number, gain: number) => {
        if (!filtersRef.current) return;

        eqBands.current[bandIndex] = gain;
        filtersRef.current[bandIndex].gain.value = gain;
    }, []);

    const setUpAudioGraph = useCallback(() => {
        if (!audioRef.current) return;

        // store temp previous effect values
        const tempDry = dryGainRef.current?.gain.value;
        const tempWet = wetGainRef.current?.gain.value;

        const audio = audioRef.current;
        const context = audioContextRef.current ?? new AudioContext();
        audioContextRef.current = context;

        if (context.state === "suspended") context.resume();

        // flag audio element to avoid re-wrapping
        if (!sourceRef.current) sourceRef.current = context.createMediaElementSource(audio);

        // clean up old nodes
        dryGainRef.current?.disconnect();
        wetGainRef.current?.disconnect();
        convolverRef.current?.disconnect();
        boostGainRef.current?.disconnect();
        filtersRef.current.forEach(f => f.disconnect());

        // create new nodes
        dryGainRef.current = context.createGain();
        wetGainRef.current = context.createGain();
        convolverRef.current = context.createConvolver();
        boostGainRef.current = context.createGain();

        const frequencies = [60, 150, 400, 1000, 2400, 15000];
        filtersRef.current = frequencies.map((freq, i) => {
            const filter = context.createBiquadFilter();
            filter.type = "peaking";
            filter.frequency.value = freq;
            filter.gain.value = eqBands.current[i];
            filter.Q.value = 1.0;
            return filter;
        });

        // set impulse response (* currently takes default duration and decay *)
        convolverRef.current.buffer = createImpulseResponseBuffer(context, 5, 5);

        // connect nodes

        // SOURCE -> EQ -> split:
        //  dry gain -> boost
        //  convolver -> wet gain -> boost
        //      boost -> out

        let lastNode: AudioNode = sourceRef.current;

        // connect EQ filters
        filtersRef.current.forEach(filter => {
            lastNode.connect(filter);
            lastNode = filter;
        });

        // dry path
        lastNode.connect(dryGainRef.current)
            .connect(boostGainRef.current)
            .connect(context.destination);

        // wet path
        lastNode.connect(convolverRef.current)
            .connect(wetGainRef.current)
            .connect(boostGainRef.current)
            .connect(context.destination);

        // initialize audio effects
        // previously active effects are preserved
        audio.preservesPitch = false;
        audio.playbackRate = speed.current;
        dryGainRef.current.gain.value = tempDry ?? 1;
        wetGainRef.current.gain.value = tempWet ?? 0;
        boostGainRef.current.gain.value = volumeBoost.current;
    }, []);

    // initialize audio listeners and graph on file change 
    useEffect(() => {
        if (!audioRef.current || !audioFile) return;

        const audio = audioRef.current;
        // update current time
        const updateProgress = () => setProgress(audio.currentTime);
        // get duration once metadata is loaded
        const onLoadedMetadata = () => setDuration(audio.duration);
        // update play state on end
        const onEnded = () => setIsPlaying(false);

        // add listeners
        audio.addEventListener("timeupdate", updateProgress);
        audio.addEventListener("loadedmetadata", onLoadedMetadata);
        audio.addEventListener("ended", onEnded);

        //initialize audio graph
        setUpAudioGraph();

        // cleanup listeners
        return () => {
            audio.removeEventListener("timeupdate", updateProgress);
            audio.removeEventListener("loadedmetadata", onLoadedMetadata);
            audio.removeEventListener("ended", onEnded);
        };
    }, [audioFile, setUpAudioGraph]);

    // close AudioContext on unmount
    useEffect(() => {
        return () => { audioContextRef.current?.close().catch(console.error); }
    }, []);

    return {
        audioRef,
        audioFile,
        fileName,
        progress,
        duration,
        isPlaying,
        uploadAudio,
        togglePlayback,
        seek,
        updateSpeed,
        updateReverb,
        updateVolumeBoost,
        updateEQ
    };
}