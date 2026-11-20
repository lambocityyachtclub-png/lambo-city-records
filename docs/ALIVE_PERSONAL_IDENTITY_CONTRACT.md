# ALIVE Personal Identity and Companion Contract — v1

## Purpose

This is the first shared domain contract for the ALIVE Engine and ALIVE Companion. It establishes what a personal identity is, who owns it, how a companion may act, and what must remain under the person's control before persistence, AI providers, or world integrations are connected.

The contract is platform-neutral. LAMBO CITY is the first integration target, not the only world ALIVE may serve.

## Personal identity

An identity is distinct from an account login. The account authenticates a person; an ALIVE identity is the person's portable character and relationship with the companion system.

Every identity has:
- A stable identity ID and one authenticated personal owner ID.
- A display name and one of two supported character forms: `digital-human` or `stylized`.
- An optional model reference that can point to an existing avatar without recreating it.
- A personality summary and owner-selected traits.
- Private-by-default discoverability and owner-only memory access.
- An owner-controlled memory policy and explicit delegated access grants.

The identity contract does not store passwords, passkeys, email addresses, raw memory content, images, or provider credentials.

## Ownership and access

- The person identified by `ownerId` is the only implicit owner.
- Ownership cannot be granted to a company, world, bot, or delegated collaborator through a normal access grant.
- Owner access is always retained, including when other people receive access.
- Delegated roles are limited to `editor` and `viewer`; they do not become owners.
- A world integration receives only the explicit access granted to it. A world does not own the identity.
- Memory remains private by default and is never made public or used for model training by this contract.

For the LAMBO CITY founder identity, the integration should use the existing HERO model reference (currently represented in this contract as `existing:hero-model`) and bind it to the authenticated founder's personal identity. This is a reference boundary, not a claim that HERO has already been connected to an account or companion runtime. The existing HERO model, performance sequence, and Records HQ access must not be rebuilt or transferred to company ownership.

## Companion policy

A companion policy is attached to an identity, not used as a replacement identity. Its behavior mode is explicit:

- `owner-directed` — default; follows the owner's direct instructions.
- `assisted` — may provide approved assistance, but has no owner authority.
- `autonomous` — may perform only separately authorized, bounded actions. Acting while the owner is away is an explicit opt-in.

In every mode, the companion cannot change the person's identity or permissions, cannot share private memories by itself, and must obtain owner approval for external actions. Care and wellbeing are supportive, non-punitive, and reversible: no punitive decay or irreversible loss for missed activity.

## Engine + Companion boundary

The Engine owns contracts, policy evaluation, versioning, permissions, and later integration adapters. The Companion uses those contracts to express personality, maintain owner-approved context, and act within granted capabilities. Neither component can silently elevate its authority.

This v1 module is a pure domain layer. It does not yet provide:
- Database persistence, cross-device sync, encryption-at-rest, account linking, or identity recovery.
- AI inference, autonomous execution, speech, animation, or visual character creation.
- Multiplayer presence, world-to-world portability adapters, or HERO runtime registration.
- A production service or live application endpoint.

Those are separate implementation and verification milestones, not implied by passing the domain tests.

## Code and test locations

- `alive/identity/identityContract.js` — identity construction, validation, ownership checks, access grants, and companion policy.
- `development/tests/aliveIdentityContract.test.js` — unit coverage for personal ownership, both character forms, access boundaries, private memory defaults, companion modes, and non-punitive wellbeing.

Run with the existing Development Engine suite:

```sh
node --experimental-default-type=module --test development/tests/*.test.js
```

## Work log — 2026-11-17

- Rechecked current `main`: `2e9892bf550dbd43eb9a74fef547ce8995293b2b`.
- Rechecked release milestone issue #43 and current ALIVE worker branches.
- Confirmed the private-task endpoint still requires a real protected-preview invocation before the worker can be called operational.
- The GitHub Actions workflow already requests a GitHub OIDC token and sends it using Vercel's trusted OIDC header. The Vercel-generated 401 is an upstream deployment-protection gate; it must be resolved by the owner in Vercel Trusted Sources. Do not bypass or weaken protection.
- This PR adds a small, isolated, testable Engine + Companion domain contract on a fresh branch from current `main`. It does not change visitor runtime, production, accounts, HERO, Studio, world geometry, or access configuration.
- Next: run the Development Engine CI on this PR, then extend the same contract into durable owner-controlled identity storage and account linking only after the account preview and recovery path are verified.
