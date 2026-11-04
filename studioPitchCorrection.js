/*
 * LAMBO CITY RECORDS
 * SHARED VOCAL PITCH-CORRECTION NODE FACTORY
 * Loads the worklet once per audio context for live and offline rendering.
 */
const loadedContexts = new WeakSet();
const pendingContexts = new WeakMap();

export function normalizePitchCorrectionSettings(settings = {}) {
  return {
    enabled: Boolean(settings.enabled),
    root: Math.max(0, Math.min(11, Math.round(Number(settings.root) || 0))),
    scale: ["major", "minor", "chromatic"].includes(settings.scale) ? settings.scale : "major",
    amount: Math.max(0, Math.min(100, Number(settings.amount ?? 100))),
    speedMs: Math.max(0, Math.min(120, Number(settings.speedMs ?? 25)))
  };
}

export async function createStudioPitchCorrectionNode(context, settings = {}) {
  if (!context?.audioWorklet || typeof AudioWorkletNode !== "function") {
    throw new Error("Vocal pitch correction requires AudioWorklet support. Update Safari or use a supported browser.");
  }
  if (!loadedContexts.has(context)) {
    let pending = pendingContexts.get(context);
    if (!pending) {
      const moduleUrl = new URL("./studioPitchCorrectionWorklet.js", import.meta.url).href;
      pending = context.audioWorklet.addModule(moduleUrl);
      pendingContexts.set(context, pending);
    }
    try {
      await pending;
      loadedContexts.add(context);
    } catch (error) {
      pendingContexts.delete(context);
      throw new Error("The vocal pitch-correction processor could not be loaded: " + (error?.message || error));
    }
  }
  const node = new AudioWorkletNode(context, "lambo-city-pitch-correction", {
    numberOfInputs: 1,
    numberOfOutputs: 1,
    outputChannelCount: [2],
    channelCount: 2,
    channelCountMode: "max",
    processorOptions: normalizePitchCorrectionSettings(settings)
  });
  node.port.postMessage(normalizePitchCorrectionSettings(settings));
  return node;
}

export default createStudioPitchCorrectionNode;
