export const FOUNDERS_WELCOME_STORAGE_KEY = "lambo-city.founders-welcome.v1";

function getBrowserStorage() {
  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
}

export function hasCompletedFoundersWelcome(storage) {
  if (storage === undefined) storage = getBrowserStorage();
  try {
    return storage?.getItem(FOUNDERS_WELCOME_STORAGE_KEY) === "complete";
  } catch {
    return false;
  }
}

export function markFoundersWelcomeComplete(storage) {
  if (storage === undefined) storage = getBrowserStorage();
  try {
    storage?.setItem(FOUNDERS_WELCOME_STORAGE_KEY, "complete");
    return true;
  } catch {
    return false;
  }
}

function makeText(documentRef, tag, value, className) {
  const node = documentRef.createElement(tag);
  node.textContent = value;
  if (className) node.className = className;
  return node;
}

export default {
  init({ documentRef = globalThis.document, storage } = {}) {
    if (storage === undefined) storage = getBrowserStorage();
    if (!documentRef?.body || hasCompletedFoundersWelcome(storage)) return null;
    const existing = documentRef.getElementById("lc-founders-welcome");
    if (existing) return existing;

    const style = documentRef.createElement("style");
    style.id = "lc-founders-welcome-style";
    style.textContent = `
      #lc-founders-welcome{position:fixed;inset:0;z-index:260;display:flex;justify-content:center;align-items:flex-start;padding:calc(env(safe-area-inset-top,0px) + 22px) 16px 18px;pointer-events:none;font-family:Arial,sans-serif}
      #lc-founders-welcome .lc-welcome-panel{width:min(470px,100%);padding:clamp(20px,4vw,30px);border:1px solid rgba(218,190,130,.34);border-radius:20px;background:linear-gradient(145deg,rgba(22,20,25,.97),rgba(8,10,15,.97));box-shadow:0 24px 90px rgba(0,0,0,.5);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);color:#f6f1e7;pointer-events:auto}
      #lc-founders-welcome .lc-welcome-eyebrow{margin:0 0 12px;color:#d9bc7b;font-size:9px;font-weight:700;letter-spacing:2.8px}
      #lc-founders-welcome h1{margin:0 0 10px;font:500 clamp(27px,6vw,38px)/1.1 Georgia,serif;letter-spacing:-.6px}
      #lc-founders-welcome .lc-welcome-lead{margin:0;color:#c8c2b8;font-size:13px;line-height:1.7}
      #lc-founders-welcome .lc-welcome-rule{height:1px;margin:20px 0;background:linear-gradient(90deg,rgba(218,190,130,.45),rgba(218,190,130,0))}
      #lc-founders-welcome .lc-welcome-steps{display:grid;gap:12px;margin:0;padding:0;list-style:none}
      #lc-founders-welcome .lc-welcome-steps li{display:grid;grid-template-columns:28px 1fr;gap:10px;align-items:start}
      #lc-founders-welcome .lc-welcome-number{display:grid;place-items:center;width:26px;height:26px;border:1px solid rgba(218,190,130,.38);border-radius:50%;color:#e3c98f;font-size:10px}
      #lc-founders-welcome .lc-welcome-step-title{display:block;margin:1px 0 3px;color:#f1e8d7;font-size:11px;letter-spacing:.7px}
      #lc-founders-welcome .lc-welcome-step-copy{display:block;color:#aaa6a2;font-size:11px;line-height:1.55}
      #lc-founders-welcome .lc-welcome-actions{display:flex;align-items:center;gap:12px;margin-top:22px}
      #lc-founders-welcome button{min-height:44px;border-radius:9px;padding:12px 16px;font:700 9px Arial,sans-serif;letter-spacing:1.4px;cursor:pointer;touch-action:manipulation}
      #lc-founders-welcome .lc-welcome-enter{flex:1;border:0;background:linear-gradient(135deg,#ead7a8,#c6a35f);color:#17130c}
      #lc-founders-welcome .lc-welcome-dismiss{border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.04);color:#d5d0c7}
      #lc-founders-welcome .lc-welcome-foot{margin:14px 0 0;color:#827e80;font-size:9px;line-height:1.5}
      @media(max-width:480px){#lc-founders-welcome{padding-left:12px;padding-right:12px}#lc-founders-welcome .lc-welcome-actions{flex-direction:column-reverse;align-items:stretch}#lc-founders-welcome .lc-welcome-dismiss{width:100%}}
      @media(prefers-reduced-motion:no-preference){#lc-founders-welcome .lc-welcome-panel{animation:lc-welcome-enter .35s ease-out both}@keyframes lc-welcome-enter{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}}
    `;
    documentRef.head?.appendChild(style);

    const root = documentRef.createElement("section");
    root.id = "lc-founders-welcome";
    root.setAttribute("aria-label", "LAMBO CITY first visit guide");

    const panel = documentRef.createElement("div");
    panel.className = "lc-welcome-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "false");
    panel.setAttribute("aria-labelledby", "lc-founders-welcome-title");

    panel.append(
      makeText(documentRef, "p", "LAMBO CITY RECORDS  /  FOUNDERS' CLUB", "lc-welcome-eyebrow"),
      makeText(documentRef, "h1", "Welcome to LAMBO CITY.", ""),
      makeText(documentRef, "p", "Your first visit starts here. Take a moment to get oriented, then explore the city at your own pace.", "lc-welcome-lead")
    );
    panel.querySelector("h1").id = "lc-founders-welcome-title";

    const rule = documentRef.createElement("div");
    rule.className = "lc-welcome-rule";
    rule.setAttribute("aria-hidden", "true");
    panel.appendChild(rule);

    const steps = documentRef.createElement("ol");
    steps.className = "lc-welcome-steps";
    const guide = [
      ["Explore the city", "Discover the Convention Center, waterfront, and other approved public spaces."],
      ["Follow your invitations", "Some destinations and experiences are reserved for invited members."],
      ["Watch ALIVE grow", "New identity, Companion, and community experiences will arrive in carefully tested stages."]
    ];
    guide.forEach(([title, copy], index) => {
      const item = documentRef.createElement("li");
      item.append(
        makeText(documentRef, "span", String(index + 1).padStart(2, "0"), "lc-welcome-number")
      );
      const detail = documentRef.createElement("div");
      detail.append(
        makeText(documentRef, "strong", title, "lc-welcome-step-title"),
        makeText(documentRef, "span", copy, "lc-welcome-step-copy")
      );
      item.appendChild(detail);
      steps.appendChild(item);
    });
    panel.appendChild(steps);

    const actions = documentRef.createElement("div");
    actions.className = "lc-welcome-actions";
    const dismiss = makeText(documentRef, "button", "NOT NOW", "lc-welcome-dismiss");
    dismiss.type = "button";
    const enter = makeText(documentRef, "button", "START EXPLORING", "lc-welcome-enter");
    enter.type = "button";
    const close = () => {
      markFoundersWelcomeComplete(storage);
      root.remove();
      style.remove();
    };
    dismiss.addEventListener("click", close);
    enter.addEventListener("click", close);
    actions.append(dismiss, enter);
    panel.appendChild(actions);
    panel.appendChild(makeText(documentRef, "p", "This guide remembers your choice on this browser only. It does not create an account or change your access.", "lc-welcome-foot"));
    root.appendChild(panel);
    documentRef.body.appendChild(root);
    return root;
  }
};
