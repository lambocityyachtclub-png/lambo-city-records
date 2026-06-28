import { engine } from "./engine.js";
import { renderer } from "./renderer.js";
import { initCameraSystem } from "./camera.js";

// Import other world components here
import "./scene.js";    // Sets up the scene and lighting
import "./world.js";    // Your world structure (e.g., dock, ocean, etc.)
import "./player.js";   // Player setup and controls
import "./input.js";    // Input handling (WASD, etc.)

// Initialize camera
initCameraSystem();

// Start the engine loop
engine.start();
