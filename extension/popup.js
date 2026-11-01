const startButton = document.querySelector("#start");
const stopButton = document.querySelector("#stop");
const volumeSlider = document.querySelector("#volume");
const volumeValue = document.querySelector("#volume-value");
const statusText = document.querySelector("#status");

let active = false;
let busy = true;

function updateControls() {
  startButton.disabled = busy || active;
  stopButton.disabled = busy || !active;
  volumeSlider.disabled = busy || !active;
}

function render(state) {
  active = state.active;
  volumeSlider.value = String(state.volume);
  volumeValue.value = `${state.volume}%`;

  statusText.textContent = active
    ? "Processing audio from one tab."
    : "Ready. Start on a tab that is playing audio.";

  updateControls();
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
  if (
    message.target === "background" &&
    message.type === "ended"
  ) {
    void runCommand("status");
  }
});

void runCommand("status");