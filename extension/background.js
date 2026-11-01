let busy = false;

async function showState(active) {
  await chrome.action.setBadgeText({
    text: active ? "ON" : "",
  });

  await chrome.action.setTitle({
    title: active
      ? "Stop AudioMod"
      : "Start AudioMod on this tab",
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

async function toggleAudio(tab) {
  if (await chrome.offscreen.hasDocument()) {
    const { active } = await sendToAudio("status");

    await sendToAudio("stop");
    await chrome.offscreen.closeDocument();
    await showState(false);

    // limit to one active session at a time
    if (active) return;
  }

  if (tab.id === undefined) {
    throw new Error("No browser tab was selected.");
  }

  await chrome.offscreen.createDocument({
    url: "offscreen.html",
    reasons: ["USER_MEDIA"],
    justification: "Process and play audio captured from a browser tab.",
  });

  const streamId = await chrome.tabCapture.getMediaStreamId({
    targetTabId: tab.id,
  });

  await sendToAudio("start", { streamId });
  await showState(true);
}

chrome.action.onClicked.addListener(async (tab) => {
  if (busy) return;
  busy = true;

  try {
    await toggleAudio(tab);
  } catch (error) {
    // destroying the offscreen document releases its media resources
    try {
      if (await chrome.offscreen.hasDocument()) {
        await chrome.offscreen.closeDocument();
      }
    } catch (cleanupError) {
      console.error("AudioMod cleanup failed:", cleanupError);
    }

    const message =
      error instanceof Error ? error.message : String(error);

    console.error("AudioMod failed:", error);
    await chrome.action.setBadgeText({ text: "ERR" });
    await chrome.action.setTitle({
      title: `AudioMod: ${message}`,
    });
  } finally {
    busy = false;
  }
});

chrome.runtime.onMessage.addListener((message) => {
  if (message.target === "background" && message.type === "ended") {
    void showState(false);
  }
});