const engine = new Engine();

engine.registerSystems({
  scene: Scene,
  camera: Camera,
  renderer: Renderer,

  input: Input,
  player: Player,

  world: World,
  water: Water,
  dock: Dock,
  sky: Sky,
  lighting: Lighting,

  palms: Palms,
  villas: Villas,
  stage: Stage,
  yacht: Yacht,
  jetskis: Jetskis,

  hero: Hero,
  npc: NPC,

  hud: HUD,
  missions: Missions,
  reputation: Reputation,

  cinematicFlowSystem: CinematicFlowSystem,
  cinematicDockCore: CinematicDockCore
});

engine.init();
