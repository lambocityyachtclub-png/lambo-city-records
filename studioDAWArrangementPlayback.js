
/*
 * LAMBO CITY RECORDS
 * DAW ARRANGEMENT PLAYBACK — V1
 *
 * Schedules recorded audio clips against the shared
 * studio AudioContext using their timeline bar positions.
 *
 * Does not create a second audio engine.
 */

export function createStudioDAWArrangementPlayback({
  getAudioContext,
  getOutput,
  getTempo,
  onStatus = () => {}
} = {}) {
  if (
    typeof getAudioContext !== "function" ||
    typeof getTempo !== "function"
  ) {
    throw new Error(
      "Arrangement playback requires audio-context and tempo providers."
    );
  }

  const decodedBuffers = new WeakMap();

  return {
    sources: [],
    runId: 0,
    playing: false,

    async decodeClip(context, blob) {
      if (decodedBuffers.has(blob)) {
        return decodedBuffers.get(blob);
      }

      const bytes = await blob.arrayBuffer();
      const buffer = await context.decodeAudioData(
        bytes.slice(0)
      );

      decodedBuffers.set(blob, buffer);
      return buffer;
    },

    stop() {
      this.runId += 1;
      this.playing = false;

      const active = this.sources.splice(0);

      active.forEach(({ source, gain }) => {
        source.onended = null;

        try {
          source.stop();
        } catch {}

        try {
          source.disconnect();
          gain.disconnect();
        } catch {}
      });
    },

    async play(tracks = []) {
      this.stop();

      const runId = this.runId;

      const anySolo = tracks.some(track => track.solo);

      const hasSeparateStems =
        tracks.some(track => track.name === "Vocals") &&
        tracks.some(track => track.name === "Beats");

      const clips = [];

      tracks.forEach(track => {
        if (track.muted || (anySolo && !track.solo)) {
          return;
        }

        if (
          !anySolo &&
          hasSeparateStems &&
          track.name === "Master Mix"
        ) {
          return;
        }

        (Array.isArray(track.clips) ? track.clips : [])
          .forEach(clip => {
            if (clip.blob && clip.blob.size > 0) {
              clips.push({ track, clip });
            }
          });
      });

      if (!clips.length) {
        onStatus(
          "No recorded audio clips available for arrangement playback."
        );
        return false;
      }

      try {
        const context = await getAudioContext();

        if (!context || context.state !== "running") {
          throw new Error(
            "The shared studio audio is not running."
          );
        }

        const tempo = Number(getTempo());

        if (!Number.isFinite(tempo) || tempo <= 0) {
          throw new Error(
            "Set a valid song tempo before playback."
          );
        }

        const decoded = await Promise.all(
          clips.map(async item => ({
            ...item,
            buffer: await this.decodeClip(
              context,
              item.clip.blob
            )
          }))
        );

        // Cancel if STOP was pressed while decoding.
        if (runId !== this.runId) {
          return false;
        }

        const output = getOutput
          ? getOutput(context)
          : context.destination;

        if (!output) {
          throw new Error(
            "The studio playback output is unavailable."
          );
        }

        // Four beats per bar.
        const secondsPerBar = (60 / tempo) * 4;
        const startTime = context.currentTime + 0.12;

        decoded.forEach(({ track, clip, buffer }) => {
          const source = context.createBufferSource();
          const gain = context.createGain();

          const startBar = Number.isFinite(clip.startBar)
            ? Math.max(1, clip.startBar)
            : 1;

          const startOffset =
            (startBar - 1) * secondsPerBar;

          source.buffer = buffer;

          gain.gain.value = Math.max(
            0,
            Math.min(
              1,
              Number(track.volume ?? 80) / 100
            )
          );

          source.connect(gain);
          gain.connect(output);

          source.onended = () => {
            try {
              source.disconnect();
              gain.disconnect();
            } catch {}

            if (runId === this.runId) {
              this.sources = this.sources.filter(
                item => item.source !== source
              );

              if (!this.sources.length) {
                this.playing = false;
                onStatus(
                  "Arrangement playback finished."
                );
              }
            }
          };

          this.sources.push({ source, gain });

          source.start(startTime + startOffset);
        });

        this.playing = this.sources.length > 0;

        onStatus(
          `Arrangement playing · ${tempo} BPM · ${decoded.length} audio clip(s).`
        );

        return this.playing;

      } catch (error) {
        if (runId === this.runId) {
          this.stop();

          onStatus(
            `ARRANGEMENT PLAYBACK ERROR: ${error?.message || error}`
          );
        }

        console.error(
          "LAMBO CITY arrangement playback error:",
          error
        );

        return false;
      }
    }
  };
}

export default createStudioDAWArrangementPlayback;
