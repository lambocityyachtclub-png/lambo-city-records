import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

let billboards = [], time = 0;

const BRAND_ART = [
  {
    brand: "LAMBO CITY",
    title: "YACHT CLUB",
    subtitle: "THE WATERFRONT. THE LIFESTYLE.",
    accent: "#d9b66f",
    secondary: "#76c9d1",
    background: ["#061a22", "#102f39", "#03090e"],
    motif: "yacht"
  },
  {
    brand: "LAMBO CITY",
    title: "RECORDS",
    subtitle: "INDEPENDENT SOUND. ICONIC CULTURE.",
    accent: "#f2c66d",
    secondary: "#f5eee0",
    background: ["#24130e", "#49251b", "#09090b"],
    motif: "records"
  },
  {
    brand: "LAMBO CITY",
    title: "RADIO",
    subtitle: "THE SOUND OF THE CITY",
    accent: "#64d8dc",
    secondary: "#b3f2ee",
    background: ["#061c2a", "#102d49", "#070b18"],
    motif: "radio"
  },
  {
    brand: "HERO",
    title: "LIVE",
    subtitle: "MUSIC. MOMENTS. LEGACY.",
    accent: "#f3d16c",
    secondary: "#ffffff",
    background: ["#1c1011", "#4a1822", "#09090d"],
    motif: "hero"
  }
];

function drawBillboardArt(config) {
  const canvas = document.createElement("canvas");
  canvas.width = 2800;
  canvas.height = 1200;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const bg = ctx.createLinearGradient(0, 0, 2800, 1200);
  bg.addColorStop(0, config.background[0]);
  bg.addColorStop(0.55, config.background[1]);
  bg.addColorStop(1, config.background[2]);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 2800, 1200);

  // Restrained architectural geometry gives each board a distinct luxury identity.
  ctx.globalAlpha = 0.22;
  for (let i = 0; i < 9; i++) {
    ctx.strokeStyle = i % 2 ? config.secondary : config.accent;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(1500 + i * 125, 0);
    ctx.lineTo(2800, 250 + i * 115);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  const glow = ctx.createRadialGradient(2180, 580, 30, 2180, 580, 760);
  glow.addColorStop(0, config.accent + "55");
  glow.addColorStop(1, config.accent + "00");
  ctx.fillStyle = glow;
  ctx.fillRect(1250, 0, 1550, 1200);

  // Large abstract brand motif on the right; no borrowed logos or stock imagery.
  ctx.save();
  ctx.translate(2180, 590);
  ctx.strokeStyle = config.accent;
  ctx.fillStyle = config.accent;
  ctx.lineWidth = 16;
  if (config.motif === "yacht") {
    ctx.beginPath();
    ctx.moveTo(-500, 120); ctx.lineTo(460, 120); ctx.lineTo(290, 260);
    ctx.lineTo(-300, 260); ctx.closePath();
    ctx.globalAlpha = 0.78; ctx.fill(); ctx.globalAlpha = 1;
    ctx.beginPath(); ctx.moveTo(-110, 100); ctx.lineTo(-110, -250);
    ctx.lineTo(190, 80); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-85, -170); ctx.lineTo(145, 70); ctx.stroke();
    ctx.fillStyle = config.secondary;
    ctx.fillRect(-440, 310, 880, 10);
  } else if (config.motif === "records") {
    [390, 285, 180, 75].forEach((radius, i) => {
      ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.stroke();
    });
    ctx.beginPath(); ctx.arc(0, 0, 42, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 0.65; ctx.fillRect(-16, -410, 32, 820); ctx.globalAlpha = 1;
  } else if (config.motif === "radio") {
    ctx.beginPath(); ctx.arc(0, 0, 370, Math.PI * 1.12, Math.PI * 1.88); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, 260, Math.PI * 1.12, Math.PI * 1.88); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, 145, Math.PI * 1.12, Math.PI * 1.88); ctx.stroke();
    const heights = [140, 280, 440, 230, 360, 510, 300, 170];
    heights.forEach((h, i) => {
      ctx.globalAlpha = 0.55 + (i % 3) * 0.15;
      ctx.fillRect(-350 + i * 100, 300 - h / 2, 34, h);
    });
    ctx.globalAlpha = 1;
  } else {
    ctx.beginPath(); ctx.arc(0, 0, 360, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, 300, 0, Math.PI * 2); ctx.stroke();
    for (let i = 0; i < 8; i++) {
      const a = (Math.PI * 2 * i) / 8;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 335, Math.sin(a) * 335);
      ctx.lineTo(Math.cos(a) * 470, Math.sin(a) * 470);
      ctx.stroke();
    }
    ctx.font = "700 310px Arial, sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff"; ctx.fillText("H", 0, 8);
  }
  ctx.restore();

  // All copy remains inside the approved five-percent safe area.
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = config.accent;
  ctx.font = "700 82px Arial, sans-serif";
  ctx.fillText(config.brand, 150, 290);
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 210px Arial, sans-serif";
  ctx.shadowColor = config.accent;
  ctx.shadowBlur = 22;
  ctx.fillText(config.title, 142, 545, 1420);
  ctx.shadowBlur = 0;
  ctx.fillStyle = config.secondary;
  ctx.font = "600 52px Arial, sans-serif";
  ctx.fillText(config.subtitle, 155, 665, 1380);

  ctx.fillStyle = config.accent;
  ctx.fillRect(155, 735, 420, 12);
  ctx.fillStyle = "rgba(255,255,255,0.72)";
  ctx.font = "500 30px Arial, sans-serif";
  ctx.fillText("LAMBO CITY  /  OFFICIAL WORLD", 155, 815);

  // Subtle edge treatment makes the temporary creative feel intentional.
  ctx.strokeStyle = config.accent + "bb";
  ctx.lineWidth = 8;
  ctx.strokeRect(30, 30, 2740, 1140);

  return canvas;
}

export default {
  init(scene) {
    // Keep the four existing billboard positions, rotations and support structures.
    const placements = [
      { x: -70, z: -15, rotY: 0.5, accent: 0xd9b66f },
      { x: 70, z: -15, rotY: -0.5, accent: 0xf2c66d },
      { x: -75, z: -50, rotY: 0.3, accent: 0x64d8dc },
      { x: 75, z: -50, rotY: -0.3, accent: 0xf3d16c }
    ];

    placements.forEach((placement, index) => {
      const group = new THREE.Group();
      const back = new THREE.Mesh(
        new THREE.BoxGeometry(14, 6, 0.4),
        new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.82, metalness: 0.35 })
      );
      group.add(back);

      const borderMaterial = new THREE.MeshStandardMaterial({
        color: placement.accent,
        emissive: placement.accent,
        emissiveIntensity: 0.5,
        metalness: 0.72,
        roughness: 0.28
      });
      const border = new THREE.Mesh(new THREE.BoxGeometry(14.5, 6.5, 0.2), borderMaterial);
      border.position.z = -0.2;
      group.add(border);

      const artCanvas = drawBillboardArt(BRAND_ART[index]);
      if (artCanvas) {
        const texture = new THREE.CanvasTexture(artCanvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = 4;
        texture.generateMipmaps = true;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        const screenMaterial = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          map: texture,
          emissive: 0xffffff,
          emissiveMap: texture,
          emissiveIntensity: 0.28,
          roughness: 0.62,
          metalness: 0.08
        });
        const screen = new THREE.Mesh(new THREE.PlaneGeometry(13.55, 5.8), screenMaterial);
        screen.position.z = 0.215;
        screen.name = "lamboCityBillboardScreen_" + index;
        group.add(screen);
      }

      [-4.5, 4.5].forEach(x => {
        const pole = new THREE.Mesh(
          new THREE.CylinderGeometry(0.2, 0.2, 14, 6),
          new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.65, roughness: 0.48 })
        );
        pole.position.set(x, -10, 0);
        group.add(pole);
      });

      group.position.set(placement.x, 10, placement.z);
      group.rotation.y = placement.rotY;
      group.name = "lamboCityBrandedBillboard_" + index;
      scene.add(group);
      billboards.push({ material: borderMaterial, offset: index * 1.7 });
    });
  },
  update(delta) {
    time += delta;
    billboards.forEach(board => {
      board.material.emissiveIntensity = 0.6 + Math.sin(time * 1.5 + board.offset) * 0.35;
    });
  }
};
