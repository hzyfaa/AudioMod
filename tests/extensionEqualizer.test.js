import { describe, expect, it } from "vitest";
import { createEqualizer } from "../extension/equalizer.js";
import { MockAudioContext } from "./audioMock";

function setup() {
	const context = new MockAudioContext();
	context.sampleRate = 48000;

	return {
		context,
		equalizer: createEqualizer(context),
	};
}

describe("extension equalizer", () => {
	it("connects all six bands in order and starts flat", () => {
		const { context, equalizer } = setup();

		expect(context.filters).toHaveLength(6);
		expect(equalizer.input).toBe(context.filters[0]);
		expect(equalizer.output).toBe(context.filters[5]);
		expect(equalizer.getGains()).toEqual([0, 0, 0, 0, 0, 0]);

		for (let index = 0; index < 5; index++) {
			expect(context.filters[index].connect).toHaveBeenCalledExactlyOnceWith(
				context.filters[index + 1],
			);
		}
	});

	it("limits gain and rejects invalid changes", () => {
		const { context, equalizer } = setup();

		equalizer.setBand(0, 99);
		equalizer.setBand(1, -99);

		expect(equalizer.getGains()).toEqual([12, -12, 0, 0, 0, 0]);

		expect(context.filters[0].gain.setTargetAtTime).toHaveBeenLastCalledWith(
			12,
			0,
			0.015,
		);

		expect(() => equalizer.setBand(-1, 3)).toThrow();
		expect(() => equalizer.setBand(6, 3)).toThrow();
		expect(() => equalizer.setBand(0.5, 3)).toThrow();
		expect(() => equalizer.setBand(0, NaN)).toThrow();

		expect(context.filters[0].gain.setTargetAtTime).toHaveBeenCalledTimes(1);
	});

	it("disconnects every filter during cleanup", () => {
		const { context, equalizer } = setup();

		equalizer.disconnect();

		for (const filter of context.filters) {
			expect(filter.disconnect).toHaveBeenCalledTimes(1);
		}
	});
});
