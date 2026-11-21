# ALIVE Public Companion Studio — Product and Integration Blueprint

Status: approved product direction; implementation blueprint only.
Branch: `alive/public-companion-studio-blueprint-2026-11-20`
Base: `alive/existing-hero-runtime-host-binding-2026-11-20`

## Product decision

ALIVE is an independent Companion platform with its own identity, account system, portable Companion records, and future standalone app. LAMBO CITY is its first discovery environment and first immersive world integration, not its permanent boundary.

The public-facing ALIVE Studio and the private ALIVE Owner Console are separate products and routes:

- Private owner control remains at `/alive/`, noindex, owner-authenticated.
- Public Companion creation is a separate route, proposed as `/alive/studio/` (or a dedicated standalone ALIVE domain later).
- Public account registration must use a public-user/player identity provider and must never reuse the single-owner authentication gate.
- Both experiences use the same platform-level identity and Companion contracts, but public users can access only their own records.

## LAMBO CITY storefront placement

The current waterfront has three existing storefronts. The candidate for ALIVE is the existing west-side `producer-store` at world X=-44, currently labeled STORE / SOUND KITS • PRESETS, with a yellow/gold accent. It is a suitable candidate because it is already a retail storefront and is distinct from Club Vista and the music-release store.

Placement is a proposal, not permission to move or rebuild the store. Preserve its building, coordinates, sidewalk, street, marina, collision, camera, walking paths, and navigation. Rebrand and detail the existing storefront additively as ALIVE STUDIO only after visual acceptance. Do not create a fourth storefront or alter the other two stores.

Relevant existing modules:
- `marina.js` owns the existing three storefront buildings.
- `waterfrontStorefrontDetails.js` adds their architectural detailing.
- `main.js` registers the world modules.
- Store entry interaction and collision must be inspected before adding a doorway trigger; the detailing module is visual-only.

## Public visitor journey

1. **Discover ALIVE** — enter the existing ALIVE Studio storefront in the LAMBO CITY boardwalk, or visit ALIVE directly on its future standalone website/app.
2. **Create an account** — choose a username and register through the public account flow. Verify email before creating a persistent Companion. Offer passkey enrollment after verification where supported.
3. **Create a Companion** — choose digital-human or stylized form; customize supported appearance traits; preview changes in real time; name the Companion.
4. **Set its character** — choose a small, understandable set of personality traits, communication style, and voice options where available. Clearly label unavailable capabilities rather than implying they work.
5. **Review privacy and permissions** — identity and memories are private by default. Explain what is stored, what may be shared, and what device permissions are optional. Do not make public discoverability or cross-world sharing the default.
6. **Save and meet** — persist the Companion to the authenticated account and present a welcome interaction. The owner can return to the same Companion on supported devices.
7. **Grow gradually** — add deeper memory, voice, desktop presence, cross-device continuity, shared-world presence, and richer autonomy only as each capability is implemented, tested, and explicitly enabled.

## Identity and ownership boundaries

- Account login authenticates a person; the ALIVE identity is a portable personal record owned by that authenticated account subject.
- Never accept `ownerId` from browser input. Derive it from the verified session.
- Do not bind public users to the founder's owner identity or the existing HERO model.
- The founder's existing HERO binding remains a separate owner-only integration and must preserve the existing HERO model and performance behavior.
- A LAMBO CITY world integration receives only the access needed to render/interact with a Companion; the world does not own the identity.
- Public Companion records, avatar appearance, and memory are private by default. Cross-user or Companion-to-Companion interactions require explicit permissions.
- Memory sharing with ALIVE development, model training, public display, and cross-world access must be separate explicit choices; default all to off.
- Provide account recovery and identity export/deletion planning before broad public launch.

## Shared platform architecture

Keep the existing platform-neutral identity and Companion domain contracts. Add public-account authentication as a distinct adapter that resolves a verified public account subject. Reuse the identity/Companion domain services and PostgreSQL repositories only after confirming the migration and ownership schema support public account subjects.

Do not point public requests at `/api/alive/personal/*` while those routes authenticate the single ALIVE owner. Add separate public endpoints (for example `/api/alive/public/*`) that:
- authenticate a verified public account session;
- derive the owner subject server-side;
- create/read/update only the caller's own identity;
- validate all appearance/personality fields against explicit schemas and size limits;
- never expose raw database access or owner-only controls;
- enforce same-origin protections on writes, rate limits, and safe error messages.

Use one shared identity/Companion data contract across LAMBO CITY and the future standalone ALIVE app. Keep presentation clients and world adapters separate from the persistence and policy layers.

## Account-provider integration gate

The current `playerAccounts.js` client demonstrates email OTP and passkey enrollment, but the selected integration branch must be checked for its matching server routes, database migrations, email provider, and recovery behavior before it is reused. Do not assume a frontend client alone means public registration works.

The current owner email diagnostic reports `provider_credentials_rejected` for the configured Resend credential. This blocks owner verification email, but it is not a reason to reuse owner authentication for public users. Resolve the email-provider configuration separately and verify a test send before enabling owner enrollment.

## First release scope

Required:
- public ALIVE Studio landing and guided onboarding;
- verified public account and username;
- one persistent Companion per account initially (schema should allow future multiple Companions);
- digital-human/stylized selection;
- appearance editor with real-time preview and a clearly defined initial set of traits;
- Companion name and a few owner-selected personality traits;
- privacy/permissions explanation and defaults;
- save, reload, sign out, and sign back in without losing the Companion;
- responsive iPad, desktop, and mobile browser layouts;
- a LAMBO CITY entry point into the same public Studio experience.

Not required to block the first release:
- standalone native desktop/mobile apps;
- unrestricted autonomous behavior;
- always-on microphone or background listening;
- Companion-to-Companion social features;
- advanced voice cloning;
- all possible avatar morphs/clothing/animation;
- every future ALIVE environment.

Do not activate paid AI usage, background autonomy, microphone access, or external actions without a clear owner decision and user-facing consent.

## Build sequence

1. **Foundation verification:** identify the actual public account server/auth provider and schema; verify email OTP, passkey, recovery, and session ownership on Preview.
2. **Public Studio shell:** implement the public route, responsive visual shell, onboarding steps, and local-only avatar preview. Do not write public identity records until auth is verified.
3. **Public identity API:** bind verified public sessions to the shared identity/Companion service; add schema validation and tests proving cross-account isolation.
4. **Persistence and continuity:** save/reload appearance, name, and personality; test account A cannot read or modify account B.
5. **LAMBO CITY integration:** rebrand the existing candidate storefront and add a controlled entry trigger without changing world geography or movement.
6. **Acceptance:** test on iPad Safari and desktop, then test registration, verification, Companion creation, save/reload, privacy boundaries, and return visits.
7. **Gradual rollout:** enable additional capabilities only after each stage passes acceptance. Keep the Owner Console private.

## Acceptance criteria

- Public visitors never see the Owner Console.
- Public account creation does not create or modify the founder owner account.
- Each Companion has exactly one authenticated personal owner unless an explicit delegated grant is later created.
- Account A cannot access account B's identity, appearance, preferences, or memories.
- A Companion created in the public Studio is the same persistent record used by supported LAMBO CITY and future ALIVE clients.
- Existing HERO is neither cloned nor replaced by public avatar creation.
- The selected storefront's position, world layout, collision, controls, and nearby businesses remain unchanged.
- All public writes require a verified session and same-origin validation.
- No paid AI, ambient listening, autonomous action, or public memory sharing is enabled by default.
- Production is unchanged until explicit owner approval.

## Current verified state and blockers

- The latest isolated ALIVE Preview is READY and the private `/alive/` Owner Console returns HTTP 200.
- `/api/alive/auth/get-session` returns `null` when no owner is signed in.
- `/api/alive/auth-readiness` returns `provider_credentials_rejected`; owner email verification is not ready.
- Existing identity/Companion services and private owner routes are present in the ALIVE integration branch.
- The public Studio route and public account-scoped identity API are not yet implemented in this integration branch.
- The account client file `playerAccounts.js` exists, but its corresponding public server-side auth/profile implementation must be verified before reuse.
- The Companion identity migration is documented for manual review/application; do not apply migrations automatically.
- No production deployment, PR merge, or production data change is included in this blueprint.
