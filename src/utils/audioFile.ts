export const MAX_AUDIO_BYTES = 20 * 1024 * 1024;
export const AUDIO_FILE_ACCEPT =
  "audio/*,.mp3,.wav,.ogg,.oga,.aac,.m4a,.mp4,.flac,.opus,.webm";

// File pickers sometimes provide no MIME type, especially on mobile
export function getAudioFileError(file: File): string | null {
  const hasAudioExtension =
    /\.(mp3|wav|ogg|oga|aac|m4a|mp4|flac|opus|webm)$/i.test(file.name);
  if (
    !file.type.startsWith("audio/") &&
    !(file.type === "" && hasAudioExtension)
  ) {
    return "Upload audio files only";
  }
  if (file.size === 0) return "Empty file";
  if (file.size > MAX_AUDIO_BYTES)
    return "Choose an audio file of 20 MB or less";
  return null;
}
