# ALIVE Guest-First Account and Companion Sync

## Product behavior

- Visitors enter the 3D LAMBO CITY world directly. There is no new welcome page or mandatory account prompt.
- A visitor can create and save a Companion locally without registering.
- The Companion panel offers an optional **Connect Account / Sync Companion** action.
- The player account uses email one-time verification and a device passkey. Password login is disabled.
- After a verified session exists, the Companion identity is restored from the account or the local guest profile is claimed by that account.
- A saved identity can be restored on another supported device after the person signs in.

## Separation of concerns

- playerAccounts.js owns the optional account panel and loads only when requested.
- server/auth.js owns Better Auth, email OTP, passkeys, and the PostgreSQL pool.
- api/player/profile.js owns the username profile.
- api/alive/identity.js exposes the authenticated Companion identity sync endpoint.
- server/aliveIdentityApi.js contains the testable, owner-scoped identity API logic.
- alive/identity/identityContract.js remains the canonical identity and privacy contract.
- aliveWorldCompanion.js keeps guest-first local behavior and only attempts cloud sync when an authenticated account session exists.

## Ownership and privacy guarantees

- The API derives ownerId from the verified server-side Better Auth session. Client-supplied owner IDs are ignored.
- Identity reads are scoped to the authenticated owner.
- Writes are same-origin only and use an upsert guarded by the existing owner ID.
- An identity ID already owned by another account cannot be taken over.
- The identity contract keeps memory owner-only, private by default, and excluded from model training.
- The world remains a client presentation layer; it never receives database credentials or session secrets.
- No account or cloud sync is required to enter or explore LAMBO CITY.

## Isolated development resources

- Neon project: lambo-city-alive
- Neon branch: player-accounts-dev (isolated development branch)
- Vercel variables for alive/guest-first-companion-current-main are Preview-only. PLAYER_DATABASE_URL points to player-accounts-dev; ALIVE_DATABASE_URL points to alive-dev. BETTER_AUTH_SECRET and EMAIL_FROM configure the optional player account flow.
- ALIVE_OWNER_EMAIL, ALIVE_OWNER_AUTH_SECRET, ALIVE_OWNER_ENROLLMENT_SECRET, a newly generated one-time enrollment token, and its seven-day expiry are also scoped only to this Preview branch.
- The player-accounts-dev database currently has zero users, zero player profiles, and zero ALIVE identities. The alive-dev database currently has zero ALIVE owner accounts, zero tasks, and zero owner reviews.
- The legacy DATABASE_URL variable remains as a fallback only; new code explicitly routes player auth and ALIVE owner/control-plane work to their separate databases.
- The first ALIVE owner account has not been created. A Preview-only one-time invitation is configured to activate the owner passkey; the enrollment gate closes automatically after the first owner is created.
- ALIVE's task queue and owner-review storage are connected in local, owner-controlled planning mode. Paid AI, hosted sandbox execution, background automation, and autonomous production deployment remain disabled.
- No production database or production environment variables were changed.

## Verification

- Player Account and ALIVE Identity Checks: 24 passed, 0 failed.
- Development Engine Tests: 233 passed, 0 failed.
- The separate World System Checks workflow still reports the known legacy DockLife static-import assertion. The deployed startup architecture uses the staged dynamic import from PR #207; no change to that unrelated code was made.

## Activation blockers

- Player email OTP delivery requires RESEND_API_KEY. The Preview branch has a verified EMAIL_FROM sender configured, but no Resend API key is currently available. Player account signup and email-code recovery therefore cannot be fully exercised until the owner supplies a valid key or selects another email provider.
- ALIVE owner enrollment uses its private Preview-only one-time invitation and passkey, so initial owner activation does not depend on email delivery. Owner password-reset email recovery will remain unavailable until RESEND_API_KEY is configured.
- Vercel currently reports its free daily API deployment quota (100 deployments) exhausted, with a 24-hour retry window. A fresh preview for the latest commit could not be created during this development pass. Existing preview deployments are older than the current account/identity integration and must not be treated as verification of this latest code.

## Release boundary

Preview and development only. No merge to main, no production deployment, and no changes to HERO, stage performance, world layout, player movement, camera, or music.
