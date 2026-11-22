# ALIVE owner authentication

## Purpose
Replace the temporary bearer-token dashboard gate with a dedicated, single-owner account. Player accounts remain separate and never grant ALIVE owner access.

## Authentication
- Email/password is enabled with Better Auth's password hashing. First-owner enrollment is gated by a high-entropy, time-limited Preview-only invitation token and the exact ALIVE_OWNER_EMAIL allowlist. Email verification is intentionally not a prerequisite for the one-time founder bootstrap; the owner registers a passkey and configures backup codes immediately after enrollment.
- Passkeys are supported as the preferred sign-in method and require user verification.
- Optional authenticator-based two-factor authentication protects password sign-in.
- Enabling two-factor authentication generates ten one-time backup codes; codes are consumed when used and are shown to the owner during setup for offline storage.
- Password reset uses Resend through server-side environment variables. Resend is not required to create the initial founder account or use a registered passkey; password-reset email remains unavailable until Resend is configured.
- Only the exact normalized email in ALIVE_OWNER_EMAIL may create the owner account.
- The API checks the authenticated, verified session and the same owner email on every protected action.
- Session cookies are managed by Better Auth. The browser does not store bearer tokens in localStorage, sessionStorage, or JavaScript-readable cookies.
- The auth tables use dedicated alive_owner_* names and do not share player-account tables.

## Required Preview environment configuration
- DATABASE_URL: the ALIVE development database connection.
- ALIVE_OWNER_EMAIL: the one owner email address allowed to enroll.
- ALIVE_OWNER_AUTH_SECRET: a unique random secret of at least 32 characters.
- VERCEL_BRANCH_URL: supplied automatically by Vercel for the active Preview; ALIVE uses this branch origin for Preview auth and WebAuthn RP ID.
- ALIVE_OWNER_AUTH_URL: optional explicit HTTPS origin override. On Preview, VERCEL_BRANCH_URL takes precedence when available; this setting is the fallback. On Production, this setting selects the canonical auth origin.
- ALIVE_OWNER_ENROLLMENT_TOKEN and ALIVE_OWNER_ENROLLMENT_EXPIRES_AT: a high-entropy, single-use, short-lived Preview-only founder invitation. Never configure these in Production. Remove the token after successful enrollment.
- RESEND_API_KEY and EMAIL_FROM: verified sender configuration for password-reset email; not a blocker for initial founder enrollment.

Do not place passwords, API keys, or generated secrets in GitHub files or ChatGPT messages. The owner enters credentials directly in the trusted provider UI.

## Manual activation sequence
1. Confirm the target is the ALIVE development database, not production.
2. Confirm migration 002 is present on the dedicated ALIVE development branch.
3. Add the required Preview-only environment variables, including a random enrollment token with an expiry no more than 48 hours away.
4. Open the private invitation link on the exact Preview origin and create the founder account using the configured ALIVE_OWNER_EMAIL and a unique password. The invitation is accepted only on Preview and only while no owner account exists.
5. Register at least one passkey on the iPad and confirm passkey sign-in.
6. In the owner console, enable authenticator-based two-factor authentication, add the displayed URI to an authenticator app, verify a current code, and save all ten one-time backup codes in two secure offline locations.
7. Remove ALIVE_OWNER_ENROLLMENT_TOKEN and ALIVE_OWNER_ENROLLMENT_EXPIRES_AT from the Preview environment after the owner account exists. Confirm further signup attempts are rejected even if a token is restored.
8. Test password + authenticator sign-in, password + backup-code sign-in (confirm a code cannot be reused), passkey sign-in, sign-out, session restoration after reload, password reset once Resend is configured, and denial of a different email.
9. Only after successful tests, remove the legacy ALIVE_REVIEW_TOKEN configuration from the Preview environment.
10. Passkeys are origin-bound: use a Preview passkey for Preview testing, then register a new passkey after the canonical production domain is activated.

## Not yet included
This PR does not apply the database migration, configure Vercel secrets, configure Resend, create the owner's account, or register a passkey. Authenticator-based two-factor authentication and one-time backup-code issuance are implemented in this branch but still require owner enrollment and end-to-end verification. Independent encrypted offsite backups and a tested restore remain a separate required milestone. No code is merged or deployed to production.

Enter all owner credentials and mail-provider secrets directly in Vercel Environment Variables. Never paste passwords, `ALIVE_OWNER_AUTH_SECRET`, Resend keys, database URLs, or recovery codes into chat, source files, or Git commits.
