# Owner-only backup encryption key

Generate the age key pair on a trusted computer using the official age tool:

```sh
age-keygen -o alive-backup-identity.txt
```

The command prints a public recipient beginning with `age1`. Put only that public recipient in the GitHub Actions secret `ALIVE_BACKUP_AGE_RECIPIENT`.

The file `alive-backup-identity.txt` contains the private identity. Keep at least two offline copies in separate secure locations. Do not upload it to GitHub, Vercel, Neon, S3, email, or ChatGPT. Do not lose it: no provider can recover data encrypted to a lost private key.

To test a backup locally:

```sh
sha256sum -c alive-backup.tar.gz.age.sha256
age --decrypt --identity alive-backup-identity.txt alive-backup.tar.gz.age > alive-backup.tar.gz
tar -tzf alive-backup.tar.gz
```

Use a disposable test database for any restore. Never overwrite production during a recovery drill.
