// heroCareerCenter.js
// LAMBO CITY RECORDS — FLOOR 1 CAREER CENTER
// Uses the existing left-wall artwork/media installation as its
// physical landmark. It does not move architecture or change movement.
const INTERACTION_POINT = { x: 22.3, z: 21.0 };
const ACTIVATION_DISTANCE = 5.5;
const RELEASES = [
  { name: "LAMBO CITY VOL 1", artist: "HERO", apple: "https://music.apple.com/us/album/lambo-city-vol-1/1711893177", amazon: "https://music.amazon.com/albums/B0CL22NW71" }
];
let prompt = null;
let overlay = null;
let active = false;
let open = false;
let lastE = false;

const css = (node, rules) => Object.assign(node.style, rules);
const make = (tag, text, parent) => {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  if (parent) parent.appendChild(node);
  return node;
};

function build() {
  prompt = make("button", "CAREER CENTER  ·  OPEN HERO'S CAMPAIGN", document.body);
  prompt.type = "button";
  css(prompt, {
    position:"fixed", left:"50%", bottom:"112px", transform:"translateX(-50%)",
    zIndex:"270", display:"none", maxWidth:"calc(100vw - 28px)",
    padding:"14px 22px", border:"1px solid rgba(226,190,125,.85)",
    borderRadius:"999px", background:"rgba(8,10,15,.96)", color:"#f3d9a6",
    font:"700 11px Arial,sans-serif", letterSpacing:"1.4px",
    boxShadow:"0 8px 30px rgba(0,0,0,.45)", cursor:"pointer",
    touchAction:"manipulation"
  });
  prompt.addEventListener("click", openPanel);

  overlay = make("div", "", document.body);
  overlay.id = "lcr-hero-career-center";
  css(overlay, {
    position:"fixed", inset:"0", zIndex:"700", display:"none",
    alignItems:"center", justifyContent:"center", padding:"18px",
    boxSizing:"border-box", background:"rgba(3,5,9,.9)",
    backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)",
    color:"#f5f0e8", fontFamily:"Arial,sans-serif"
  });

  const panel = make("section", "", overlay);
  css(panel, {
    width:"min(880px,100%)", maxHeight:"88vh", overflowY:"auto",
    padding:"clamp(22px,4vw,40px)", boxSizing:"border-box",
    border:"1px solid rgba(211,174,111,.5)", borderRadius:"18px",
    background:"linear-gradient(145deg,#211d18,#080b11)",
    boxShadow:"0 24px 90px rgba(0,0,0,.65)"
  });

  const top = make("div", "", panel);
  css(top,{display:"flex",justifyContent:"space-between",alignItems:"center",gap:"14px"});
  const brand = make("div","LAMBO CITY RECORDS  /  ARTIST DEVELOPMENT",top);
  css(brand,{fontSize:"10px",fontWeight:"700",letterSpacing:"2px",color:"#d8b475"});
  const close = make("button","CLOSE  ×",top);
  close.type="button";
  css(close,{padding:"10px 15px",border:"1px solid #66553b",borderRadius:"999px",background:"#171717",color:"#fff",cursor:"pointer"});
  close.addEventListener("click",closePanel);

  const title = make("h1","HERO — CAREER CENTER",panel);
  css(title,{fontSize:"clamp(27px,5vw,42px)",lineHeight:"1.05",margin:"26px 0 8px",color:"#fff"});
  const sub = make("p","THE MUSIC. THE MOVEMENT. THE MILESTONES.",panel);
  css(sub,{fontSize:"11px",letterSpacing:"2px",color:"#d8b475",margin:"0 0 22px"});

  const release = make("article","",panel);
  css(release,{padding:"20px",border:"1px solid rgba(211,174,111,.28)",borderRadius:"13px",background:"rgba(255,255,255,.045)"});
  make("div","FEATURED RELEASE",release).style.cssText="color:#d8b475;font-size:10px;letter-spacing:2px;margin-bottom:9px";
  const album = make("h2","LAMBO CITY VOL 1",release);
  css(album,{margin:"0 0 7px",fontSize:"25px",color:"#fff"});
  make("p","HERO",release).style.cssText="margin:0 0 15px;color:#c7b7a0";
  const links = make("div","",release);
  css(links,{display:"flex",gap:"10px",flexWrap:"wrap"});
  [[ "APPLE MUSIC", RELEASES[0].apple ],[ "AMAZON MUSIC", RELEASES[0].amazon ]].forEach(([label,url])=>{
    const a=make("a",label,links); a.href=url; a.target="_blank"; a.rel="noopener noreferrer";
    css(a,{display:"inline-block",padding:"11px 15px",border:"1px solid #a88750",borderRadius:"999px",color:"#f3d9a6",textDecoration:"none",fontSize:"10px",fontWeight:"700",letterSpacing:"1px"});
  });

  const grid = make("div","",panel);
  css(grid,{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,220px),1fr))",gap:"12px",marginTop:"14px"});
  const cards = [
    ["CAREER MILESTONES","Releases, audience growth, press and live performances."],
    ["VERIFIED ACHIEVEMENTS","Milestones appear here only after evidence is reviewed."],
    ["GET INVOLVED","Future listening, street-team and creative opportunities."]
  ];
  cards.forEach(([heading,body])=>{
    const card=make("article","",grid);
    css(card,{padding:"17px",border:"1px solid rgba(211,174,111,.2)",borderRadius:"12px",background:"rgba(255,255,255,.035)"});
    make("h3",heading,card).style.cssText="font-size:11px;letter-spacing:1.3px;color:#d8b475;margin:0 0 9px";
    make("p",body,card).style.cssText="font-size:13px;line-height:1.55;color:rgba(245,240,232,.76);margin:0";
  });

  const note=make("p","Milestone figures and royalty amounts are not populated with invented data. Game rewards are separate from real-world royalties. This first in-game panel is a front-end prototype; verified records, player submissions and shared review require the next secure backend stage.",panel);
  css(note,{fontSize:"11px",lineHeight:"1.6",color:"rgba(245,240,232,.48)",margin:"20px 0 0"});
  overlay.addEventListener("click",event=>{if(event.target===overlay) closePanel();});
  window.addEventListener("keydown",event=>{if(event.key==="Escape"&&open) closePanel();});
}

function openPanel() {
  if (!active || !overlay) return;
  open=true; overlay.style.display="flex"; prompt.style.display="none";
  window.__lamboCityHeroCareerOpen=true;
}
function closePanel() {
  open=false; if(overlay) overlay.style.display="none";
  window.__lamboCityHeroCareerOpen=false;
}

export default {
  init() { if(!prompt) build(); return null; },
  update(delta, context) {
    const player=context && context.player;
    if(!player || !player.position || !prompt) return;
    const dx=player.position.x-INTERACTION_POINT.x;
    const dz=player.position.z-INTERACTION_POINT.z;
    active=Math.hypot(dx,dz)<=ACTIVATION_DISTANCE;
    if(!open) prompt.style.display=active?"block":"none";
    const input=window.__lamboCityInput;
    const pressed=!!(input && input.keys && input.keys.e);
    if(pressed && !lastE && active && !open) openPanel();
    lastE=pressed;
    window.__lamboCityHeroCareerInRange=active;
  }
};
