# ALIVE local runtime contract

## Bootstrap

Use `createLocalAliveControlPlane()` from `createLocalAliveControlPlane.js` in the private, authenticated owner workspace. It initializes the existing Development System with browser IndexedDB persistence.

The local bootstrap provides:
- Development Director task state.
- Owner review records and decisions.
- Owner vision/direction inbox records.
- The existing specialist roster for planning and routing metadata.

It does not configure a hosted queue, AI provider, PostgreSQL connection, Vercel Sandbox, code generator, code executor or scheduled worker. It does not make a network request or modify the visitor-facing game.

## Data scope and privacy

Records remain in the current browser profile on the current device. They do not automatically sync to another browser or device. Browser site-data clearing, profile reset, device loss or storage eviction can remove them. There is no built-in export/import backup yet.

IndexedDB is origin-scoped storage, not encryption or a secure vault. Anyone with access to the same browser profile or a successful same-origin script injection may be able to read its contents. Never store passwords, API keys, access tokens, private keys or other secrets in local ALIVE records. The remote owner workspace still requires its separate server-side authentication controls.

## Review and execution safety

A local review decision records an owner decision only. It does not merge a branch, deploy a release, spend money, change billing, alter secrets or modify production. A passing test result attached to a review record is evidence supplied to the review API; it is not independently re-run by this storage adapter.

This local control plane is not an autonomous code executor. Any future execution adapter must be independently reviewed for trusted isolation, explicit path allowlists, network restrictions, cleanup, provenance, test evidence and draft-only output. Never execute generated code inside the visitor game or an ordinary unsandboxed process.

## Verification

The browser test in `development/tests/browser/indexedDbContentCache.browser.mjs` exercises the local bootstrap with real IndexedDB in Chromium and WebKit, including an iPad-sized WebKit touch viewport. It checks task, review and owner-direction persistence after database close/reopen, verifies protected tasks require approval, and asserts external providers and execution workers remain unconfigured.

These browser checks are automated browser evidence, not a physical iPad Safari sign-off.
