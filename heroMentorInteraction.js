// LAMBO CITY — HERO mentor interaction
// Available after HERO completes his approved stage exit and reaches Records HQ.
// This is a lightweight front-end conversation layer; it does not invent
// player records, rewards, royalties, or persistent backend state.

const ADVICE = [
  {
    title: "BUILD YOUR SOUND",
    message: "Find the sound that feels like you. Study the greats, learn the craft, then make something people can recognize as yours."
  },
  {
    title: "OWN YOUR WORK",
    message: "Know what you create, who contributes, and what each person is owed. Keep your credits and agreements clear from the beginning."
  },
  {
    title: "STAY CONSISTENT",
    message: "One great moment can open a door. Preparation, discipline, and showing up again are what help you stay in the room."
  },
  {
    title: "BUILD THE COMMUNITY",
    message: "Your name matters, but how you treat people matters too. Make room for other creators and build something that lasts."
  }
];

let prompt = null;
let panel = null;
let heading = null;
let message = null;
let index = 0;
let isOpen = false;

const style = (node, rules) => Object.assign(node.style, rules);
const element = (tag, content, parent) => {
  const node = document.createElement(tag);
  if (content) node.textContent = content;
  if (parent) parent.appendChild(node);
  return node;
};

function build() {
  prompt = element("button", "TALK WITH HERO", document.body);
  prompt.type = "button";
  prompt.setAttribute("aria-label", "Talk with HERO");
  style(prompt, {
    position: "fixed", left: "50%", bottom: "174px", transform: "translateX(-50%)",
    zIndex: "680", display: "none", padding: "13px 22px",
    border: "1px solid rgba(226,190,125,.9)", borderRadius: "999px",
    background: "rgba(8,10,15,.96)", color: "#f3d9a6",
    font: "700 11px Arial,sans-serif", letterSpacing: "1.5px",
    boxShadow: "0 8px 30px rgba(0,0,0,.48)", cursor: "pointer",
    touchAction: "manipulation"
  });
  prompt.addEventListener("click", openPanel);

  panel = element("div", "", document.body);
  panel.id = "lcr-hero-mentor";
  style(panel, {
    position: "fixed", inset: "0", zIndex: "900", display: "none",
    alignItems: "center", justifyContent: "center", padding: "18px",
    boxSizing: "border-box", background: "rgba(2,4,8,.84)",
    backdropFilter: "blur(9px)", WebkitBackdropFilter: "blur(9px)",
    color: "#f5f0e8", fontFamily: "Arial,sans-serif"
  });

  const card = element("section", "", panel);
  style(card, {
    width: "min(520px,100%)", padding: "clamp(22px,5vw,34px)",
    boxSizing: "border-box", border: "1px solid rgba(211,174,111,.58)",
    borderRadius: "18px", background: "linear-gradient(145deg,#211d18,#080b11)",
    boxShadow: "0 24px 90px rgba(0,0,0,.68)"
  });

  element("div", "LAMBO CITY RECORDS  /  THE MENTOR", card).style.cssText =
    "font-size:10px;font-weight:700;letter-spacing:2px;color:#d8b475";
  element("h2", "A WORD FROM HERO", card).style.cssText =
    "font-size:clamp(25px,5vw,34px);line-height:1.1;margin:20px 0 8px;color:#fff";
  heading = element("div", "", card);
  style(heading, { color: "#d8b475", fontSize: "11px", fontWeight: "700", letterSpacing: "1.8px", margin: "0 0 14px" });
  message = element("p", "", card);
  style(message, { color: "rgba(245,240,232,.9)", fontSize: "15px", lineHeight: "1.75", minHeight: "105px", margin: "0 0 22px" });

  const actions = element("div", "", card);
  style(actions, { display: "flex", flexWrap: "wrap", gap: "10px" });
  const next = element("button", "ANOTHER LESSON", actions);
  next.type = "button";
  style(next, { flex: "1 1 160px", padding: "13px 16px", border: "1px solid #a88750", borderRadius: "999px", background: "#241e15", color: "#f3d9a6", fontSize: "10px", fontWeight: "700", letterSpacing: "1px", cursor: "pointer" });
  next.addEventListener("click", () => {
    index = (index + 1) % ADVICE.length;
    renderAdvice();
  });
  const close = element("button", "CLOSE", actions);
  close.type = "button";
  style(close, { flex: "1 1 100px", padding: "13px 16px", border: "1px solid rgba(255,255,255,.24)", borderRadius: "999px", background: "#111318", color: "#fff", fontSize: "10px", fontWeight: "700", letterSpacing: "1px", cursor: "pointer" });
  close.addEventListener("click", closePanel);
  panel.addEventListener("click", event => { if (event.target === panel) closePanel(); });
  renderAdvice();
}

function renderAdvice() {
  if (!heading || !message) return;
  heading.textContent = ADVICE[index].title;
  message.textContent = ADVICE[index].message;
}

function openPanel() {
  if (!panel) return;
  isOpen = true;
  panel.style.display = "flex";
  prompt.style.display = "none";
  window.__lamboCityHeroMentorOpen = true;
}

function closePanel() {
  isOpen = false;
  if (panel) panel.style.display = "none";
  window.__lamboCityHeroMentorOpen = false;
}

export default {
  init() {
    if (!prompt) build();
  },
  update(delta, context) {
    if (!prompt || !context?.player?.position) return;
    const state = context.systems?.heroPostPerformance?.getState?.();
    const hero = context.systems?.npc?.getHero?.();
    const available = state === "ARRIVED" && hero;
    if (!available) {
      if (!isOpen) prompt.style.display = "none";
      return;
    }
    const dx = context.player.position.x - hero.position.x;
    const dz = context.player.position.z - hero.position.z;
    const inRange = Math.hypot(dx, dz) <= 4.8;
    if (!isOpen) prompt.style.display = inRange ? "block" : "none";
  }
};
