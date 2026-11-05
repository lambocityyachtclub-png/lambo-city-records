/*
 * LAMBO CITY RECORDS — PCM CAPTURE WORKLET
 *
 * Captures the incoming Web Audio signal as Float32 chunks.
 * The main-thread recorder assembles and encodes the final WAV.
 */

class LamboCityPCMRecorderProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this.chunkFrames = Math.max(1024, Number(options?.processorOptions?.chunkFrames) || 8192);
    this.channelCount = 0;
    this.buffers = [];
    this.offset = 0;
    this.port.onmessage = event => {
      if (event.data?.type === "flush") {
        this.flush();
        this.port.postMessage({ type: "flush-complete" });
      }
    };
  }

  flush() {
    if (!this.offset || !this.channelCount) return;
    const channels = this.buffers.map(buffer => buffer.slice(0, this.offset));
    this.port.postMessage({ type: "chunk", channels }, channels.map(channel => channel.buffer));
    this.offset = 0;
  }

  process(inputs, outputs) {
    const input = inputs[0] || [];
    const output = outputs[0] || [];
    output.forEach(channel => channel.fill(0));

    if (!input.length || !input[0]?.length) return true;

    if (this.channelCount !== input.length) {
      this.flush();
      this.channelCount = input.length;
      this.buffers = Array.from(
        { length: this.channelCount },
        () => new Float32Array(this.chunkFrames)
      );
      this.offset = 0;
    }

    const frames = input[0].length;
    let copied = 0;
    while (copied < frames) {
      const count = Math.min(this.chunkFrames - this.offset, frames - copied);
      for (let channel = 0; channel < this.channelCount; channel += 1) {
        const source = input[channel] || input[0];
        this.buffers[channel].set(source.subarray(copied, copied + count), this.offset);
      }
      copied += count;
      this.offset += count;
      if (this.offset >= this.chunkFrames) this.flush();
    }
    return true;
  }
}

registerProcessor("lambo-city-pcm-recorder", LamboCityPCMRecorderProcessor);
