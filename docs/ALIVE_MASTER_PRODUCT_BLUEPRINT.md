# ALIVE — Master Product & Platform Blueprint
Version: 1.0
Status: Founder-approved direction; implementation roadmap
Date: 2026-11-19

## 1. Product definition

ALIVE is an independently capable, reusable digital-identity and intelligent-companion platform. It creates and maintains a person's persistent digital identity and personal digital counterpart: their chosen representation, appearance, personality, owner-approved memories, preferences, permissions, and an ongoing relationship with their companion. The companion is intended to remain accessible across the owner's supported devices and connected services, so conversations, approved context, and authorized work can continue beyond any single app or game.

LAMBO CITY is ALIVE's first environment and first major showcase. It is not ALIVE's owner, technical boundary, or only destination.

**Product rule:** ALIVE owns the identity and companion capabilities. Each connected world or application supplies an environment in which that identity can appear and participate under permissions granted by its owner.

ALIVE must be designed so it can eventually serve other games, applications, devices, and experiences without rebuilding a person's identity for each destination.

## 2. Product architecture and ownership boundaries

### ALIVE Engine
The reusable platform foundation. It owns:
- Stable identity records and versioned identity contracts.
- Character-form and appearance-profile references.
- Owner identity, delegated access, permissions, and policy enforcement.
- Owner-approved preferences and memory policies.
- Portability and integration contracts for connected environments.
- Validation, audit boundaries, and compatibility rules.

The Engine is platform-neutral. It must not depend on LAMBO CITY scene code, Three.js, or a particular world's runtime.

### ALIVE Companion
The intelligence and interaction layer attached to an ALIVE identity. It is the owner's persistent digital counterpart—not merely an in-game avatar or a chatbot limited to isolated sessions. It should be reachable through supported access surfaces such as the ALIVE app or website, devices, and authorized integrations. It:
- Communicates naturally with the owner across supported access surfaces and, when authorized, with other people.
- Maintains continuity across conversations and sessions, using owner-approved personality, preferences, and memory.
- Can receive goals or tasks, make bounded progress between conversations when explicitly authorized, and report what it did, what remains, and where owner input is needed.
- Can help organize projects, research information, prepare materials, and coordinate supported workflows through approved tools.
- Operates only through explicitly granted capabilities.
- Supports owner-directed, assisted, and opt-in autonomous modes.
- Requests owner approval for external actions and never silently elevates its permissions.

The Companion is not the owner and cannot transfer identity ownership, rewrite permissions, or disclose private memories on its own.

### Environment integrations
LAMBO CITY and future environments are adapters/clients of ALIVE. They may request only the identity data and capabilities needed for a specific experience. They do not become owners of the person's identity or private memory.

### Ownership
- Each personal identity has one authenticated personal owner.
- An account login authenticates a person; the ALIVE identity is a separate, persistent asset belonging to that person.
- Owner access is retained. Collaborators receive only explicit editor/viewer or capability-specific grants; ownership is not delegated.
- Identity, discoverability, memory, and character data are private by default.
- No use of private identity or memory data for model training by default.
- The owner controls permissions, approved memory, sharing, and any autonomous behavior.
- Wellbeing must be supportive and reversible: no punitive decay or irreversible loss for missed activity.

## 3. First-time ALIVE onboarding

The first experience should feel simple, premium, understandable, and trustworthy. The user should know what is being created and who controls it.

### Step 1 — Create and secure an account
1. The visitor enters ALIVE's onboarding.
2. They choose a unique username and provide their chosen name/display name.
3. They complete the configured authentication and security/recovery steps.
4. Authentication establishes the account session; it does not itself create or transfer ownership of an ALIVE identity.

Do not invent or hard-code a new authentication method in the product flow. Use the approved account and recovery architecture when the onboarding UI is implemented.

### Step 2 — Explain the identity
Before collecting appearance references, explain in plain language:
- ALIVE will create a digital character based on the references the person chooses to provide.
- The person owns and controls that identity.
- Appearance references are used for the requested character-creation process.
- The identity is private by default and is not automatically visible in LAMBO CITY or elsewhere.
- The person can review the result before approving it.

Collect only the consent and data needed for the selected creation path.

### Step 3 — Capture appearance references
Offer a guided capture/upload flow for separate views, not one ambiguous image:
- Front-facing head/shoulders portrait.
- Left and right profile or three-quarter face views.
- Full-body front view.
- Optional full-body side/back views where useful.

The interface should explain lighting, framing, neutral pose, and image quality. It should support a small set of separate reference images (the existing profile direction allows up to three reference photos initially) and clearly show which views are missing. The exact capture set can be adapted to the chosen character form and generation provider.

The user may choose a realistic digital-human representation or a stylized character. Do not require a realistic likeness when the person prefers a stylized form.

### Step 4 — Generate a character candidate
Use the approved references to produce a consistent character candidate with multiple review angles. Preserve recognizable appearance across views; do not treat each angle as a different character.

The generated result is a proposal, not an automatically published identity. Keep the original references and generated assets in owner-controlled, access-restricted storage with explicit retention/deletion rules. Never expose them to other users or environments by default.

### Step 5 — Review, refine, and approve
The owner can inspect the character from multiple angles, request corrections, choose realistic or stylized presentation, and adjust supported appearance details. The person explicitly approves the final character before it becomes their active ALIVE character.

If generation is unsuccessful, explain what needs improvement and allow the owner to retry or use an existing model reference. Never silently substitute another person's model or an unrelated character.

### Step 6 — Establish the persistent identity
After approval, create a stable ALIVE identity linked to the authenticated owner. The identity contains references and structured profile data, not a dependency on a particular game engine.

The owner can review:
- Display name and username association.
- Character form and approved appearance.
- Personality and preferences they have chosen to provide.
- Privacy/discoverability settings.
- Memory and retention controls.
- Connected environments and the permissions granted to each.
- Companion behavior mode and approved capabilities.

### Step 7 — Enter an environment
LAMBO CITY is the first supported destination. The owner chooses to connect their ALIVE identity to LAMBO CITY and grants the specific permissions required for that environment.

The connection should make the identity present in the world without moving ownership to LAMBO CITY. Other environments can be added later through separate adapters.

## 4. Persistent identity lifecycle

An ALIVE identity is more than a one-time avatar export. Over time, and only within owner-approved controls, it can retain:
- A stable identity and character reference.
- Owner-selected personality traits and preferences.
- Approved memories and useful context.
- Relationships and interaction history where permitted.
- Environment connections, permissions, and capability grants.
- Versioned appearance and profile changes.

Memory is private and owner-controlled by default. The owner must be able to inspect, correct, export, restrict, and delete supported stored information. A companion may suggest a memory; it must not silently turn sensitive or unapproved conversation into permanent shared knowledge.

Identity continuity must survive leaving one world or connecting to another. A world-specific character instance is a presentation of the ALIVE identity, not a replacement for it. The companion relationship must also persist across supported devices and access surfaces: the owner should be able to resume a conversation, review approved memories, assign authorized work, and receive progress without starting over in each application. Device availability depends on supported integrations; the blueprint does not imply that every device or service is already connected.

## 5. Companion behavior and permissions

Supported behavior modes:
- **Owner-directed (default):** responds to the owner's direct instructions.
- **Assisted:** provides approved assistance within granted capabilities.
- **Autonomous:** may perform only bounded, separately authorized actions. Acting while the owner is away is an explicit opt-in.

In every mode:
- The companion cannot change identity ownership or permissions.
- The companion cannot independently share private memories.
- External actions require owner approval.
- The owner can review and revoke permissions.
- Autonomous capabilities must be scoped, visible, and revocable.
- Work performed between owner interactions must stay within explicit task, tool, time, and data boundaries; meaningful actions and outcomes must be reviewable.
- The companion must distinguish completed actions from suggestions, drafts, and actions awaiting approval.
- Wellbeing is supportive and reversible, never punitive.

## 6. LAMBO CITY as the first integration

LAMBO CITY demonstrates ALIVE in a shared 3D world. It is responsible for world presentation and gameplay: rendering character instances, multiplayer presence, world interactions, reputation, events, businesses, and location-specific permissions.

ALIVE remains responsible for the identity and companion policy behind those presentations.

### HERO — first founder identity
The existing playable HERO character is the first ALIVE identity integration. Connect the existing HERO model and approved behavior as references; do not recreate, redesign, or replace HERO. Preserve the existing performance sequence, Records HQ owner access, and approved LAMBO CITY geography, navigation, Studio, audio, and gameplay systems.

HERO's in-world visibility, performances, invitations, and interactions continue to follow the existing reputation, invitation, and permission rules. Registration or connection to ALIVE must not bypass those rules or grant other players owner privileges.

The integration is not considered live merely because a model reference or domain contract exists. It requires verified authenticated owner binding, runtime registration, and multiplayer authorization.

## 7. Security, privacy, and trust requirements

- Enforce ownership and permissions on the server, not only in the interface.
- Separate account authentication from identity ownership and environment authorization.
- Keep private-by-default access and memory controls fail-closed.
- Use encrypted transport and appropriate encryption at rest for private identity assets and memory.
- Keep secrets and provider credentials out of client code and repository files.
- Log security-relevant access and permission changes without exposing private memory content.
- Require explicit owner action for sharing, public discoverability, cross-environment access, and autonomous external actions.
- Provide safe recovery and owner verification before sensitive identity changes.
- Never weaken existing deployment protection or production access controls to accelerate development.

## 8. Implementation roadmap

Build in small, testable, modular stages. Engine and Companion advance side-by-side, while LAMBO CITY integration remains an adapter track.

1. **Domain foundation:** identity contract, ownership, character forms, privacy defaults, companion modes, and policy tests. Existing foundation is represented by the merged ALIVE personal identity contract.
2. **Owner-scoped service:** authenticated actor binding, owner/grantee reads, owner-only updates, and explicit delegation. Keep account/session verification as a distinct trusted boundary.
3. **Durable identity storage:** reviewed PostgreSQL adapter and migrations in an isolated development environment; verify atomic updates, access boundaries, and recovery before production use.
4. **Owner account and identity experience:** secure onboarding, username/display name, consent, identity dashboard, privacy and permission controls.
5. **Appearance pipeline:** guided multi-angle reference capture, secure asset handling, generation-provider abstraction, candidate review, correction, approval, and stable model references.
6. **Memory and Companion foundation:** owner-approved profile, the separate memory lifecycle contract (proposed → owner-approved → archived), persistent conversation continuity, policy-controlled capabilities, auditability, and explicit behavior modes. Memory persistence and model access remain blocked until server-side owner authorization and storage safeguards are implemented and tested.
7. **Cross-device companion access:** establish the first owner-facing access surface and a secure continuity layer for resuming conversations and reviewing authorized task progress. Add further devices and service integrations through explicit adapters and permission grants.
8. **HERO connection:** bind the existing HERO model to the verified founder identity; preserve existing runtime behavior and Records HQ access.
9. **LAMBO CITY live integration:** server-authoritative identity resolution, multiplayer visibility, and permission-aware interactions.
10. **Portability and expansion:** add a second environment adapter to prove ALIVE identity continuity outside LAMBO CITY before broad platform claims.
11. **Independent ALIVE product:** refine its own owner-facing experience, companion access surfaces, integrations, and business model without making LAMBO CITY a technical dependency.

Every stage needs focused automated tests, scope checks, and preview verification. A passing unit test or preview does not by itself mean a production feature is live.

## 9. Preservation rules

- ALIVE remains independent and reusable; LAMBO CITY is its first environment.
- Preserve existing approved LAMBO CITY systems, layouts, geography, camera, controls, Studio, stage/Jumbotron, audio/session behavior, and HERO performance.
- Connect existing assets where possible; do not rebuild approved assets to fit a new abstraction.
- Keep additions modular and dependency-aware.
- No autonomous live changes: owner direction and explicit approvals remain the control point.
- Do not merge or deploy a proposal solely because its blueprint is approved. Code changes must be separately scoped, tested, reviewed, and authorized under the existing release process.

## 10. Definition of success

ALIVE succeeds when a person can create and own a persistent digital identity, approve a recognizable character, control its private information and permissions, and maintain an ongoing relationship with an intelligent companion across supported devices and services. The companion can retain approved context, continue authorized work within clear boundaries, and present the same identity in LAMBO CITY and other supported environments without starting over.

LAMBO CITY is the first proof of the platform—not the limit of what ALIVE can become.

## 11. Relationship to existing specifications

This master product blueprint sits above and does not replace:
- `docs/ALIVE_PERSONAL_IDENTITY_CONTRACT.md` — domain-level identity and companion policy contract.
- `docs/ALIVE_MEMORY_CONTRACT.md` — owner-controlled memory lifecycle, explicit approval, privacy, and archive rules.
- `docs/ALIVE_OWNER_SCOPED_IDENTITY_SERVICE.md` — owner-scoped service boundary, when present.
- `docs/LAMBO_CITY_ALIVE_BLUEPRINT_DISCOVERY.md` — read-only discovery process for LAMBO CITY's wider department blueprints.
- Existing LAMBO CITY North Star, Master Blueprint, Studio blueprint, and other owner-authored specifications.

If an existing approved source conflicts with this document, preserve the source and flag the conflict for founder review rather than silently overwriting it.
