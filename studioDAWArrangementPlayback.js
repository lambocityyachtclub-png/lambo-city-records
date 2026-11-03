/*
 * LAMBO CITY RECORDS
 * DAW ARRANGEMENT PLAYBACK — V2
 *
 * Schedules session clips through one live channel strip
 * per track and the existing shared StudioAudioEngine.
 * Supports live gain, pan, mute, and solo changes.
 */

export function createStudioDAWArrangementPlayback({
  getAudioContext,
  getOutput,
  getTempo,
  onStatus = () => {}
} = {}) {
  if (typeof getAudioContext !== "function" || typeof getTempo !== "function") {
    throw new Error("Arrangement playback requires audio-context and tempo providers.");
  }

  const decodedBuffers = new WeakMap();

  return {
    sources: [],
    trackChannels: new Map(),
    activeTracks: [],
    runId: 0,
    playing: false,

    async decodeClip(context, blob) {
      if (decodedBuffers.has(blob)) return decodedBuffers.get(blob);
      const pending = (async () => {
        const bytes = await blob.arrayBuffer();
        return context.decodeAudioData(bytes.slice(0));
      })();
      decodedBuffers.set(blob, pending);
      try {
        return await pending;
      } catch (error) {
        decodedBuffers.delete(blob);
        throw error;
      }
    },

    disposeChannels() {
      this.trackChannels.forEach(({ gain, panner }) => {
        try { gain.disconnect(); } catch {}
        try { panner?.disconnect(); } catch {}
      });
      this.trackChannels.clear();
      this.activeTracks = [];
    },

    stop() {
      this.runId += 1;
      this.playing = false;
      const active = this.sources.splice(0);
      active.forEach(({ source }) => {
        source.onended = null;
        try { source.stop(); } catch {}
        try { source.disconnect(); } catch {}
      });
      this.disposeChannels();
    },

    createTrackChannel(context, track, output) {
      const gain = context.createGain();
      const panner = typeof context.createStereoPanner === "function"
        ? context.createStereoPanner()
        : null;
      if (panner) {
        gain.connect(panner);
        panner.connect(output);
      } else {
        gain.connect(output);
      }
      const channel = { gain, panner, track };
      this.trackChannels.set(track.id, channel);
      this.applyTrackState(track);
      return channel;
    },

    applyTrackState(track) {
      const channel = this.trackChannels.get(track.id);
      if (!channel) return;
      const anySolo = this.activeTracks.some(item => item.solo);
      const hasSeparateStems =
        this.activeTracks.some(item => item.name === "Vocals") &&
        this.activeTracks.some(item => item.name === "Beats");
      const excludedMaster = !anySolo && hasSeparateStems && track.name === "Master Mix";
      const muted = Boolean(track.muted || (anySolo && !track.solo) || excludedMaster);
      const volume = Math.max(0, Math.min(1, Number(track.volume ?? 80) / 100));
      const pan = Math.max(-1, Math.min(1, Number(track.pan ?? 0)));
      const now = channel.gain.context.currentTime;
      channel.gain.gain.setTargetAtTime(muted ? 0 : volume, now, 0.015);
      if (channel.panner) channel.panner.pan.setTargetAtTime(pan, now, 0.015);
    },

    syncTrackState(tracks = this.activeTracks) {
      this.activeTracks = tracks;
      tracks.forEach(track => this.applyTrackState(track));
    },

    setTrackVolume(trackId, value) {
      const track = this.activeTracks.find(item => item.id === trackId);
      if (!track) return;
      track.volume = Math.max(0, Math.min(100, Number(value) || 0));
      this.applyTrackState(track);
    },

    setTrackPan(trackId, value) {
      const track = this.activeTracks.find(item => item.id === trackId);
      if (!track) return;
      track.pan = Math.max(-1, Math.min(1, Number(value) || 0));
      this.applyTrackState(track);
    },

    async play(tracks = []) {
      this.stop();
      const runId = this.runId;
      const clips = [];

      tracks.forEach(track => {
        (Array.isArray(track.clips) ? track.clips : []).forEach(clip => {
          if (clip.blob && clip.blob.size > 0) clips.push({ track, clip });
        });
      });

      if (!clips.length) {
        onStatus("No recorded audio clips available for arrangement playback.");
        return false;
      }

      try {
        const context = await getAudioContext();
        if (!context || context.state !== "running") {
          throw new Error("The shared studio audio is not running.");
        }

        const tempo = Number(getTempo());
        if (!Number.isFinite(tempo) || tempo <= 0) {
          throw new Error("Set a valid song tempo before playback.");
        }

        const decoded = await Promise.all(clips.map(async item => ({
          ...item,
          buffer: await this.decodeClip(context, item.clip.blob)
        })));

        if (runId !== this.runId) return false;

        const output = getOutput ? getOutput(context) : context.destination;
        if (!output) throw new Error("The studio playback output is unavailable.");

        this.activeTracks = tracks;
        tracks.forEach(track => {
          if (!this.trackChannels.has(track.id)) {
            this.createTrackChannel(context, track, output);
          }
        });
        this.syncTrackState(tracks);

        const secondsPerBar = (60 / tempo) * 4;
        const startTime = context.currentTime + 0.12;

        decoded.forEach(({ track, clip, buffer }) => {
          const channel = this.trackChannels.get(track.id);
          if (!channel) return;
          const source = context.createBufferSource();
          const startBar = Number.isFinite(clip.startBar) ? Math.max(1, clip.startBar) : 1;
          source.buffer = buffer;
          source.connect(channel.gain);
          source.onended = () => {
            try { source.disconnect(); } catch {}
            if (runId !== this.runId) return;
            this.sources = this.sources.filter(item => item.source !== source);
            if (!this.sources.length) {
              this.playing = false;
              this.disposeChannels();
              onStatus("Arrangement playback finished.");
            }
          };
          this.sources.push({ source, trackId: track.id });
          source.start(startTime + ((startBar - 1) * secondsPerBar));
        });

        this.playing = this.sources.length > 0;
        onStatus(`Arrangement playing · ${tempo} BPM · ${decoded.length} audio clip(s).`);
        return this.playing;
      } catch (error) {
        if (runId === this.runId) {
          this.stop();
          onStatus(`ARRANGEMENT PLAYBACK ERROR: ${error?.message || error}`);
        }
        console.error("LAMBO CITY arrangement playback error:", error);
        return false;
      }
    }
  };
}

export default createStudioDAWArrangementPlayback;
