# ALIVE local owner workspace

## What it does

The local owner workspace is a browser-only planning and recordkeeping layer built on the existing LAMBO CITY Development System. It stores:

- Owner directions in an IndexedDB inbox.
- Development Director task records.
- Owner review records and decisions.
- The existing Development System registry and policy snapshot.

The local bootstrap is in `development/runtime/createLocalAliveControlPlane.js`. The browser persistence adapter is `development/storage/indexedDbDevelopmentStorage.js`. The standalone workspace is `/alive.html`.

## Strict boundaries

- No network request is made by the ALIVE page; its Content Security Policy sets `connect-src 'none'`.
- No hosted queue, AI provider, external database, code generator, sandbox or execution worker is configured.
- Saving a direction only creates a local inbox record. It does not create a development task automatically.
- A task/review record does not change source files. A review decision does not merge or deploy code.
- The ALIVE modules are not imported by the visitor-world runtime.
- The local workspace has no server-side sign-in. It is not a secure account portal; anyone with access to the same browser profile may be able to inspect local records.

## Storage and privacy

Records stay in the current browser profile on the current device. They do not automatically sync to another browser or device. Clearing site data, resetting the browser profile, device loss or storage eviction may remove them. Export/import backup is not implemented yet.

IndexedDB is origin-scoped browser storage, not an encrypted vault. Never store passwords, API keys, access tokens, private keys or other secrets in ALIVE. Use the workspace for non-secret project directions and planning records only.

## Development and release

The workspace uses the same existing Development Director and policy modules as the rest of ALIVE. Protected task actions remain subject to the existing owner-approval policy. The browser UI does not expose a code execution action.

Automated Chromium and WebKit checks exercise local direction intake, protected task approval, owner review decisions, persistence after database close/reopen, and the no-network boundary. An iPad-sized WebKit viewport is included, but automated WebKit is not a physical iPad Safari acceptance test.
