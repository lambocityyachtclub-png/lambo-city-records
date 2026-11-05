/*
 * LAMBO CITY RECORDS — SHARED SESSION METRONOME
 *
 * Schedules tempo- and meter-aware click events against the shared
 * DAW session clock. Clicks are generated directly in Web Audio and
 * are not printed into recorded audio unless the user records a loopback.
 */

export function scheduleStudioMetronome(context, {
  startBar = 1,
  endBar = 129,
  startTime = context?.currentTime + 0.06,
  getSecondsAtBar,
  getTimeSignatureAtBar,
  volume = 0.16,
  accent = true
} = {}) {
  if (!context || context.state !== "running") {
    throw new Error("The Studio audio context must be running before scheduling the metronome.");
  }
  if (typeof getSecondsAtBar !== "function" || typeof getTimeSignatureAtBar !== "function") {
    throw new Error("The metronome requires the active session tempo and meter maps.");
  }

  const firstBar = Math.max(1, Number(startBar) || 1);
  const lastBar = Math.max(firstBar, Math.min(129, Number(endBar) || 129));
  const anchorSeconds = getSecondsAtBar(firstBar);
  const safeVolume = Math.max(0, Math.min(0.4, Number(volume) || 0.16));
  const sources = [];

  for (let bar = Math.floor(firstBar); bar < lastBar; bar += 1) {
    const meter = getTimeSignatureAtBar(bar) || {};
    const beatsPerBar = Math.max(1, Math.min(12, Number(meter.numerator) || 4));

    for (let beat = 0; beat < beatsPerBar; beat += 1) {
      const beatBar = bar + beat / beatsPerBar;
      if (beatBar + 0.000001 < firstBar || beatBar >= lastBar) continue;

      const at = Number(startTime) + Math.max(0, getSecondsAtBar(beatBar) - anchorSeconds);
      if (!Number.isFinite(at) || at < context.currentTime - 0.01) continue;

      const accented = Boolean(accent && beat === 0);
      const oscillator = context.createOscillator();
      const envelope = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = accented ? 1480 : 980;
      envelope.gain.setValueAtTime(0.0001, at);
      envelope.gain.exponentialRampToValueAtTime(
        Math.max(0.0002, safeVolume * (accented ? 1 : 0.72)),
        at + 0.003
      );
      envelope.gain.exponentialRampToValueAtTime(0.0001, at + 0.055);
      oscillator.connect(envelope);
      envelope.connect(context.destination);
      oscillator.start(at);
      oscillator.stop(at + 0.06);
      oscillator.onended = () => {
        try { oscillator.disconnect(); } catch {}
        try { envelope.disconnect(); } catch {}
      };
      sources.push(oscillator);
    }
  }

  return sources;
}

export function stopStudioMetronome(sources = []) {
  for (const source of sources.splice(0)) {
    source.onended = null;
    try { source.stop(); } catch {}
    try { source.disconnect(); } catch {}
  }
}

export default { scheduleStudioMetronome, stopStudioMetronome };
