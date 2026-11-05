import Floor2StudioApp from "./floor2StudioApp.js";
import StudioDAWApp from "./studioDAWApp.js";

// Initialize the shared production core without creating a Floor 2 scene.
// Floor2StudioApp only loads Three.js when a real 3D scene is supplied.
try {
  await Floor2StudioApp.init(null, {});
  StudioDAWApp.open("edit", { standalone: true });
} catch (error) {
  console.error("LAMBO CITY standalone Studio could not start:", error);
  const message = document.createElement("p");
  message.textContent = "LAMBO CITY Studio could not start. Please refresh and try again.";
  message.style.cssText = "margin:24px;color:#f4f1eb;font:16px Arial,sans-serif";
  document.body.appendChild(message);
}
