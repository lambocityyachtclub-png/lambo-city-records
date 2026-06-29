import Engine from "./engine.js";

import Scene from "./scene.js";
import Renderer from "./renderer.js";
import Camera from "./camera.js";

import Input from "./input.js";
import Player from "./player.js";

import World from "./world.js";
import Water from "./water.js";
import Dock from "./dock.js";
import Sky from "./sky.js";
import Lighting from "./lighting.js";

import Palms from "./palms.js";
import Villas from "./villas.js";
import Stage from "./stage.js";
import Yacht from "./yacht.js";
import Jetskis from "./jetskis.js";

import Hero from "./hero.js";
import NPC from "./npc.js";

import HUD from "./hud.js";
import Missions from "./missions.js";
import Reputation from "./reputation.js";

import CinematicFlowSystem from "./cinematicFlowSystem.js";
import CinematicDockCore from "./cinematicDockCore.js";

const engine = new Engine();

// 🔥 REGISTER ALL SYSTEMS
engine.systems.scene = Scene;
engine.systems.renderer = Renderer;
engine.systems.camera = Camera;

engine.systems.input = Input;
engine.systems.player = Player;

engine.systems.world = World;
engine.systems.water = Water;
engine.systems.dock = Dock;
engine.systems.sky = Sky;
engine.systems.lighting = Lighting;

engine.systems.palms = Palms;
engine.systems.villas = Villas;
engine.systems.stage = Stage;
engine.systems.yacht = Yacht;
engine.systems.jetskis = Jetskis;

engine.systems.hero = Hero;
engine.systems.npc = NPC;

engine.systems.hud = HUD;
engine.systems.missions = Missions;
engine.systems.reputation = Reputation;

engine.systems.cinematicFlowSystem = CinematicFlowSystem;
engine.systems.cinematicDockCore = CinematicDockCore;

// 🚀 START EVERYTHING
engine.init();
