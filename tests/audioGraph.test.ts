import { describe, expect, it } from "vitest";
import { createAudioGraph } from "../src/audio/audioGraph";
import { MockAudioContext } from "./audioMock";

function setup() {
  const context = new MockAudioContext();
  const graph = createAudioGraph(
    context as unknown as AudioContext,
    document.createElement("audio"),
  );
  return { context, graph };
}

describe("audio effects", () => {
  it("start dry, routes both paths through the boost, and connects the output once", () => {
    const { context } = setup();
    const [dry, wet, boost] = context.gains;
    expect(dry.gain.value).toBe(1);
    expect(wet.gain.value).toBe(0);
    expect(boost.gain.value).toBe(1);
    expect(context.source.connect).toHaveBeenCalledWith(context.filters[0]);
    expect(context.filters[5].connect).toHaveBeenCalledWith(dry);
    expect(context.filters[5].connect).toHaveBeenCalledWith(context.convolver);
    expect(context.convolver.connect).toHaveBeenCalledWith(wet);
    expect(dry.connect).toHaveBeenCalledWith(boost);
    expect(wet.connect).toHaveBeenCalledWith(boost);
    expect(boost.connect).toHaveBeenCalledExactlyOnceWith(context.destination);
  });

  it("maps boost percentages accurately and caps gain at the original 3x maximum", () => {
    const { context, graph } = setup();
    const gain = context.gains[2].gain;
    for (const [input, expected] of [
      [0, 1],
      [100, 2],
      [200, 3],
      [300, 3],
      [-1, 1],
    ]) {
      graph.setVolumeBoost(input);
      expect(gain.setTargetAtTime).toHaveBeenLastCalledWith(expected, 0, 0.015);
    }
    graph.setVolumeBoost(NaN);
    expect(gain.setTargetAtTime).toHaveBeenCalledTimes(5);
  });

  it("smooth reverb mix without recreating buffer", () => {
    const { context, graph } = setup();
    graph.setReverb(100);
    expect(context.gains[0].gain.setTargetAtTime).toHaveBeenLastCalledWith(
      0.5,
      0,
      0.015,
    );
    expect(context.gains[1].gain.setTargetAtTime).toHaveBeenLastCalledWith(
      0.5,
      0,
      0.015,
    );
    graph.setReverb(0);
    expect(context.gains[1].gain.setTargetAtTime).toHaveBeenLastCalledWith(
      0,
      0,
      0.015,
    );
    expect(context.createBuffer).toHaveBeenCalledTimes(1);
  });

  it("clamp EQ and reject invalid band indices", () => {
    const { context, graph } = setup();
    graph.setEQ(0, 99);
    expect(context.filters[0].gain.setTargetAtTime).toHaveBeenCalledWith(
      12,
      0,
      0.015,
    );
    graph.setEQ(-1, 3);
    graph.setEQ(6, 3);
    graph.setEQ(0.5, 3);
    graph.setEQ(0, Infinity);
    expect(context.filters[0].gain.setTargetAtTime).toHaveBeenCalledTimes(1);
  });

  it("disconnect every node when disposed", () => {
    const { context, graph } = setup();
    graph.disconnect();
    for (const node of [
      context.source,
      ...context.filters,
      ...context.gains,
      context.convolver,
    ]) {
      expect(node.disconnect).toHaveBeenCalledTimes(1);
    }
  });
});
