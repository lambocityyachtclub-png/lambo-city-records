// Keep phone navigation independent of the elevator's Three.js runtime.
// A phone request is accepted immediately and queued while the lift is busy,
// so the player never loses a requested destination during a landing.
export function createPhoneFloorNavigator({
  isBusy = () => false,
  isFloor2Discovered = () => false,
  getFloor2SessionMode = () => "free",
  hasDirectEntry = () => false,
  enterDirect = () => false,
  getPrepareFloor = () => null,
  selectFloor = () => {},
  onError = () => {}
} = {}) {
  let floor2DirectEntryPending = false;
  let queuedDestination = null;

  const selectOrQueue = destination => {
    const selected = selectFloor(destination);
    if (selected === false) {
      queuedDestination = destination;
    } else if (queuedDestination === destination) {
      queuedDestination = null;
    }
    return true;
  };

  const run = destination => {
    if (isBusy()) {
      queuedDestination = destination;
      return true;
    }

    if (destination !== 2 || !isFloor2Discovered()) {
      return selectOrQueue(destination);
    }

    if (hasDirectEntry()) {
      if (enterDirect() === true) {
        if (queuedDestination === 2) queuedDestination = null;
        return true;
      }

      const mode = getFloor2SessionMode();
      if (mode === "seated" || mode === "instrument") {
        if (queuedDestination === 2) queuedDestination = null;
        return true;
      }

      if (isBusy()) {
        queuedDestination = 2;
        return true;
      }

      return selectOrQueue(2);
    }

    if (floor2DirectEntryPending) {
      queuedDestination = 2;
      return true;
    }

    const prepareFloor = getPrepareFloor();
    if (typeof prepareFloor !== "function") {
      return selectOrQueue(2);
    }

    floor2DirectEntryPending = true;
    Promise.resolve()
      .then(() => prepareFloor(2))
      .then(() => {
        if (isBusy()) {
          queuedDestination = 2;
          return;
        }
        if (hasDirectEntry() && enterDirect() === true) {
          if (queuedDestination === 2) queuedDestination = null;
          return;
        }
        const mode = getFloor2SessionMode();
        if (mode === "seated" || mode === "instrument") {
          if (queuedDestination === 2) queuedDestination = null;
          return;
        }
        selectOrQueue(2);
      })
      .catch(error => {
        onError(error);
        if (isBusy()) {
          queuedDestination = 2;
          return;
        }
        selectOrQueue(2);
      })
      .finally(() => {
        floor2DirectEntryPending = false;
      });

    // The phone can close immediately; the cockpit opens after its module
    // is ready. A failed preload falls back to the normal elevator journey.
    return true;
  };

  const navigate = floor => {
    const destination = Number(floor);
    if (![2, 3].includes(destination)) return false;

    if (isBusy()) {
      queuedDestination = destination;
      return true;
    }

    return run(destination);
  };

  navigate.flush = () => {
    if (queuedDestination === null || isBusy()) return false;
    const destination = queuedDestination;
    queuedDestination = null;
    run(destination);
    return true;
  };

  navigate.getQueuedDestination = () => queuedDestination;

  return navigate;
}
