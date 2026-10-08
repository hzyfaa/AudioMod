import { createImpulseResponseBuffer } from "../utils/audioUtils";

export const EQ_FREQUENCIES = [60, 150, 400, 1000, 2400, 15000] as const;
export const MAX_VOLUME_BOOST = 200;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/** One effects chain per audio element, reused when its file changes. */
export function createAudioGraph(
  context: AudioContext,
  audio: HTMLAudioElement,
) {
  const dry = context.createGain();
  const wet = context.createGain();
  const boost = context.createGain();
  const convolver = context.createConvolver();
  const filters = EQ_FREQUENCIES.map((frequency) => {
    const filter = context.createBiquadFilter();
    filter.type = "peaking";
    filter.frequency.value = Math.min(frequency, context.sampleRate / 2);
    filter.Q.value = 1;
    filter.gain.value = 0;
    return filter;
  });

  // Generate this expensive noise buffer once, not on every upload.
  convolver.buffer = createImpulseResponseBuffer(context, 5, 5);
  dry.gain.value = 1;
  wet.gain.value = 0;
  boost.gain.value = 1;

  const source = context.createMediaElementSource(audio);
  let previous: AudioNode = source;
  for (const filter of filters) {
    previous.connect(filter);
    previous = filter;
  }
  previous.connect(dry).connect(boost);
  previous.connect(convolver).connect(wet).connect(boost);
  boost.connect(context.destination);

  const smooth = (parameter: AudioParam, value: number) => {
    // Smooth live slider changes to reduce abrupt discontinuities/clicks.
    parameter.cancelScheduledValues(context.currentTime);
    parameter.setTargetAtTime(value, context.currentTime, 0.015);
  };

  return {
    setReverb(value: number) {
      if (!Number.isFinite(value)) return;
      // Preserve the original sound: 100% effect uses a 50/50 mix.
      const mix = clamp(value, 0, 100) / 200;
      smooth(dry.gain, 1 - mix);
      smooth(wet.gain, mix);
    },
    setVolumeBoost(value: number) {
      if (!Number.isFinite(value)) return;
      // +100% means 2x gain; +200% retains the original 3x maximum.
      smooth(boost.gain, 1 + clamp(value, 0, MAX_VOLUME_BOOST) / 100);
    },
    setEQ(index: number, gain: number) {
      if (!Number.isInteger(index) || !filters[index] || !Number.isFinite(gain))
        return;
      smooth(filters[index].gain, clamp(gain, -12, 12));
    },
    disconnect() {
      for (const node of [source, ...filters, dry, wet, convolver, boost]) {
        node.disconnect();
      }
    },
  };
}

export type AudioGraph = ReturnType<typeof createAudioGraph>;
