import { EQ_FREQUENCIES } from "./equalizer.js";

const startButton = document.querySelector("#start");
const stopButton = document.querySelector("#stop");
const volumeSlider = document.querySelector("#volume");
const volumeValue = document.querySelector("#volume-value");
const statusText = document.querySelector("#status");
const equalizerControls = document.querySelector("#equalizer");
const bandsContainer = document.querySelector("#eq-bands");

let active = false;
let busy = true;

function formatGain(value) {
	return `${value > 0 ? "+" : ""}${value} dB`;
}

const bandControls = EQ_FREQUENCIES.map((frequency, index) => {
	const row = document.createElement("p");
	const label = document.createElement("label");
	const slider = document.createElement("input");
	const output = document.createElement("output");

	slider.id = `eq-${index}`;
	slider.type = "range";
	slider.min = "-12";
	slider.max = "12";
	slider.step = "1";
	slider.value = "0";
	slider.setAttribute("aria-valuetext", "0 dB");

	label.htmlFor = slider.id;
	label.textContent =
		frequency >= 1000 ? `${frequency / 1000} kHz` : `${frequency} Hz`;

	output.setAttribute("for", slider.id);
	output.value = "0 dB";

	slider.addEventListener("input", () => {
		const value = Number(slider.value);

		output.value = formatGain(value);
		slider.setAttribute("aria-valuetext", formatGain(value));

		void request("eq", { index, value }).catch((error) => {
			statusText.textContent = error.message;
		});
	});

	row.append(label, document.createElement("br"), slider, output);

	bandsContainer.append(row);

	return { slider, output };
});

function updateControls() {
	startButton.disabled = busy || active;
	stopButton.disabled = busy || !active;
	volumeSlider.disabled = busy || !active;
	equalizerControls.disabled = busy || !active;
}

function render(state) {
	active = state.active;
	volumeSlider.value = String(state.volume);
	volumeValue.value = `${state.volume}%`;

	statusText.textContent = active
		? "Processing audio from one tab."
		: "Ready. Start on a tab that is playing audio.";

	updateControls();

	bandControls.forEach(({ slider, output }, index) => {
		const value = state.eq[index];

		slider.value = String(value);
		output.value = formatGain(value);
		slider.setAttribute("aria-valuetext", formatGain(value));
	});
}

async function request(type, extra = {}) {
	const response = await chrome.runtime.sendMessage({
		target: "background",
		type,
		...extra,
	});

	if (!response?.ok) {
		throw new Error(response?.error ?? "AudioMod did not respond.");
	}

	return response;
}

async function runCommand(type, extra = {}) {
	busy = true;
	updateControls();

	try {
		render(await request(type, extra));
	} catch (error) {
		statusText.textContent = error.message;
	} finally {
		busy = false;
		updateControls();
	}
}

startButton.addEventListener("click", () => {
	void runCommand("start");
});

stopButton.addEventListener("click", () => {
	void runCommand("stop");
});

volumeSlider.addEventListener("input", () => {
	const volume = Number(volumeSlider.value);
	volumeValue.value = `${volume}%`;

	void request("volume", { volume }).catch((error) => {
		statusText.textContent = error.message;
	});
});

// refresh if the captured tab closes while the popup is open
chrome.runtime.onMessage.addListener((message) => {
	if (message.target === "background" && message.type === "ended") {
		void runCommand("status");
	}
});

void runCommand("status");
