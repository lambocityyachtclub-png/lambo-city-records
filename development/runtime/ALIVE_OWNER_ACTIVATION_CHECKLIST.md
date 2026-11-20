# ALIVE Owner Activation Checklist

This checklist records the remaining owner-controlled activation gates. The current ALIVE Preview candidate now builds successfully and its automated Development Engine tests pass; physical browser acceptance and owner activation are still required. Do not paste secrets, passwords, recovery codes, database URLs, or private keys into ChatGPT or GitHub files. Enter them directly in the appropriate provider settings.

## 1. Resolve the Preview gate

- The current release candidate has passing automated tests and the authorized-file-scope check.
- A current branch Preview has reached READY. Re-check the latest exact-head Preview before owner activation; a READY deployment alone does not replace browser acceptance.
- Do not merge the release candidate until a Preview for the exact current commit builds and is inspected.

## 2. Protect the repository and invention

- The GitHub repository is currently public. The owner has not authorized a visibility change.
- Before patent filing, public marketing, or launch, decide whether to make the repository private and verify the ChatGPT/GitHub/Vercel connections still work afterward.
- Making it private does not undo earlier public disclosure. Ask a patent attorney to assess disclosure dates and filing options before making patentability assumptions.
- No public visitor should receive repository access or source-code access.

## 3. Prepare an isolated ALIVE database

Use a dedicated Neon database/branch for ALIVE, separate from production player data. Apply these migrations manually in order:

1. `development/storage/migrations/001_alive_hosted_control_plane.sql`
2. `development/storage/migrations/002_alive_owner_auth.sql`
3. `development/storage/migrations/003_alive_identity_companion.sql`

The hosted control plane uses transaction-scoped PostgreSQL advisory locks. A Neon pooled connection is supported. Do not apply these migrations to a production game database.

## 4. Configure Vercel environment variables

Configure the following server-side values in Vercel. Start with Preview environment values only; add Production values only after Preview validation.

- `DATABASE_URL` — dedicated ALIVE database connection string.
- `ALIVE_OWNER_AUTH_SECRET` — a newly generated secret of at least 32 characters.
- `ALIVE_OWNER_EMAIL` — the one email address permitted to create the owner account.
- `VERCEL_BRANCH_URL` — supplied automatically by Vercel for the active Preview branch; ALIVE uses this origin for Preview auth.
- `ALIVE_OWNER_AUTH_URL` — optional explicit HTTPS origin override (origin only, no API path).
- `RESEND_API_KEY` — transactional email provider key.
- `EMAIL_FROM` — verified sender identity for owner verification and password recovery.
- `OPENAI_API_KEY` — server-side proposal-provider key.
- `OPENAI_MODEL` — optional; defaults to `gpt-6.1-sol` for routine proposal work.
- `ALIVE_ALLOWED_PATHS` — exact JSON string `["development"]` for the first pilot.
- `ALIVE_AI_ENABLED` — keep `false` until API budget/usage limits are reviewed.
- `ALIVE_SANDBOX_ENABLED` — keep `false` until the Vercel Preview and sandbox configuration are verified.
- `ALIVE_SCHEDULER_ENABLED` — keep `false` during initial activation.
- `CRON_SECRET` — generate a separate random secret of at least 32 characters for the scheduled route.

Vercel Sandbox uses the Vercel runtime's supported authentication; do not put sandbox credentials in browser code.

## 5. Create the owner account last

After migrations and Preview configuration are ready:

1. Open `/alive/` and create the account using the configured owner email.
2. Verify the email through the transactional email link.
3. Sign in with the owner password.
4. Register a passkey for Face ID on the owner's device.
5. Set up an authenticator app and verify a TOTP code.
6. Save the one-time backup codes offline in a password manager or other secure recovery location.
7. Confirm password recovery works.

The owner account is separate from player accounts. Other email addresses cannot sign up as owners.

## 6. Verify the controlled development loop manually

Keep the scheduler off. Use one low-risk documentation or test task within `development`:

1. Submit the task in the owner console.
2. Approve it if it enters `pending_approval`.
3. Run one task manually.
4. Inspect the isolated proposal and sandbox test results.
5. Mark the review PERFECT or request CHANGE.
6. Confirm the task is completed or safely requeued and no production file, deployment, or player data was changed.

Only memories explicitly marked **Allow ALIVE development to use this memory** are included in task context. Other Companion memories remain private.

## 7. Enable scheduled work only after manual verification

The scheduled route is configured for one World task per day. Keep `ALIVE_SCHEDULER_ENABLED=false` until the owner has completed the manual workflow and approved the schedule. The worker cannot commit, merge, or deploy code.

## 8. Configure offsite backups

Generate an age keypair offline and keep the private key offline. Configure these GitHub Actions secrets:

- `ALIVE_BACKUP_DATABASE_URL`
- `ALIVE_BACKUP_AGE_RECIPIENT`
- `ALIVE_BACKUP_AWS_ROLE_ARN`

Configure these repository variables:

- `ALIVE_BACKUP_AWS_REGION`
- `ALIVE_BACKUP_S3_BUCKET`

Run the backup workflow manually, verify the encrypted source/database backup exists in independent storage, and perform a restore test into a separate test database before relying on it.

## 9. Finish the public boardwalk-store experience

The current `/alive/` page is an owner-only, no-index console—not the public visitor experience. The requested in-world boardwalk-store entry point is not wired yet. It requires a separate additive interaction module and a small registration change in the existing game entrypoints (including `main.js` / `engine.js` and the relevant HUD/input path). Obtain owner authorization for that exact game-file scope before making it. Preserve all approved store positions, geography, navigation, camera, and existing systems.

The public experience must be a separate interface and server-side API boundary. Visitors must never receive repository, owner-console, or private-memory access.

## 10. Patent preparation

The code and architecture are now documented as a technical foundation, but no patent application has been filed and patentability is not established. Prepare a separate private invention disclosure and draft claims, perform a prior-art search, and have a qualified patent attorney review disclosure timing and filing strategy before any filing or public launch.

Passkeys are tied to their website origin. A passkey registered on a Vercel Preview is for Preview testing; register a separate passkey after the canonical production domain is activated.

All owner steps above remain manual and owner-controlled. This pull request does not change repository visibility, apply migrations, create credentials, enable paid execution, turn on the scheduler, or deploy to production.
