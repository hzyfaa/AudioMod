import { StrictMode } from "react";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAudio } from "../src/hooks/useAudio";
import { MockAudioContext } from "./audioMock";

let controls: ReturnType<typeof useAudio>;
function Player() {
  controls = useAudio();
  return (
    <audio ref={controls.audioRef} src={controls.audioFile ?? undefined} />
  );
}

const file = (name = "song.mp3") =>
  new File(["audio"], name, { type: "audio/mpeg" });
const upload = (name?: string) => act(() => controls.uploadAudio(file(name)));

beforeEach(() => {
  MockAudioContext.instances = [];
  vi.stubGlobal("AudioContext", MockAudioContext);
  let count = 0;
  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    value: vi.fn(() => `blob:test-${++count}`),
  });
  Object.defineProperty(URL, "revokeObjectURL", {
    configurable: true,
    value: vi.fn(),
  });
  vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => {});
  vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(
    async function (this: HTMLMediaElement) {
      Object.defineProperty(this, "paused", {
        configurable: true,
        value: false,
      });
      this.dispatchEvent(new Event("play"));
    },
  );
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(function (
    this: HTMLMediaElement,
  ) {
    Object.defineProperty(this, "paused", { configurable: true, value: true });
    this.dispatchEvent(new Event("pause"));
  });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("audio lifecycle", () => {
  it("creates each file URL once under StrictMode and waits for Play to create the graph", async () => {
    render(
      <StrictMode>
        <Player />
      </StrictMode>,
    );
    upload();
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(MockAudioContext.instances).toHaveLength(0);
    await act(() => controls.togglePlayback());
    expect(MockAudioContext.instances).toHaveLength(1);
    expect(controls.isPlaying).toBe(true);
  });

  it("reuses its source and reverb buffer across file changes and preserves settings", async () => {
    render(<Player />);
    upload();
    act(() => {
      controls.updateSpeed(0.8);
      controls.updateReverb(70);
      controls.updateEQ(0, 6);
    });
    await act(() => controls.togglePlayback());
    const context = MockAudioContext.instances[0];
    expect(context.filters[0].gain.setTargetAtTime).toHaveBeenLastCalledWith(
      6,
      0,
      0.015,
    );
    expect(context.gains[1].gain.setTargetAtTime).toHaveBeenLastCalledWith(
      0.35,
      0,
      0.015,
    );
    const audio = controls.audioRef.current!;
    Object.defineProperty(audio, "duration", {
      configurable: true,
      value: 120,
    });
    act(() => {
      fireEvent.loadedMetadata(audio);
      audio.currentTime = 50;
      fireEvent.timeUpdate(audio);
    });
    upload("next.mp3");
    expect(controls.progress).toBe(0);
    expect(controls.duration).toBe(0);
    expect(controls.isPlaying).toBe(false);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:test-1");
    await act(() => controls.togglePlayback());
    expect(audio.playbackRate).toBe(0.8);
    expect(MockAudioContext.instances).toHaveLength(1);
    expect(context.createMediaElementSource).toHaveBeenCalledTimes(1);
    expect(context.createBuffer).toHaveBeenCalledTimes(1);
  });

  it("reports a rejected play promise and can retry", async () => {
    render(<Player />);
    upload();
    vi.mocked(HTMLMediaElement.prototype.play).mockRejectedValueOnce(
      new Error("Playback blocked"),
    );
    await act(() => controls.togglePlayback());
    expect(controls.error).toMatch(/Could not play/);
    expect(controls.isPlaying).toBe(false);
    await act(() => controls.togglePlayback());
    expect(controls.error).toBeNull();
    expect(controls.isPlaying).toBe(true);
  });

  it("derives playback state from media events and handles decoding failures", async () => {
    render(<Player />);
    upload();
    const audio = controls.audioRef.current!;
    await act(() => controls.togglePlayback());
    act(() => fireEvent.pause(audio));
    expect(controls.isPlaying).toBe(false);
    act(() => fireEvent.play(audio));
    expect(controls.isPlaying).toBe(true);
    act(() => fireEvent.ended(audio));
    expect(controls.isPlaying).toBe(false);
    act(() => fireEvent.error(audio));
    expect(controls.error).toMatch(/decoded/);
  });

  it("does not start a new file when an older context-resume request completes", async () => {
    render(<Player />);
    upload();
    await act(() => controls.togglePlayback());
    await act(() => controls.togglePlayback());
    const context = MockAudioContext.instances[0];
    context.state = "suspended";
    let resume!: () => void;
    context.resume.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resume = resolve;
        }),
    );
    let pending!: Promise<void>;
    act(() => {
      pending = controls.togglePlayback();
    });
    upload("new.mp3");
    await act(async () => {
      resume();
      await pending;
    });
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(1);
    expect(controls.isPlaying).toBe(false);
    expect(controls.error).toBeNull();
  });

  it("ignores an old play rejection after a new file is selected", async () => {
    render(<Player />);
    upload();
    let reject!: (reason: Error) => void;
    vi.mocked(HTMLMediaElement.prototype.play).mockImplementationOnce(
      () =>
        new Promise<void>((_, fail) => {
          reject = fail;
        }),
    );
    let pending!: Promise<void>;
    act(() => {
      pending = controls.togglePlayback();
    });
    upload("new.mp3");
    await act(async () => {
      reject(new Error("Aborted by new source"));
      await pending;
    });
    expect(controls.error).toBeNull();
    expect(controls.isPlaying).toBe(false);
  });

  it("releases the last URL, audio source, nodes, and context on unmount", async () => {
    const { unmount } = render(<Player />);
    upload();
    await act(() => controls.togglePlayback());
    const context = MockAudioContext.instances[0];
    const audio = controls.audioRef.current!;
    unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledExactlyOnceWith("blob:test-1");
    expect(audio.hasAttribute("src")).toBe(false);
    expect(context.source.disconnect).toHaveBeenCalledTimes(1);
    expect(context.close).toHaveBeenCalledTimes(1);
  });

  it("keeps the current track when an invalid replacement is selected", () => {
    render(<Player />);
    upload();
    act(() =>
      controls.uploadAudio(
        new File(["text"], "notes.txt", { type: "text/plain" }),
      ),
    );
    expect(controls.audioFile).toBe("blob:test-1");
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
    expect(controls.error).toMatch(/audio file/);
  });

  it("guards unknown duration and clamps seeks to the track", () => {
    render(<Player />);
    upload();
    const audio = controls.audioRef.current!;
    act(() => controls.seek(5));
    expect(audio.currentTime).toBe(0);
    Object.defineProperty(audio, "duration", { configurable: true, value: 30 });
    act(() => controls.seek(99));
    expect(controls.progress).toBe(30);
    act(() => controls.seek(-1));
    expect(controls.progress).toBe(0);
    act(() => controls.seek(NaN));
    expect(audio.currentTime).toBe(0);
  });
});
