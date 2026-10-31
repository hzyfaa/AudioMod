import { vi } from "vitest";

export function mockParameter(value = 0) {
  return { value, cancelScheduledValues: vi.fn(), setTargetAtTime: vi.fn() };
}

export function mockNode() {
  return {
    connect: vi.fn((node: unknown) => node),
    disconnect: vi.fn(),
    gain: mockParameter(1),
    frequency: mockParameter(),
    Q: mockParameter(),
    type: "",
    buffer: null,
  };
}

export class MockAudioContext {
  static instances: MockAudioContext[] = [];
  // Small sample rate keeps synthesized test buffers cheap.
  sampleRate = 100;
  currentTime = 0;
  state = "running";

  destination = mockNode();
  gains: ReturnType<typeof mockNode>[] = [];
  filters: ReturnType<typeof mockNode>[] = [];
  source = mockNode();
  convolver = mockNode();

  createGain = vi.fn(() => {
    const node = mockNode();
    this.gains.push(node);
    return node;
  });

  createBiquadFilter = vi.fn(() => {
    const node = mockNode();
    this.filters.push(node);
    return node;
  });

  createMediaElementSource = vi.fn(() => this.source);
  createConvolver = vi.fn(() => this.convolver);

  createBuffer = vi.fn((channels: number, length: number) => {
    const data = Array.from(
      { length: channels },
      () => new Float32Array(length),
    );
    return { getChannelData: (channel: number) => data[channel] };
  });

  resume = vi.fn(async () => {
    this.state = "running";
  });

  close = vi.fn(async () => {
    this.state = "closed";
  });

  constructor() {
    MockAudioContext.instances.push(this);
  }
}
