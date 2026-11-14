const STORAGE_KEY = "lambocity-hero-hq-invitation-v2";
const EVENT_NAME = "lc-hero-invitation-updated";
let memoryInvitation = null;
let pendingAudioContext = null;

function readStored() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    memoryInvitation = value && value.delivered === true ? value : memoryInvitation;
    return value && value.delivered === true ? value : memoryInvitation;
  } catch {
    return memoryInvitation;
  }
}

function notify(message) {
  if (typeof document === "undefined") return;
  document.getElementById("lc-hero-invitation-toast")?.remove();
  const toast = document.createElement("div");
  toast.id = "lc-hero-invitation-toast";
  toast.setAttribute("role", "status");
  toast.style.cssText = "position:fixed;top:22px;left:50%;transform:translateX(-50%);z-index:12000;width:min(360px,calc(100vw - 32px));padding:17px 19px;border:1px solid rgba(255,215,0,.7);border-radius:15px;background:linear-gradient(145deg,#170d24,#07070b);box-shadow:0 12px 40px rgba(0,0,0,.55),0 0 22px rgba(255,215,0,.14);color:#fff;font:13px/1.55 Arial,sans-serif;text-align:left;";
  toast.innerHTML = '<div style="color:#ffd700;font-size:10px;letter-spacing:2px;font-weight:700;margin-bottom:5px;">NEW MESSAGE · HERO</div><div style="font-size:16px;font-weight:700;margin-bottom:5px;">You\'re invited.</div><div style="color:#ddd;">HERO sent you an invitation to LAMBO CITY Records. Open your Citizen Phone to read it.</div>';
  document.body.appendChild(toast);
  window.setTimeout(() => toast.remove(), 9000);
}

// Queue a two-tone notification for the next permitted user gesture when autoplay is blocked.
function playNotificationChime() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  try {
    const context = new AudioContextClass();
    pendingAudioContext = context;
    const play = () => {
      if (!pendingAudioContext || pendingAudioContext !== context) return;
      const now = context.currentTime;
      [880, 1174.66].forEach((frequency, index) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = "sine";
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0.0001, now + index * 0.13);
        gain.gain.exponentialRampToValueAtTime(0.12, now + index * 0.13 + 0.025);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.13 + 0.2);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(now + index * 0.13);
        oscillator.stop(now + index * 0.13 + 0.22);
      });
      pendingAudioContext = null;
      window.setTimeout(() => context.close().catch(() => {}), 700);
    };
    if (context.state === "running") {
      play();
      return;
    }
    const resumeOnGesture = () => {
      document.removeEventListener("pointerdown", resumeOnGesture);
      document.removeEventListener("keydown", resumeOnGesture);
      context.resume().then(() => {
        if (context.state === "running") play();
        else context.close().catch(() => {});
      }).catch(() => context.close().catch(() => {}));
    };
    document.addEventListener("pointerdown", resumeOnGesture, { once: true });
    document.addEventListener("keydown", resumeOnGesture, { once: true });
  } catch {
    pendingAudioContext = null;
  }
}

export default {
  get() {
    return readStored();
  },

  deliver() {
    const existing = readStored();
    if (existing) return existing;

    const invitation = {
      id: "hero-hq-invitation",
      sender: "HERO",
      subject: "You're invited.",
      body: "I want you to come see what we're building at LAMBO CITY Records. Head over to HQ. I've got something special to show you. — HERO",
      destination: "LAMBO CITY Records HQ",
      delivered: true,
      read: false,
      accepted: false,
      deliveredAt: new Date().toISOString()
    };

    memoryInvitation = invitation;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(invitation));
    } catch {
      // Keep the current session working even if browser storage is unavailable.
    }

    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: invitation }));
    notify(invitation);
    playNotificationChime();
    return invitation;
  },

  markRead() {
    const invitation = readStored();
    if (!invitation) return null;
    invitation.read = true;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(invitation));
    } catch {}
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: invitation }));
    return invitation;
  },

  accept() {
    const invitation = readStored();
    if (!invitation) return null;
    invitation.accepted = true;
    invitation.read = true;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(invitation));
    } catch {}
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: invitation }));
    return invitation;
  }
};
