export function createRecordingStartCoordinator(options = {}) {
  const schedule = options.setTimeout || ((callback, delay) => setTimeout(callback, delay));
  const cancelTimer = options.clearTimeout || (timerId => clearTimeout(timerId));
  if (typeof schedule !== "function" || typeof cancelTimer !== "function") {
    throw new Error("Recording start timer adapters must be functions.");
  }

  let generation = 0;
  let pendingToken = null;
  let timer = null;

  function begin() {
    if (pendingToken !== null) return null;
    generation += 1;
    pendingToken = generation;
    return pendingToken;
  }

  function isCurrent(token) {
    return pendingToken === token && generation === token;
  }

  function wait(token, delayMs) {
    if (!isCurrent(token)) return Promise.resolve(false);
    const delay = Number(delayMs);
    if (!Number.isFinite(delay) || delay < 0) {
      return Promise.reject(new Error("Recording count-in delay must be a non-negative number."));
    }
    return new Promise(resolve => {
      const timerId = schedule(() => {
        if (timer?.token === token) timer = null;
        resolve(isCurrent(token));
      }, delay);
      timer = { token, timerId, resolve };
    });
  }

  function cancel(token) {
    if (!isCurrent(token)) return false;
    generation += 1;
    if (timer?.token === token) {
      const pendingTimer = timer;
      timer = null;
      cancelTimer(pendingTimer.timerId);
      pendingTimer.resolve(false);
    }
    return true;
  }

  function finish(token) {
    if (pendingToken !== token) return false;
    if (timer?.token === token) {
      const pendingTimer = timer;
      timer = null;
      cancelTimer(pendingTimer.timerId);
      pendingTimer.resolve(false);
    }
    pendingToken = null;
    return true;
  }

  return Object.freeze({
    begin,
    isCurrent,
    isPending: () => pendingToken !== null,
    wait,
    cancel,
    finish
  });
}
