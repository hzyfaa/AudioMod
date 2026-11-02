export const EQ_FREQUENCIES = Object.freeze([60, 150, 400, 1000, 2400, 15000]);

export function createEqualizer(context) {
	const gains = EQ_FREQUENCIES.map(() => 0);

	const filters = EQ_FREQUENCIES.map((frequency) => {
		const filter = context.createBiquadFilter();

		filter.type = "peaking";
		filter.frequency.value = Math.min(frequency, context.sampleRate / 2);
		filter.Q.value = 1;
		filter.gain.value = 0;

		return filter;
	});

	for (let index = 0; index < filters.length - 1; index++) {
		filters[index].connect(filters[index + 1]);
	}

	return {
		input: filters[0],
		output: filters[filters.length - 1],

		getGains() {
			return [...gains];
		},

		setBand(index, value) {
			if (!Number.isInteger(index) || index < 0 || index >= filters.length) {
				throw new Error("Invalid equalizer band.");
			}

			if (!Number.isFinite(value)) {
				throw new Error("Equalizer gain must be a finite number.");
			}

			const nextGain = Math.min(12, Math.max(-12, value));
			const parameter = filters[index].gain;

			parameter.cancelScheduledValues(context.currentTime);
			parameter.setTargetAtTime(nextGain, context.currentTime, 0.015);

			gains[index] = nextGain;
		},

		disconnect() {
			for (const filter of filters) {
				filter.disconnect();
			}
		},
	};
}
