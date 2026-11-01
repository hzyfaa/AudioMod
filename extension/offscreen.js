let stream = null;
let context = null;
let source = null;

async function stopAudio() {
  const oldStream = stream;
  const oldContext = context;
  const oldSource = source;

  stream = null;
  context = null;
  source = null;

  if (oldStream) {
    for (const track of oldStream.getTracks()) {
      track.onended = null;
      track.stop();
    }
  }

  oldSource?.disconnect();

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
    source.connect(context.destination);

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

async function handleMessage(message) {
  switch (message.type) {
    case "start":
      await startAudio(message.streamId);
      return { ok: true };

    case "stop":
      await stopAudio();
      return { ok: true };

    case "status":
      return { ok: true, active: stream?.active ?? false };

    default:
      throw new Error("Unknown audio command.");
  }
}

chrome.runtime.onMessage.addListener(
  (message, _sender, sendResponse) => {
    if (message.target !== "audio") return;

    handleMessage(message).then(
      sendResponse,
      (error) =>
        sendResponse({
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        }),
    );

    // keep the response channel open while asynchronous work finishes
    return true;
  },
);