import { describe, expect, it } from "vitest";
import { getAudioFileError, MAX_AUDIO_BYTES } from "../src/utils/audioFile";

describe("audio file validation", () => {
  it("accepts audio MIME variants and a known extension when MIME is missing", () => {
    expect(
      getAudioFileError(
        new File(["audio"], "song.wav", { type: "audio/x-wav" }),
      ),
    ).toBeNull();
    expect(getAudioFileError(new File(["audio"], "song.M4A"))).toBeNull();
  });
  it("reject non-audio/unknown or empty files", () => {
    expect(
      getAudioFileError(new File(["text"], "song.mp3", { type: "text/plain" })),
    ).toMatch(/audio file/);
    expect(getAudioFileError(new File(["text"], "unknown"))).toMatch(
      /audio file/,
    );
    expect(
      getAudioFileError(new File([], "song.mp3", { type: "audio/mpeg" })),
    ).toMatch(/Empty/);
  });
  it("test file size, 20 MB", () => {
    const file = new File(["audio"], "song.mp3", { type: "audio/mpeg" });
    Object.defineProperty(file, "size", {
      value: MAX_AUDIO_BYTES,
      configurable: true,
    });
    expect(getAudioFileError(file)).toBeNull();
    Object.defineProperty(file, "size", { value: MAX_AUDIO_BYTES + 1 });
    expect(getAudioFileError(file)).toMatch(/20 MB/);
  });
});
