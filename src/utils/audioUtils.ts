/**
 * create reverb simulation with impulse response buffer
 * @param context : audioContext to use
 * @param duration : duration of the impulse in seconds
 * @param decay : decay rate of the reverb tail
 * @returns AudioBuffer containing the impulse response
 */
export function createImpulseResponseBuffer(
    context: AudioContext,
    duration = 3,
    decay = 3
): AudioBuffer {
    const rate = context.sampleRate;
    const length = Math.floor(rate * duration);
    const impulse = context.createBuffer(2, length, rate);

    for (let channel = 0; channel < 2; channel++) {
        const channelData = impulse.getChannelData(channel);
        for (let i = 0; i < length; i++) {
            // generate noise with exponential decay
            // random noise between [-1, 1]
            const n = Math.random() * 2 - 1;
            // normalized time [0,1]
            const t = i / length;
            channelData[i] = n * Math.pow(1 - t, decay);
        }
    }
    return impulse;
}