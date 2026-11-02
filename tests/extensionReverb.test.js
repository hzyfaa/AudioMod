import { describe, expect, it } from "vitest";
import { createReverb } from "../extension/reverb.js";
import { MockAudioContext } from "./audioMock";

function setup() {
	const context = new MockAudioContext();
	const reverb = createReverb(context);

	return { context, reverb };
}

describe("extension reverb", () => {
	it("starts dry and routes both paths to the output", () => {
		const { context, reverb } = setup();
		const [input, output, dry, wet] = context.gains;

		expect(reverb.getAmount()).toBe(0);
		expect(dry.gain.value).toBe(1);
		expect(wet.gain.value).toBe(0);

		expect(input.connect).toHaveBeenCalledWith(dry);
		expect(input.connect).toHaveBeenCalledWith(context.convolver);
		expect(context.convolver.connect).toHaveBeenCalledWith(wet);
		expect(dry.connect).toHaveBeenCalledWith(output);
		expect(wet.connect).toHaveBeenCalledWith(output);
	});

	it("clamps and smooths the blend without rebuilding the impulse", () => {
		const { context, reverb } = setup();
		const [, , dry, wet] = context.gains;

		reverb.setAmount(150);

		expect(reverb.getAmount()).toBe(100);
		expect(dry.gain.setTargetAtTime).toHaveBeenLastCalledWith(0.5, 0, 0.015);
		expect(wet.gain.setTargetAtTime).toHaveBeenLastCalledWith(0.5, 0, 0.015);

		reverb.setAmount(-10);

		expect(reverb.getAmount()).toBe(0);
		expect(dry.gain.setTargetAtTime).toHaveBeenLastCalledWith(1, 0, 0.015);
		expect(wet.gain.setTargetAtTime).toHaveBeenLastCalledWith(0, 0, 0.015);

		expect(() => reverb.setAmount(NaN)).toThrow();
		expect(() => reverb.setAmount(Infinity)).toThrow();
		expect(reverb.getAmount()).toBe(0);
		expect(wet.gain.setTargetAtTime).toHaveBeenCalledTimes(2);
		expect(context.createBuffer).toHaveBeenCalledTimes(1);
	});

	it("disconnects all reverb nodes during cleanup", () => {
		const { context, reverb } = setup();

		reverb.disconnect();

		for (const node of [...context.gains, context.convolver]) {
			expect(node.disconnect).toHaveBeenCalledTimes(1);
		}
	});
});
