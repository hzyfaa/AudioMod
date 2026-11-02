function createImpulse(context) {
	const rate = context.sampleRate;
	const duration = 3;
	const decaySeconds = 1.6;
	const length = Math.ceil(rate * duration);
	const buffer = context.createBuffer(2, length, rate);

	for (let channel = 0; channel < 2; channel++) {
		const samples = buffer.getChannelData(channel);

		const preDelay = 0.018 + channel * 0.0013;
		const tailStart = preDelay + 0.012;

		let seed = 1234567 + channel * 89123;

		const random = () => {
			seed ^= seed << 13;
			seed ^= seed >>> 17;
			seed ^= seed << 5;

			return ((seed >>> 0) / 4294967296) * 2 - 1;
		};

		for (let index = Math.ceil(tailStart * rate); index < length; index++) {
			const time = index / rate - tailStart;
			const fadeIn = Math.min(1, time / 0.008);
			const envelope = Math.exp((-Math.log(1000) * time) / decaySeconds);

			samples[index] = random() * 0.16 * fadeIn * envelope;
		}

		const delays = [0, 0.011, 0.023, 0.041];
		const levels = [0.8, 0.52, 0.31, 0.19];

		delays.forEach((delay, index) => {
			const time = preDelay + delay * (channel === 0 ? 1 : 1.07);

			const position = Math.round(time * rate);

			if (position < length) {
				samples[position] += levels[index];
			}
		});

		const highPassPole = Math.exp(
			(-2 * Math.PI * Math.min(140, rate * 0.2)) / rate,
		);

		let previousInput = 0;
		let highPassed = 0;
		let lowPass1 = 0;
		let lowPass2 = 0;

		for (let index = 0; index < length; index++) {
			const time = Math.max(0, index / rate - preDelay);

			const cutoff = Math.min(rate * 0.45, 1600 + 4400 * Math.exp(-time / 0.6));
			const coefficient = 1 - Math.exp((-2 * Math.PI * cutoff) / rate);
			const sample = samples[index];

			highPassed = highPassPole * (highPassed + sample - previousInput);
			previousInput = sample;

			lowPass1 += coefficient * (highPassed - lowPass1);
			lowPass2 += coefficient * (lowPass1 - lowPass2);

			const fadeOut = Math.min(1, (length - 1 - index) / (rate * 0.025));

			samples[index] = lowPass2 * fadeOut;
		}
	}

	return buffer;
}

export function createReverb(context) {
	const input = context.createGain();
	const output = context.createGain();
	const dry = context.createGain();
	const wet = context.createGain();
	const convolver = context.createConvolver();

	let amount = 0;
	convolver.buffer = createImpulse(context);
	dry.gain.value = 1;
	wet.gain.value = 0;
	input.connect(dry);
	dry.connect(output);
	input.connect(convolver);
	convolver.connect(wet);
	wet.connect(output);

	function smooth(parameter, value) {
		parameter.cancelScheduledValues(context.currentTime);
		parameter.setTargetAtTime(value, context.currentTime, 0.015);
	}

	return {
		input,
		output,

		getAmount() {
			return amount;
		},

		setAmount(value) {
			if (!Number.isFinite(value)) {
				throw new Error("Reverb amount must be a finite number.");
			}
			amount = Math.min(100, Math.max(0, value));
			const mix = amount / 200;
			smooth(dry.gain, 1 - mix);
			smooth(wet.gain, mix);
		},

		disconnect() {
			for (const node of [input, output, dry, wet, convolver]) {
				node.disconnect();
			}
		},
	};
}
