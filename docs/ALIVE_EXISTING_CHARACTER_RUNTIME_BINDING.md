# ALIVE Existing Character Runtime Binding

## Purpose

This milestone adds a reusable, read-only adapter between ALIVE's owner-scoped personal identity service and an existing character object supplied by a host world. It develops the Engine/runtime boundary and the Companion policy boundary together without tying ALIVE to Three.js, LAMBO CITY, or a single character style.

## Existing model preservation

The adapter never imports a model file, constructs geometry, clones a model, replaces a scene object, changes appearance, or inserts an object into a scene. The host must inject `resolveExistingModel(modelRef, context)`, which returns the already-existing character object for that exact reference.

For LAMBO CITY, the intended first binding is the identity reference `existing:hero-model` to the existing live HERO object supplied by the current NPC/runtime system. The existing `hero-model.js`, NPC registration, stage/performance sequence, camera, geography, and Records HQ access remain untouched. The adapter does not create a second HERO.

The same resolver contract accepts both `digital-human` and `stylized` identity forms. A different world can supply a different resolver without changing ALIVE's identity or Companion code.

## Authorization and personal ownership

- Every resolve request requires an authenticated actor ID and stable identity ID.
- The adapter delegates access decisions to the owner-scoped identity service; it does not accept a caller-supplied owner ID.
- Uninvited accounts are rejected before the model resolver is called.
- An invited viewer/editor can resolve the existing character only within the identity service's granted role.
- Delegated access never transfers the personal owner ID or grants owner-only controls.
- The adapter exposes owner-control flags for identity and permission management; it does not change world-specific access gates.

## Companion boundary

- The default Companion policy is `owner-directed`.
- A custom Companion policy can only be supplied by the personal identity owner.
- The policy must reference the same identity and pass the shared policy validator.
- Existing policy rules remain enforced: the Companion cannot change identity or permissions, cannot share private memories by itself, and external actions require owner approval.
- Autonomous mode is only a validated policy descriptor here. This adapter does not start background work or execute autonomous actions.

## Deliberate limitations

This is a tested runtime binding boundary, not a live integration. It does not add an HTTP route, authenticate a real browser session, store Companion memories, call an AI provider, animate a model, speak, or connect the HERO object to the live LAMBO CITY scene. The actual host adapter must be added only after the owner-authenticated session and persistent identity storage are integrated and verified.

No game runtime files, world layout, camera, navigation, Studio, audio/session behavior, Records HQ access, Vercel settings, credentials, database migrations, or production deployments are changed by this milestone.

## Validation

The focused tests cover:
- Existing HERO object identity is preserved by reference (no clone/rebuild).
- Digital-human and stylized model forms use the same host boundary.
- Private access fails before model resolution.
- Explicit viewer grants allow viewing without owner controls.
- Only the owner can select a non-default Companion policy.
- Companion identity binding and policy safety rules fail closed.
- Missing or unresolved model references are rejected.
