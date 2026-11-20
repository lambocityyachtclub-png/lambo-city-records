# ALIVE owner authentication

## Purpose
Replace the temporary bearer-token dashboard gate with a dedicated, single-owner account. Player accounts remain separate and never grant ALIVE owner access.

## Authentication
- Email/password is enabled with Better Auth's password hashing and mandatory email verification.
- Passkeys are supported as the preferred sign-in method and require user verification.
- Optional authenticator-based two-factor authentication protects password sign-in.
- Enabling two-factor authentication generates ten one-time backup codes; codes are consumed when used and are shown to the owner during setup for offline storage.
- Password reset and email verification use Resend through server-side environment variables.
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
- RESEND_API_KEY and EMAIL_FROM: verified sender configuration for verification and password-reset email.

Do not place passwords, API keys, or generated secrets in GitHub files or ChatGPT messages. The owner enters credentials directly in the trusted provider UI.

## Manual activation sequence
1. Confirm the target is the ALIVE development database, not production.
2. Apply 002_alive_owner_auth.sql manually after explicit owner approval.
3. Add the required Preview-only environment variables.
4. Open the Preview /alive/ page, enroll using the exact ALIVE_OWNER_EMAIL, and verify the email.
5. Set a unique owner password and register at least one passkey.
6. In the owner console, enable authenticator-based two-factor authentication, add the displayed URI to an authenticator app, verify a current code, and save all ten one-time backup codes in two secure offline locations.
7. Test password + authenticator sign-in, password + backup-code sign-in (confirm a code cannot be reused), passkey sign-in, sign-out, session restoration after reload, password reset, and denial of a different email.
8. Only after successful tests, remove the legacy ALIVE_REVIEW_TOKEN configuration from the Preview environment.
9. Passkeys are origin-bound: use a Preview passkey for Preview testing, then register a new passkey after the canonical production domain is activated.

## Not yet included
This PR does not apply the database migration, configure Vercel secrets, configure Resend, create the owner's account, or register a passkey. Authenticator-based two-factor authentication and one-time backup-code issuance are implemented in this branch but still require owner enrollment and end-to-end verification. Independent encrypted offsite backups and a tested restore remain a separate required milestone. No code is merged or deployed to production.

Enter all owner credentials and mail-provider secrets directly in Vercel Environment Variables. Never paste passwords, `ALIVE_OWNER_AUTH_SECRET`, Resend keys, database URLs, or recovery codes into chat, source files, or Git commits.
