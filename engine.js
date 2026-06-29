export default class Engine {
  constructor() {
    this.systems = {};
    this.lastTime = 0;
  }

  init() {
    // CORE
    this.systems.scene?.init?.();
    this.systems.camera?.init?.();
    this.systems.renderer?.init?.();

    // WORLD LAYERS (AUTO WIRED HERE — NO MORE MANUAL STEPS)
    this.systems.world?.init?.(this.systems.scene?.getScene?.());
    this.systems.water?.init?.(this.systems.scene?.getScene?.());
    this.systems.dock?.init?.(this.systems.scene?.getScene?.());
    this.systems.sky?.init?.(this.systems.scene?.getScene?.());
    this.systems.lighting?.init?.(this.systems.scene?.getScene?.());

    this.systems.palms?.init?.(this.systems.scene?.getScene?.());
    this.systems.villas?.init?.(this.systems.scene?.getScene?.());
    this.systems.stage?.init?.(this.systems.scene?.getScene?.());
    this.systems.yacht?.init?.(this.systems.scene?.getScene?.());
    this.systems.jetskis?.init?.(this.systems.scene?.getScene?.());

    // PLAYER + INPUT
    this.systems.input?.init?.();
    this.systems.player?.init?.(
      this.systems.scene?.getScene?.(),
      this.systems.input
    );

    // GAME SYSTEMS
    this.systems.npc?.init?.();
    this.systems.hero?.init?.();

    this.systems.hud?.init?.();
    this.systems.missions?.init?.();
    this.systems.reputation?.init?.();

    // CINEMATIC LAYER
    this.systems.cinematicFlowSystem?.init?.();
    this.systems.cinematicDockCore?.init?.();

    this.loop();
  }

  loop = (time = 0) => {
    const delta = (time - this.lastTime) / 1000;
    this.lastTime = time;

    this.update(delta);
    this.render();

    requestAnimationFrame(this.loop);
  };

  update(delta) {
    this.systems.input?.update?.(delta);
    this.systems.player?.update?.(delta);
    this.systems.world?.update?.(delta);

    this.systems.npc?.update?.(delta);
    this.systems.hero?.update?.(delta);

    this.systems.cinematicFlowSystem?.update?.(delta);
    this.systems.cinematicDockCore?.update?.(delta);

    this.systems.hud?.update?.(delta);
  }

  render() {
    const scene = this.systems.scene?.getScene?.();
    const camera = this.systems.camera?.getCamera?.();
    const renderer = this.systems.renderer?.getRenderer?.();

    if (!scene || !camera || !renderer) return;

    renderer.render(scene, camera);
  }
}
