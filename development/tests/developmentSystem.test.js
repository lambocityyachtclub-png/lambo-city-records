test("Development System rejects submissions while disabled", async () => {
  const system = await createDevelopmentSystem();

  system.disable();

  assert.throws(
    () => system.submitStudioFinding({
      title: "Disabled test",
      description: "This should not be submitted.",
      area: "beat_lab"
    }),
    /development system is disabled/
  );
});
