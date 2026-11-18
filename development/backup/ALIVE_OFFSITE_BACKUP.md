# ALIVE encrypted offsite backups

## What the scheduled workflow protects
The GitHub Actions workflow creates a single encrypted archive containing:
- A Git bundle with all refs available to the checkout, preserving repository history.
- A PostgreSQL custom-format dump of the configured ALIVE database.
- A small manifest containing timestamp, repository, commit, and format details.

The archive is encrypted locally with age before upload. AWS receives only ciphertext and a checksum. The age private key is never placed in GitHub or AWS. The database URL is supplied only as a GitHub Actions secret and is never printed.

## Independent destination requirements
Create a dedicated private S3 bucket in an AWS account that is not controlled by the GitHub or Vercel account alone. Enable:
- S3 versioning.
- Block Public Access on all settings.
- Default server-side encryption.
- A lifecycle policy and retention period chosen by the owner.
- Optional Object Lock with a retention mode/period reviewed before enabling; Object Lock settings can be difficult to reverse.
- A narrowly scoped IAM role for GitHub Actions OIDC. It should permit writing only under the `alive/*` prefix and should not permit bucket deletion, policy changes, or reading backups.

Do not use long-lived AWS access keys. Configure GitHub Actions OIDC trust for this repository and the `alive/encrypted-offsite-backups-2026-11-18` branch initially. Restrict the trust policy to the exact repository and branch/environment.

## Required GitHub Actions secrets and variables
Secrets:
- `ALIVE_BACKUP_DATABASE_URL`: connection string for the ALIVE database to back up. Prefer a dedicated read-only PostgreSQL role with sufficient privileges to dump the intended schema/data.
- `ALIVE_BACKUP_AGE_RECIPIENT`: age public recipient string. This is not a decryption secret, but store it as a secret for simple setup.
- `ALIVE_BACKUP_AWS_ROLE_ARN`: IAM role ARN assumed using GitHub OIDC.

Variables:
- `ALIVE_BACKUP_AWS_REGION`: bucket region.
- `ALIVE_BACKUP_S3_BUCKET`: dedicated bucket name.

The age private identity (the only key capable of decrypting the archive) must be generated and stored offline by the owner, ideally in two secure physical locations. Never commit it, paste it into ChatGPT, or store it in the same AWS account as the backups. If it is lost, encrypted backups cannot be decrypted.

## Activation and first-run validation
1. Create the separate AWS account/bucket and configure its security controls.
2. Generate an age key pair on a trusted device; keep the private identity offline and provide only the public recipient to GitHub Actions.
3. Configure the OIDC role and the GitHub Actions secrets/variables listed above.
4. Run the workflow manually from the backup branch.
5. Confirm the workflow succeeds and that the encrypted archive and checksum exist in the bucket.
6. Download one archive to a trusted recovery device, verify its SHA-256 checksum, decrypt it with the offline private identity, and inspect the manifest and Git bundle.
7. Restore the database dump into a separate, disposable Neon branch/database and verify expected tables and row counts. Never test restoration over production.
8. Record the restore date, target, and result in the owner recovery log.

Until these steps succeed, backups are implemented but NOT active or verified. A workflow run alone does not prove recovery. The first successful isolated restore is the completion criterion.

## Restore outline
1. Download the encrypted archive and matching checksum from the independent bucket.
2. Verify the checksum before decryption.
3. Decrypt with the owner's offline age identity.
4. Extract to a clean recovery machine.
5. Clone the Git bundle into a new repository/worktree and verify the expected commit.
6. Restore the PostgreSQL dump into a new, isolated database/branch using `pg_restore --no-owner --no-acl`.
7. Reconfigure secrets directly in the provider consoles. Secrets are deliberately not included in the archive.
8. Validate application and data, then choose explicitly whether to redirect deployments.

## Important ownership and recovery controls
The owner should retain administrator access and MFA/recovery methods for GitHub, Vercel, Neon, the domain registrar, and the independent backup account. Keep provider recovery codes offline. A backup cannot restore access to an account if the owner has also lost the provider account and its recovery methods.

This workflow does not change production, apply migrations, or deploy the application. It does not back up provider secrets or third-party account ownership. Review bucket retention and restore procedures periodically.
