# ALIVE Companion Memory Owner Review

## Purpose
This module adds an owner-controlled review boundary for memories suggested by a Companion. A suggestion remains in the database's `proposed` state until the personal identity owner explicitly approves it. Archiving is a separate decision.

## Modules
- `alive/companion/memoryApprovalService.js`: owner/identity authorization, private-policy validation, proposal validation, explicit approval and archive operations.
- `alive/companion/postgresCompanionMemoryReviewRepository.js`: owner-and-identity-scoped SQL operations against the existing `alive_memory_entry` table.
- Tests cover owner authorization, delegated-user denial, proposal validation, conditional state transitions, and scope-bound SQL.

## Security invariants
- Only the personal identity owner can list, approve, or archive pending Companion suggestions.
- Only rows with both `state = 'proposed'` and `source = 'companion-suggested'` are reviewable.
- Approval is a single conditional SQL update and records `approved_by` and `approved_at`.
- Approval does not opt the memory into ALIVE development sharing, model training, or cross-world sharing.
- Missing, stale, foreign-owner, foreign-identity, and non-proposal records fail closed.
- This module does not create proposals and does not automatically approve them. A separately trusted proposal producer and authenticated owner API/UI integration are still required.

## Scope and release status
This is an isolated development addition. It does not apply migrations, change credentials, modify deployment settings, or touch production, HERO, LAMBO CITY geography, camera, controls, Studio, or audio/session behavior. The worker's Vercel Trusted Sources authorization remains a separate owner-controlled release blocker.

## Verification
The repository's `Development Engine Tests` workflow must pass on the exact pull-request head. No test result is claimed until GitHub Actions reports it.
