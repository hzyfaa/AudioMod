// process commands in order

let pending = Promise.resolve();

async function showState(active) {
  await chrome.action.setBadgeText({
    text: active ? "ON" : "",
  });

  await chrome.action.setTitle({
    title: active ? "AudioMod is active" : "Open AudioMod",
  });
}

async function sendToAudio(type, extra = {}) {
  const response = await chrome.runtime.sendMessage({
    target: "audio",
    type,
    ...extra,
  });

  if (!response?.ok) {
    throw new Error(response?.error ?? "AudioMod did not respond.");
  }

  return response;
}

async function getState() {
  if (!(await chrome.offscreen.hasDocument())) {
    return { ok: true, active: false, volume: 100 };
  }

  return sendToAudio("status");
}

async function stopCapture() {
  try {
    if (await chrome.offscreen.hasDocument()) {
      try {
        await sendToAudio("stop");
      } finally {
        await chrome.offscreen.closeDocument();
      }
    }
  } finally {
    await showState(false);
  }
}

async function startCapture() {
  const state = await getState();

  if (state.active) {
    throw new Error("Stop the current session before starting another.");
  }

  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });

  if (tab?.id === undefined) {
    throw new Error("No browser tab was selected.");
  }

  // remove inactive document after a captured tab closed
  await stopCapture();

  try {
    await chrome.offscreen.createDocument({
      url: "offscreen.html",
      reasons: ["USER_MEDIA"],
      justification: "Process and play audio captured from a browser tab.",
    });

    const streamId = await chrome.tabCapture.getMediaStreamId({
      targetTabId: tab.id,
    });

    await sendToAudio("start", { streamId });
  } catch (error) {
    try {
      await stopCapture();
    } catch (cleanupError) {
      console.error("AudioMod cleanup failed:", cleanupError);
    }

    throw error;
  }
}

async function handleCommand(message) {
  switch (message.type) {
    case "start":
      await startCapture();
      break;

    case "stop":
      await stopCapture();
      break;

    case "volume":
      await sendToAudio("volume", { volume: message.volume });
      break;

    case "status":
    case "ended":
      break;

    default:
      throw new Error("Unknown AudioMod command.");
  }

  const state = await getState();
  await showState(state.active);
  return state;
}

chrome.runtime.onMessage.addListener(
  (message, _sender, sendResponse) => {
    if (message.target !== "background") return;

    const result = pending.then(() => handleCommand(message));

    // a failed command should not block later commands
    pending = result.catch(() => undefined);

    result.then(
      sendResponse,
      (error) =>
        sendResponse({
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        }),
    );

    return true;
  },
);