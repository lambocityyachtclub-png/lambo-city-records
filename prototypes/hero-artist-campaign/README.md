# HERO Artist Campaign Prototype

Standalone front-end prototype for HERO's public **LAMBO CITY VOL 1** release campaign.

## Included

- Public Apple Music and Amazon Music release links.
- Manual YouTube audience and release-stream milestone inputs.
- Date/source fields for documenting where a metric was checked.
- Local celebration preview for reached targets, including a double-milestone state.
- Career record submission form for audience, release, press, live event, rights/royalty, and campaign-deliverable records.
- Evidence queue with pending, approved, and rejected states, reviewer notes, and decision timestamps.
- Filterable review queue and JSON export backup.

## Important boundaries

- This is a browser-only prototype. Career records persist in the current browser's `localStorage` on that device; they are not synced between users or devices and there is no server backup.
- The reviewer controls are a workflow demonstration, not identity verification or independent validation. A human must open the submitted public source and confirm the exact claim.
- Metrics are manually entered. There is no YouTube, Apple Music, Amazon Music, Spotify, CD Baby, or ASCAP API connection.
- No login, multi-user permissions, live job applications, payments, or royalty integration exists.
- Never enter passwords, private account data, payment details, or confidential statements into the public evidence URL field.
- Actual royalty records must be supported by relevant statements or payment evidence. Radio playback or playlist placement alone does not establish a royalty payment.
- Game rewards, audience milestones, streams, and actual royalty income remain separate record categories.
- The prototype does not modify the live Three.js game entry point or trigger in-game rewards.

## Next engineering stage

A secure shared backend would be required before this can become a real multi-user system. That stage needs authenticated users, role-based reviewer permissions, server-side audit history, safe evidence storage/retention rules, and explicit approval gates before approved milestones are sent to the game. Platform API integrations should be added only where official access and user authorization are available.
