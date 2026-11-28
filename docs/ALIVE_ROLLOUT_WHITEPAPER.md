# ALIVE — Rollout White Paper
Version 1.0 · Friends-first roadmap · 27 November 2026

## 1. Vision
ALIVE is a personal identity and Companion system that begins inside LAMBO CITY and is designed to travel beyond it. People should be able to create, develop, and keep a continuous record of who they are and what they make.

The launch promise is not a collection of disconnected features. It is one complete personal experience: a Companion, an identity, saved creations, and a usable export.

## 2. Relationship between the brands
- **LAMBO CITY** is the first destination and cultural home: entertainment, community, events, the waterfront world, and creative experiences.
- **ALIVE** is the personal layer: identity, Companion, preferences, memory controls, saved creations, and portability.
- **HERO** is the creative guide and host for the first record-making experiences.
A person can enjoy LAMBO CITY without surrendering ownership of their ALIVE identity. ALIVE should ultimately be portable to other compatible experiences.

## 3. Rollout philosophy
The rollout is invitation-led and milestone-based. Early access is about learning and making, not pretending unfinished capabilities are complete. The public should see the vision and progress while private account creation and personal data remain protected until the complete save-and-export promise is ready.

## 4. Release stages
### Stage 0 — The signal
**Audience:** public audience, no account required.
- Introduce the ALIVE vision, visual identity, and roadmap.
- Share curated development previews, HERO sessions, and selected creative reveals.
- Keep private creation tools and unfinished account flows closed.
- Collect interest only with a clear privacy notice and no false promise of permanent storage.

**Exit gate:** the story, visual identity, access policy, and preview experience are approved.

### Stage 1 — Founders' room
**Audience:** founder and invited friends.
- Invite-only access to a controlled preview.
- Explore the world and experience guided creative sessions with HERO.
- Test record-making workflows with a small group.
- Label prototypes honestly; do not represent temporary/local data as safely backed up.
- Collect structured feedback and report known limitations.

**Exit gate:** repeatable sessions, reliable recovery from errors, stable iPad/desktop behavior, and clear content ownership.

### Stage 2 — The complete ALIVE identity launch
**Audience:** invited early members, then public waitlist.
This is the coordinated launch bundle. Do not release these as disconnected promises:
- Create and verify an ALIVE identity with a low-friction sign-in path.
- Create and personalize a Companion.
- Save profile, Companion, and creations to the owner's account.
- Return on another device and restore the same identity and work.
- Export the owner's data in a documented, usable format.
- Provide deletion, recovery, privacy, and account-security controls.
- Explain exactly what is private, shared, or public.

**Exit gate:** end-to-end tests pass for new account, returning account, companion sync, record save, export, recovery, and deletion. No partial launch if one of these core promises is missing.

### Stage 3 — HERO's creative suite
**Audience:** invited ALIVE members.
- Guided record creation with HERO.
- Save drafts, versions, artwork, credits, and project metadata.
- Clear ownership and permissions for collaborations.
- Export projects and media in supported formats.
- Add studio depth only after the creation/save/export foundation is dependable.

**Exit gate:** a member can create, save, revisit, collaborate where permitted, and export without losing work.

### Stage 4 — Companion capabilities
**Audience:** phased member cohorts.
- More expressive 3D Companion appearance.
- Voice and conversation with explicit microphone consent.
- Owner-controlled memory and clear controls to inspect, edit, and delete.
- Reputation and progression that reward participation without hiding basic account portability.
- No autonomous public actions without explicit permission.

**Exit gate:** privacy, consent, moderation, safety, performance, and account recovery are verified.

### Stage 5 — LAMBO CITY integration
**Audience:** ALIVE members.
- Companion presence and approved social experiences in the city.
- Invitations, events, member spaces, and progression.
- Controlled access to VIP and creator areas.
- Optional cross-world identity portability after security and data portability reviews.

**Exit gate:** the city remains performant and established geography and locked experiences remain unchanged.

### Stage 6 — Open ecosystem
**Audience:** public, partners, and creators.
- Creator tools, curated marketplace, events, and partner integrations.
- Portable identity and documented APIs where appropriate.
- Transparent commercial terms, moderation, licensing, and creator rights.
- Expand only when infrastructure and support can handle the audience.

## 5. Ownership and trust
Members own their identity and their original creations, subject to clearly disclosed service and third-party rights. The product must provide understandable export and deletion routes. Private data stays private by default. Sharing is an explicit action, not an assumed default.

ALIVE's Living Contracts govern software changes; member-facing ownership terms govern personal creations. These are related but distinct systems.

## 6. Technical architecture
- Keep the LAMBO CITY browser runtime and ALIVE control plane separated.
- Use modular browser-native ES modules for the existing Three.js world.
- Keep identity, Companion, creation records, media references, and audit events behind authenticated APIs.
- Scope every private record to its owner and enforce authorization server-side.
- Version export schemas and provide integrity metadata.
- Use isolated Preview deployments and test data before production.
- Keep production credentials out of browser code.
- Use lazy loading, mobile-first performance budgets, and graceful fallback.
- Require explicit founder approval for production releases.

## 7. Launch metrics
- Invitation acceptance and first-session completion.
- Companion creation completion and save success.
- Returning-member restoration success across devices.
- Record creation, save, revisit, and export success.
- Support requests and recovery success.
- iPad frame rate, page performance, crash/error rates, and load time.
- Member trust signals: privacy comprehension, consent completion, and successful data export.

## 8. What we will not do
- We will not force people through complex setup before they can understand the experience.
- We will not claim a feature is live when it is only a mockup or Preview.
- We will not launch a Companion without a dependable way to save and export the member's work.
- We will not use a paid AI provider as a prerequisite for the core identity and creation experience.
- We will not move approved LAMBO CITY geography or alter locked experiences as part of visual polish.
- We will not silently deploy to production.

## 9. Current milestone
The current development focus is the private friends-first foundation: Companion identity, account continuity, secure saving, record ownership, and complete export. The public story can be introduced before the full system is released, but the complete identity promise launches as one coordinated experience.
