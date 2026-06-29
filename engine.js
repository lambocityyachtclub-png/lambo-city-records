init() {
  scene.init();
  renderer.init(scene);
  camera.init();
  
  input.init();

  world.init();
  player.init();

  hud.init();
  missions.init();
  reputation.init();

  cinematicFlowSystem.init();
}

update() {
  input.update();

  player.update();
  world.update();

  npc.update();
  hero.update();

  cinematicFlowSystem.update();

  renderer.render(scene, camera);
}
