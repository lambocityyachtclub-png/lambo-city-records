# LAMBO CITY Player Account Foundation

## Approved direction
- Passwordless, passkey-first player identity.
- Email one-time code for initial email ownership verification and account recovery.
- Username-based player profile.
- Persistent player inbox stored against the authenticated account.
- Account data is hosted separately from the Three.js world runtime.

## Development isolation
- Git branch: `feature/player-account-foundation`
- Neon project: `square-dew-67503197`
- Neon branch: `player-accounts-dev`
- Vercel environment variables `DATABASE_URL` and `BETTER_AUTH_SECRET` are scoped only to preview deployments for this Git branch.

## Current implementation
- Better Auth server mounted at `/api/auth/*`.
- Passkey plugin and email OTP plugin.
- Player profile API at `/api/player/profile`.
- Persistent account inbox API at `/api/player/messages`.
- Citizen Phone entry point opens the account experience.
- Passwords are disabled; the intended login path is passkey.
- Profile API supports a username, bio, and up to three HTTPS image URLs. Upload UI/storage is a follow-on task.

## External activation still required
The account email code sender uses Resend. Live code delivery requires:
- `RESEND_API_KEY` in the preview environment.
- `EMAIL_FROM` set to an address on a verified LAMBO CITY sending domain.
- DNS authentication records added at the domain's DNS host.

No production environment variables are changed by this feature. Do not merge or deploy to production until email delivery is configured and the full signup, verification, passkey registration, passkey sign-in, session restoration, profile, and inbox flows have been tested.

## Database
The migration in this folder is applied to the isolated development branch. Keep it as the source-controlled record of the account schema.
