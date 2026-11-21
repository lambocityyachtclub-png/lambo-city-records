# ALIVE Public Companion Studio — Implementation Notes

Status: implementation branch; not merged or production-enabled.
Branch: `alive/public-companion-studio-implementation-2026-11-21`
Base: `integration/player-accounts-clean-2026-11-17`

## Included in this branch

- Public Studio route: `/alive/studio/`.
- Public API route: `/api/alive/public/companion`.
- The public route uses the LAMBO CITY player Better Auth session, never the private ALIVE Owner Console session.
- Email verification is required before Companion records can be created or changed.
- The account subject is derived from the verified server session. Browser-supplied owner IDs are ignored.
- One stable Companion identity is derived per account for the first release; the schema does not prevent future multiple-Companion support.
- Identity persistence reuses the platform-neutral ALIVE personal identity contract and owner-scoped identity service.
- Appearance and personality input are allowlisted and size-limited. Public responses omit internal owner IDs, grants, and model references.
- Writes require a same-origin request. Public API reads and writes are limited to 60 requests per account per minute.
- Privacy defaults remain private, owner-controlled, no-training, and no cross-world sharing.
- The Studio explicitly labels its current character preview as a simple 2D guide. Advanced 3D, voice, live conversation, memory growth, and autonomy are not represented as available.

## Database setup

Migration: `migrations/002_alive_public_companions.sql`.

Target: the isolated `player-accounts-dev` Neon branch, database `neondb`.

The migration creates `alive_personal_identities` linked to the Better Auth `user` table and `alive_public_api_rate_limits`. It is not executed by application code. It must be reviewed and applied manually to the development branch before the API can persist or load Companion identities.

Do not apply this migration to production or the private ALIVE Owner Console database.

## Preview configuration and migration validation

- Preview-only `DATABASE_URL`, branch-specific `BETTER_AUTH_SECRET`, and `EMAIL_FROM` are configured for the player-account and public Studio branches. These values are not set for production.
- The safe Preview readiness endpoint confirmed the isolated player-account database is reachable and the auth secret is present. Email delivery remains unavailable because no valid `RESEND_API_KEY` is configured; the previously inspected ALIVE Preview key was rejected and was not copied.
- GitHub Actions now applies the public Companion migration to a disposable PostgreSQL 16 service and verifies identity persistence, owner isolation, foreign keys, and cascading deletion. This does not modify Neon.
- The migration has not been applied to the actual `player-accounts-dev` Neon branch or production.

## External activation and acceptance gates

- Verify the public account email provider can deliver OTP messages. The currently inspected Resend Preview credential was rejected; no bypass is implemented.
- Configure the Preview database URL and Better Auth secret for this branch if they are not inherited from the account integration environment.
- Apply the migration only to the isolated development database after review.
- Test registration, email verification, passkey enrollment/sign-in, session restoration, create/save/reload, and cross-account isolation on Preview.
- Test the responsive Studio on iPad Safari and desktop.
- No production deployment, migration, merge, public account enablement, or storefront/world geometry change is included.

## Scope boundary

This first implementation saves the Companion's identity, appearance profile, and personality settings. It does not yet provide AI conversation, persistent episodic memory, voice synthesis, microphone access, cross-user interaction, or autonomous behavior. Those remain later, separately permissioned phases.
