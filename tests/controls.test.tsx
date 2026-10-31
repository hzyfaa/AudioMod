import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SpeedSlider } from "../src/components/controls/SpeedSlider";
import { EQSlider } from "../src/components/controls/eq/EQSlider";

beforeEach(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    },
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("slider accessibility", () => {
  it("names the playback speed slider", () => {
    render(<SpeedSlider onChange={vi.fn()} />);

    expect(screen.getByRole("slider", { name: "Playback speed" })).toBeTruthy();
  });

  it("names the equalizer slider by its frequency band", () => {
    render(<EQSlider label="60Hz" onChange={vi.fn()} />);

    expect(
      screen.getByRole("slider", { name: "60Hz equalizer gain" }),
    ).toBeTruthy();
  });
});
