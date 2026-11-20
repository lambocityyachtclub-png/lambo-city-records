# ALIVE Intellectual Property, Security, and Portability Boundaries

**Status:** Founder direction captured; implementation requirements, not a legal opinion or a claim that protections are already configured.

## Product and ownership direction

- ALIVE is the living-code technology and reusable platform. LAMBO CITY is its first showcase and integration, and the initial discovery channel.
- Keep ALIVE's core architecture modular and platform-neutral inside the LAMBO CITY repository during the first build. Do not make the core dependent on Three.js, game scenes, or LAMBO CITY-only services.
- Do not publicly expose ALIVE as a separate commercial product until the owner chooses that launch. Do not imply that concealment alone creates legal ownership.
- Preserve a clean future extraction path: separate packages/modules, explicit interfaces, independent data contracts, and documented dependencies.
- The company/founder must retain ownership of ALIVE's source, original designs, brand assets, specifications, and reusable technology, subject to verified contributor and third-party rights.
- Each end user's personal character identity, private memories, and permissions remain controlled by that user. The founder's ownership of the ALIVE platform does not mean ownership of users' personal identities or content.

## Important security truth

Encryption is essential for confidentiality, but it cannot by itself stop someone from copying code they are authorized to read, viewing code delivered to a browser, or taking screenshots of a product. A running application must be able to access the code and data it executes. Therefore use layered protection rather than promising that encryption makes theft impossible.

## Source-code and trade-secret protection

1. Keep the canonical repository private while ALIVE is being developed and before the owner intentionally launches or open-sources any portion.
2. Restrict repository access to named people and service accounts that need it; use least privilege, MFA/passkeys, protected branches, required reviews, and audit logs where available.
3. Never place API keys, signing keys, database credentials, recovery tokens, private certificates, or customer secrets in source code, browser bundles, commits, issue comments, or preview artifacts.
4. Keep proprietary decision logic, orchestration, policy enforcement, and valuable reusable ALIVE services server-side. Treat all browser-delivered JavaScript, assets, prompts, and network responses as inspectable by users.
5. Maintain a dependency and third-party license inventory. Do not copy third-party code or assets into ALIVE without checking license and provenance.
6. Require written IP assignment/work-for-hire terms where legally appropriate for contractors and collaborators, plus confidentiality and invention-assignment terms reviewed by counsel. Keep signed agreements and contribution records.
7. Preserve dated source history, design records, authorship records, release tags, and verified backups. Use signed commits/tags where practical.
8. Do not publish implementation details, repositories, architecture diagrams, or technical claims that would disclose a potential trade secret or patentable invention before an IP review.

## Encryption and key management requirements

- Use HTTPS/TLS for all network traffic; reject insecure transport for authenticated or private operations.
- Encrypt sensitive server-side data at rest using the hosting/database provider's supported encryption and, for the most sensitive fields, application-level envelope encryption.
- Use a managed key-management service or equivalent protected key store. Separate encryption keys from encrypted data; never commit keys or store them beside ciphertext.
- Keep production, preview, and development credentials separate. Scope each credential to the minimum required service and rotate/revoke it when exposed or no longer needed.
- Hash passwords with a modern password-hashing algorithm; do not encrypt passwords reversibly. Prefer passkeys where supported.
- Encrypt private personal memories and sensitive user data with owner-scoped access controls. Design key recovery, account recovery, deletion, and portability deliberately; do not claim end-to-end encryption unless the architecture actually prevents the service operator from reading the protected content.
- Backups must be encrypted, access-controlled, tested for restoration, and governed by a retention policy.
- Do not put secrets in localStorage, IndexedDB, URLs, client-side environment variables, or browser-delivered code. Browser-local drafts are not a secure vault or a backup.

## ALIVE/LAMBO CITY separation and portability

- ALIVE core: identity contracts, personality/behavior model, memory interfaces, permission model, policy evaluation, capability registry, and reusable living-code/development services.
- LAMBO CITY adapter: world-specific rules, scene/character presentation, gameplay permissions, event context, and in-world integrations.
- A character's identity can persist across environments; each environment independently decides which actions, objects, and capabilities are allowed there.
- An environment must enforce its own restrictions server-side for protected actions. A character's appearance, personality, or owner preference cannot override environment policy or user authorization.
- External platform integrations require explicit user sign-in, scoped authorization, revocation, and clear disclosure of actions. Never treat a character as automatically entitled to a user's accounts or data.
- Keep user-owned character data exportable in a documented format. Avoid making identity portability depend on one game database or one model provider.

## Deployment and autonomous-development boundaries

- ALIVE may inspect, propose, implement, and test changes in isolated workspaces under an explicit task scope.
- Routine visual/content improvements may later be auto-published only after the owner has configured an allowlisted category, automated acceptance checks, monitoring, and a tested rollback path.
- Protected boundaries always require explicit owner authorization: ownership, authentication, encryption/key management, privacy, permissions, billing/payments, customer data, external integrations, domain/DNS, production credentials, and changes to ALIVE's own security controls.
- No development worker may receive production secrets or unrestricted production write credentials.
- A passing test suite or successful preview is not proof of security, legal ownership, or owner acceptance.

## Legal protection workstream (owner + qualified counsel)

This document does not create or register legal rights. The owner should obtain qualified US intellectual-property counsel to:
- Confirm the correct legal entity owns the ALIVE and LAMBO CITY intellectual property and that all past/current contributors have assigned relevant rights.
- Review copyright registration strategy for important software releases and original creative assets.
- Conduct trademark clearance and consider applications for ALIVE, relevant logos, and product names before public branding.
- Assess whether any genuinely novel technical inventions merit patent protection before public disclosure; patentability and filing strategy require counsel.
- Establish confidentiality, contractor, employee, collaboration, and licensing agreements.
- Review privacy, consumer-protection, biometric/voice, data portability, and platform-integration obligations before public launch.

## Release checklist

- [ ] Confirm the GitHub repository visibility is private and access is limited.
- [ ] Enable MFA/passkeys and review collaborators, deploy keys, GitHub Apps, and tokens.
- [ ] Verify Vercel project/team ownership and restrict production deployment permissions.
- [ ] Inventory all secrets and move them to managed environment-secret storage; rotate any secret ever committed.
- [ ] Verify database encryption, backup encryption, access roles, and restore procedures.
- [ ] Keep proprietary ALIVE logic server-side; audit browser bundles and public source maps.
- [ ] Create an IP provenance register for source, models, images, audio, fonts, and dependencies.
- [ ] Confirm entity ownership and signed IP assignments with counsel.
- [ ] Complete trademark and patent disclosure review before public ALIVE launch.

## Non-goals

- Do not encrypt the entire repository in a way that prevents normal development, review, testing, or deployment.
- Do not claim that encryption makes source theft impossible.
- Do not hide a user's own character data from that user or make portability conditional on LAMBO CITY.
- Do not make ALIVE's first public appearance a separate launch before the owner chooses it.
- Do not change production configuration, repository visibility, DNS, billing, keys, or deployment settings as part of this documentation change.
