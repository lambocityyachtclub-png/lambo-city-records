// Keep phone navigation independent of the elevator's Three.js runtime.
// This makes the lazy-loaded Floor 2 return path directly testable.
export function createPhoneFloorNavigator({
  isBusy = () => false,
  isFloor2Discovered = () => false,
  hasDirectEntry = () => false,
  enterDirect = () => false,
  getPrepareFloor = () => null,
  selectFloor = () => {},
  onError = () => {}
} = {}) {
  let floor2DirectEntryPending = false;

  return floor => {
    const destination = Number(floor);
    if (![2, 3].includes(destination) || isBusy()) return false;

    if (destination !== 2 || !isFloor2Discovered()) {
      selectFloor(destination);
      return true;
    }

    if (hasDirectEntry()) {
      return enterDirect() === true;
    }

    if (floor2DirectEntryPending) return true;

    const prepareFloor = getPrepareFloor();
    if (typeof prepareFloor !== "function") {
      selectFloor(2);
      return true;
    }

    floor2DirectEntryPending = true;
    Promise.resolve()
      .then(() => prepareFloor(2))
      .then(() => {
        if (hasDirectEntry() && enterDirect()) return;
        if (!isBusy()) selectFloor(2);
      })
      .catch(error => {
        onError(error);
        if (!isBusy()) selectFloor(2);
      })
      .finally(() => {
        floor2DirectEntryPending = false;
      });

    // The phone can close immediately; the cockpit opens after its module
    // is ready. A failed preload falls back to the normal elevator journey.
    return true;
  };
}
