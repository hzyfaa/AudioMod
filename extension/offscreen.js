import { createEqualizer, EQ_FREQUENCIES } from "./equalizer.js";

let stream = null;
let context = null;
let source = null;
let gain = null;
let volume = 100;
let equalizer = null;

async function stopAudio() {
	const oldStream = stream;
	const oldContext = context;
	const oldSource = source;
	const oldGain = gain;
	const oldEqualizer = equalizer;

	stream = null;
	context = null;
	source = null;
	gain = null;
	equalizer = null;
	volume = 100;

	if (oldStream) {
		for (const track of oldStream.getTracks()) {
			track.onended = null;
			track.stop();
		}
	}

	oldSource?.disconnect();
	oldGain?.disconnect();
	oldEqualizer?.disconnect();

	if (oldContext && oldContext.state !== "closed") {
		await oldContext.close();
	}
}

async function startAudio(streamId) {
	await stopAudio();

	try {
		stream = await navigator.mediaDevices.getUserMedia({
			audio: {
				mandatory: {
					chromeMediaSource: "tab",
					chromeMediaSourceId: streamId,
				},
			},
			video: false,
		});

		context = new AudioContext();
		source = context.createMediaStreamSource(stream);
		gain = context.createGain();
		gain.gain.value = volume / 100;

		equalizer = createEqualizer(context);

		source.connect(equalizer.input);
		equalizer.output.connect(gain);
		gain.connect(context.destination);

		await context.resume();

		for (const track of stream.getTracks()) {
			track.onended = () => {
				void stopAudio()
					.then(() =>
						chrome.runtime.sendMessage({
							target: "background",
							type: "ended",
						}),
					)
					.catch(console.error);
			};
		}
	} catch (error) {
		await stopAudio();
		throw error;
	}
}

function setVolume(value) {
	if (!Number.isFinite(value)) {
		throw new Error("Volume must be a finite number.");
	}

	if (!stream?.active || !context || !gain) {
		throw new Error("Start audio processing before changing volume.");
	}

	volume = Math.min(200, Math.max(0, value));

	gain.gain.cancelScheduledValues(context.currentTime);
	gain.gain.setTargetAtTime(volume / 100, context.currentTime, 0.015);
}

async function handleMessage(message) {
	switch (message.type) {
		case "start":
			await startAudio(message.streamId);
			break;

		case "stop":
			await stopAudio();
			break;

		case "volume":
			setVolume(message.volume);
			break;

		case "eq":
			if (!stream?.active || !equalizer) {
				throw new Error(
					"Start audio processing before changing the equalizer.",
				);
			}

			equalizer.setBand(message.index, message.value);
			break;

		case "status":
			break;

		default:
			throw new Error("Unknown audio command.");
	}

	return {
		ok: true,
		active: stream?.active ?? false,
		volume,
		eq: equalizer?.getGains() ?? EQ_FREQUENCIES.map(() => 0),
	};
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
	if (message.target !== "audio") return;

	handleMessage(message).then(sendResponse, (error) =>
		sendResponse({
			ok: false,
			error: error instanceof Error ? error.message : String(error),
		}),
	);

	// keep the response channel open while asynchronous work finishes
	return true;
});
