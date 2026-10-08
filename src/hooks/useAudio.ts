import { useRef, useState, useEffect, useCallback } from "react";
import { createAudioGraph, type AudioGraph } from "@/audio/audioGraph";
import { getAudioFileError } from "@/utils/audioFile";

export function useAudio() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const objectURLRef = useRef<string | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const graphRef = useRef<AudioGraph | null>(null);
  const playbackRef = useRef({ request: 0, pending: false });
  const settingsRef = useRef({
    speed: 1,
    reverb: 0,
    boost: 0,
    eq: [0, 0, 0, 0, 0, 0],
  });
  const [audioFile, setAudioFile] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadAudio = useCallback((file: File) => {
    const validationError = getAudioFileError(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    const url = URL.createObjectURL(file);
    playbackRef.current.request++;
    playbackRef.current.pending = false;
    audioRef.current?.pause();
    if (objectURLRef.current) URL.revokeObjectURL(objectURLRef.current);
    objectURLRef.current = url;
    setAudioFile(url);
    setFileName(file.name.replace(/\.[^/.]+$/, ""));
    setProgress(0);
    setDuration(0);
    setIsPlaying(false);
    setError(null);
  }, []);

  const togglePlayback = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !objectURLRef.current) return;

    if (!audio.paused || playbackRef.current.pending) {
      playbackRef.current.request++;
      playbackRef.current.pending = false;
      audio.pause();
      return;
    }

    const request = ++playbackRef.current.request;
    playbackRef.current.pending = true;
    setError(null);
    try {
      // Initialize/resume in a user gesture, not an upload effect.
      const context = contextRef.current ?? new AudioContext();
      contextRef.current = context;
      if (!graphRef.current) {
        const graph = createAudioGraph(context, audio);
        graphRef.current = graph;
        const settings = settingsRef.current;
        graph.setReverb(settings.reverb);
        graph.setVolumeBoost(settings.boost);
        settings.eq.forEach((gain, index) => graph.setEQ(index, gain));
      }
      if (context.state === "suspended") await context.resume();
      // A newer upload, stop, or unmount invalidates this request.
      if (request !== playbackRef.current.request) return;
      audio.preservesPitch = false;
      audio.playbackRate = settingsRef.current.speed;
      await audio.play();
    } catch {
      if (request === playbackRef.current.request) {
        setIsPlaying(false);
        setError(
          "Could not play this audio. Try again or choose another file.",
        );
      }
    } finally {
      if (request === playbackRef.current.request)
        playbackRef.current.pending = false;
    }
  }, []);

  const seek = useCallback((value: number) => {
    const audio = audioRef.current;
    if (
      !audio ||
      !Number.isFinite(value) ||
      !Number.isFinite(audio.duration) ||
      audio.duration <= 0
    )
      return;
    audio.currentTime = Math.min(audio.duration, Math.max(0, value));
    setProgress(audio.currentTime);
  }, []);

  const updateSpeed = useCallback((value: number) => {
    if (!Number.isFinite(value)) return;
    const speed = Math.min(2, Math.max(0.5, value));
    settingsRef.current.speed = speed;
    if (audioRef.current) audioRef.current.playbackRate = speed;
  }, []);

  const updateReverb = useCallback((value: number) => {
    if (!Number.isFinite(value)) return;
    settingsRef.current.reverb = value;
    graphRef.current?.setReverb(value);
  }, []);

  const updateVolumeBoost = useCallback((value: number) => {
    if (!Number.isFinite(value)) return;
    settingsRef.current.boost = value;
    graphRef.current?.setVolumeBoost(value);
  }, []);

  const updateEQ = useCallback((index: number, gain: number) => {
    if (
      !Number.isInteger(index) ||
      index < 0 ||
      index >= settingsRef.current.eq.length ||
      !Number.isFinite(gain)
    )
      return;
    settingsRef.current.eq[index] = gain;
    graphRef.current?.setEQ(index, gain);
  }, []);

  useEffect(() => {
    // keeps mounted, before first upload
    const audio = audioRef.current;
    if (!audio) return;
    const playback = playbackRef.current;
    const onTimeUpdate = () =>
      setProgress(Number.isFinite(audio.currentTime) ? audio.currentTime : 0);
    const onMetadata = () => {
      setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
      audio.preservesPitch = false;
      audio.playbackRate = settingsRef.current.speed;
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onError = () => {
      playbackRef.current.request++;
      playbackRef.current.pending = false;
      setIsPlaying(false);
      setDuration(0);
      setProgress(0);
      setError(
        "This file could not be decoded. Try a different audio file or format.",
      );
    };
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onMetadata);
    audio.addEventListener("durationchange", onMetadata);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onPause);
    audio.addEventListener("error", onError);

    return () => {
      playback.request++;
      playback.pending = false;
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onMetadata);
      audio.removeEventListener("durationchange", onMetadata);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onPause);
      audio.removeEventListener("error", onError);
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      if (objectURLRef.current) URL.revokeObjectURL(objectURLRef.current);
      objectURLRef.current = null;
      graphRef.current?.disconnect();
      graphRef.current = null;
      void contextRef.current?.close().catch(() => {
        // closed by browser
      });
      contextRef.current = null;
    };
  }, []);

  return {
    audioRef,
    audioFile,
    fileName,
    progress,
    duration,
    isPlaying,
    error,
    uploadAudio,
    togglePlayback,
    seek,
    updateSpeed,
    updateReverb,
    updateVolumeBoost,
    updateEQ,
  };
}
