render() {
  const sceneModule = this.systems.scene;
  const cameraModule = this.systems.camera;
  const rendererModule = this.systems.renderer;

  if (!sceneModule || !cameraModule || !rendererModule) return;

  const scene = sceneModule.getScene?.();
  const camera = cameraModule.getCamera?.();
  const renderer = rendererModule.getRenderer?.();

  if (!scene || !camera || !renderer) return;

  renderer.render(scene, camera);
}
