# LAMBO CITY ALIVE — Blueprint Reconciliation Foundation

## Purpose

This layer converts first-pass discovery into a traceable reconciliation draft. It does not replace the North Star, Master Blueprint, department source documents, or owner decisions.

Every record carries:
- A stable identifier and master/department scope.
- An implementation classification distinct from verification.
- A confidence level.
- A plain-language interpretation.
- One or more source paths and human-readable locators.
- Dependencies and open questions.

## Classification rules

| Implementation status | Meaning |
|---|---|
| `present` | A capability may be called present only when an automated-test source is also cited. |
| `partial` | Some implementation or foundation exists, but the full experience or acceptance criteria are not established. |
| `planned` | Direction or a roadmap exists; implementation is not established. |
| `future` | A long-term concept that is not part of the current implementation scope. |
| `blocked` | Work cannot proceed until a named dependency or decision is resolved. |
| `conflict` | Sources have an ambiguity or apparent conflict that must remain visible for owner review. |

Verification is separately recorded as source-reviewed, automated-tests-passed, runtime-not-verified, owner-decision-required, or not-started. Source presence alone never proves end-to-end completion.

## Safety and authority

- Owner-authored documents remain unchanged.
- The register is a draft interpretation with source provenance.
- Conflicts are not silently resolved.
- Discovery matches are not automatically promoted to requirements.
- The reconciliation command does not create, approve, or submit Development Director tasks.
- No production, billing, security, data, or deployment action is performed.
- Master and department blueprints remain drafts until the owner approves them.

## Current reconciliation notes

The first register deliberately captures a small, high-confidence set of important findings rather than treating every keyword match as truth. It identifies the World System, Conference Center, water source, Studio shared-core direction, pitch-correction source, HERO stage-performance direction, commerce restrictions, digital-real-estate constraints, and ALIVE scope.

One scope ambiguity is explicitly flagged: the World Plan excludes backend/account/multiplayer work from the current visitor-facing single-player game, while the ALIVE plan describes a separate hosted development environment. The intended architecture is to keep ALIVE separate from the live game and avoid making game exploration depend on ALIVE infrastructure. This remains flagged until that boundary is written into the approved Master Blueprint.

## Run locally

```sh
node --experimental-default-type=module development/blueprints/reconcileBlueprints.mjs
```

The command writes:
- `development/planning/blueprint-reconciliation/reconciliation.json`
- `development/planning/blueprint-reconciliation/README.md`

The report is generated in CI alongside the read-only discovery report. It is a review artifact, not an authoritative blueprint or task queue.
