class Engine {
  constructor() {
    this.systems = {};
    this.lastTime = 0;
    this.running = false;
  }

  init() {
    // 1. CORE RENDERING PIPELINE
    this.systems.scene.init();
    this.systems.renderer.init(this.systems.scene.getScene());
    this.systems.camera.init();

    // 2. INPUT + PLAYER
    this.systems.input.init();
    this.systems.player.init(
      this.systems.scene.getScene(),
      this.systems.input
    );

    // 3. WORLD BUILD
    this.systems.world.init(this.systems.scene.getScene());

    // 4. ENVIRONMENT LAYERS
    this.systems.water.init();
    this.systems.dock.init();
    this.systems.sky.init();
    this.systems.lighting.init();

    this.systems.palms.init();
    this.systems.villas.init();
    this.systems.stage.init();
    this.systems.yacht.init();
    this.systems.jetskis.init();

    // 5. GAME SYSTEMS
    this.systems.npc.init();
    this.systems.hero.init();

    this.systems.hud.init();
    this.systems.missions.init();
    this.systems.reputation.init();

    // 6. CINEMATIC LAYER (HIGHEST PRIORITY OVERRIDE)
    this.systems.cinematicFlowSystem.init();
    this.systems.cinematicDockCore.init();

    this.start();
  }

  start() {
    this.running = true;
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  loop = (time) => {
    if (!this.running) return;

    const delta = (time - this.lastTime) / 1000;
    this.lastTime = time;

    this.update(delta);
    this.render();

    requestAnimationFrame(this.loop);
  };

  update(delta) {
    // INPUT FIRST
    this.systems.input.update(delta);

    // PLAYER + WORLD SIM
    this.systems.player.update(delta);
    this.systems.world.update(delta);

    this.systems.npc.update(delta);
    this.systems.hero.update(delta);

    // CINEMATIC OVERRIDES LAST (controls feel)
    this.systems.cinematicFlowSystem.update(delta);
    this.systems.cinematicDockCore.update(delta);

    // HUD LAST (reads final state)
    this.systems.hud.update(delta);
  }

  render() {
    this.systems.renderer.render(
      this.systems.scene.getScene(),
      this.systems.camera.getCamera()
    );
  }
}

export default Engine;
