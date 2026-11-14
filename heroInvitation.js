// LAMBO CITY — HERO HQ INVITATION
// Device-local persistence until the player account/message service is connected.

const STORAGE_KEY = "lambocity-hero-hq-invitation-v1";

const MESSAGE = {
  id: "hero-hq-welcome-v1",
  sender: "HERO",
  subject: "Come through to Records HQ",
  body: "What's up! I saw you out there. Welcome to LAMBO CITY. I want to see you at LAMBO CITY Records headquarters. Come through. I'll show you around and help you take your next step. — HERO",
  destination: "LAMBO CITY Records HQ"
};

function readStored() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.warn("[LAMBO CITY] HERO invitation could not be read.", error);
    return null;
  }
}

function writeStored(value) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent("lc-hero-invitation-updated", {
      detail: value
    }));
    return true;
  } catch (error) {
    console.warn("[LAMBO CITY] HERO invitation could not be saved.", error);
    return false;
  }
}

export default {
  deliver() {
    const existing = readStored();
    if (existing?.delivered) return existing;

    const invitation = {
      ...MESSAGE,
      delivered: true,
      read: false,
      accepted: false,
      deliveredAt: new Date().toISOString()
    };
    writeStored(invitation);
    return invitation;
  },

  get() {
    return readStored();
  },

  markRead() {
    const current = readStored();
    if (!current?.delivered || current.read) return current;
    const updated = { ...current, read: true };
    writeStored(updated);
    return updated;
  },

  accept() {
    const current = readStored();
    if (!current?.delivered) return null;
    const updated = {
      ...current,
      read: true,
      accepted: true,
      acceptedAt: current.acceptedAt || new Date().toISOString()
    };
    writeStored(updated);
    return updated;
  }
};
