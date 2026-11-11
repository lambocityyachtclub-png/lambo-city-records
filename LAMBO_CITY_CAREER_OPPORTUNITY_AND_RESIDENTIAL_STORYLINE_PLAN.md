# LAMBO CITY Career, Opportunity, Residential & Visitor Storyline Plan

**Status:** Planning blueprint — proposed direction, not implemented functionality  
**Repository:** `lambo-city-records`  
**Guiding rule:** Extend the existing LAMBO CITY experience. Preserve working systems and the current Three.js architecture. Do not rebuild, overwrite, deploy, or introduce major dependencies without approval.

## 1. North Star

LAMBO CITY is an entertainment world that connects **Experience, Opportunity, and Progression**.

The luxury waterfront, music, performances, Jumbotron, marina, social life, and distinctive buildings attract people. Career pathways, practical industry knowledge, creator collaboration, and meaningful progression give them reasons to return and help them recognize opportunities outside the game.

This must remain entertaining. It should not become a dry educational game or promise that players will become wealthy. LAMBO CITY can provide information, practice, resources, connections, and opportunities; it cannot guarantee real-world success.

## 2. First-time visitor storyline

Preserve this intended sequence as the primary onboarding narrative:

1. **Arrival:** Visitor opens lambocityrecords.com and enters the existing Three.js city at the docks. LAMBO CITY Radio plays LAMBO CITY music. The waterfront, HQ, convention center, shops, and city landmarks establish the setting.
2. **HERO greeting:** HERO stands on the bridge and welcomes the visitor. Proposed line: “Welcome to LAMBO CITY. I'm HERO. Save my number. You never know when you might get a call from me.”
3. **Explore:** Visitor freely explores public areas and discovers the live performance on the Jumbotron.
4. **Performance:** Visitor activates and watches the performance.
5. **In-game call:** After the performance, HERO leaves the stage with paparazzi/bodyguards. The visitor receives an in-game call from HERO inviting them to LAMBO CITY Records for a studio experience. This is initially an in-game event/call, not a real telephone call.
6. **HQ reception:** Visitor reaches LAMBO CITY Records HQ and is welcomed at reception.
7. **Studio demo:** Visitor can try a limited public studio demo. Guests may experiment, but saving sessions requires a registered player profile. The full upgraded studio and upper-floor experiences can remain restricted/invitation-based as the rollout matures.
8. **Profile creation:** After the demo, invite the visitor to create a profile to save work and establish a persistent identity in the city.
9. **HERO relationship:** After registration, HERO becomes the player's first in-game friend. His relationship state persists and can reflect milestones, returning visits, and invitations. Begin with a controlled, limited implementation; do not assume unrestricted autonomous AI.
10. **Career selection:** Player chooses one or more interests (for example recording artist, streamer/creator, manager/agent, fashion/styling, PR/marketing, events/production). These are starting interests, not permanent restrictions.
11. **Reputation and progression:** The player sees reputation/progress in the existing HUD where practical. Meaningful contributions, learning, creative work, networking, events, and completed opportunities can build reputation.
12. **Long-term life in the city:** Registered players can build a creative identity, return to saved work, participate in opportunities, socialize, and eventually access residential and other city systems as those systems are implemented.

### HERO character requirements

HERO is intended to become an “ALIVE” character: recognizable identity and personality, awareness of relevant in-game interactions, persistent relationship/milestone context, and the ability to initiate selected conversations or invitations. Start with a safe, bounded set of states and triggers. Keep the in-game phone identity separate from the player's real contact details. Never expose a player's private phone number to HERO or other players.

## 3. Career & Opportunity System

Create a connected system that introduces real entertainment-industry pathways through a blend of:
- Real creator activity and actual releases.
- Simulated learning missions and practice activities.
- Accurate educational resources about real companies and industry processes.
- Player-to-player collaboration and, later, properly governed paid opportunities.

### Initial career categories

- Recording Artist
- Streamer / Creator
- Manager / Agent
- PR / Marketing
- Fashion / Styling
- Events / Production

Players can change or add interests as they discover new paths.

### Recording Artist learning path

Potential stages:
1. Develop artist identity, sound, brand, and catalog.
2. Prepare and distribute a release.
3. Understand publishing, writer registrations, performance rights, royalties, and ownership.
4. Build a team: producers, managers, publicists, booking agents, stylists, and promotional support.
5. Plan a release campaign and street-team activity.
6. Build audience, partnerships, sponsorship readiness, and a sustainable business.

### Real industry resources

The user has experience distributing music through CD Baby and registering/publishing writers through ASCAP. These are natural initial educational examples:
- Explain what the services do and what questions an independent artist should ask.
- Provide accurate, appropriately linked resources where permitted.
- Do not imply CD Baby, ASCAP, or any other company is a LAMBO CITY sponsor, partner, or endorser without an actual agreement and permission to use branding.
- Educational references are not endorsements or legal/financial advice.

### First practical pilot: Artist Release Campaign

Build one end-to-end workflow before expanding the marketplace:
1. Artist creates a campaign for an actual music release and supplies the relevant release details/assets they are authorized to use.
2. Artist posts clearly scoped opportunities: street-team support, social promotion, graphic design, video editing, event coordination, or other creative assistance.
3. Other players browse and apply.
4. Artist selects participants and confirms expectations/deliverables.
5. Participants complete assigned work and submit evidence/deliverables.
6. Artist reviews and confirms completion; disputes and moderation have a defined path.
7. System records the verified contribution and updates relevant reputation/progression.

Distinguish educational missions, volunteer/community participation, and paid work. Any paid work needs explicit compensation, scope, timing, rights/permissions, and dispute terms. Do not imply that in-game reputation substitutes for wages or employment protections. Do not require players to spend money to earn reputation or maintain residential eligibility.

### Future sponsorship and advertising

Potential placements include Jumbotron, stage, approved city billboards, convention center events, and clearly labeled sponsored educational experiences. Build sponsorship as a later phase after real usage and audience engagement can be demonstrated. Obtain written permission for logos, trademarks, ad creative, and sponsor claims. Label paid placements and sponsored content clearly.

## 4. Reputation and meaningful participation

Reputation should reflect verified contributions rather than raw logins or spending. Potential categories:
- Creative development and releases.
- Learning and skill-building.
- Collaboration and reliability.
- Networking and community contribution.
- Event participation and organization.
- Completed, verified opportunities.

Reuse and inspect the existing HUD/player-card/objective patterns before adding another panel. The user has noted existing HUD elements may be reusable. Do not create duplicate score/reputation interfaces without inspecting current code.

Rules:
- Explain why reputation changed.
- Avoid easy farming, duplicate submissions, self-approval, bot activity, and pay-to-win.
- Separate reputation categories from a single overall score if that improves clarity.
- Reputation can influence recognition, invitations, and progression, but should not guarantee real-world outcomes.
- Server-side validation is required for consequential records.

## 5. LAMBO CITY Villas — founding residential program

### Intended physical concept

Keep the name **LAMBO CITY Villas**. These are not apartment towers. The vision is individual luxury waterfront villa/mini-condo residences arranged along the outer street facing the water, with a personal home-like space and access to the waterside.

Potential features:
- Private entrance and customizable interior.
- Wall colors/wallpaper, flooring/carpet, furniture, posters/artwork, chandeliers, lighting, entertainment.
- Waterfront patio/deck and a dock or designated boat slip where the world layout supports it.
- Future jet-ski/small-watercraft access and storage.
- Social visits, gatherings, and displaying creative achievements as later features.

The first 300 founding residents should receive the closest/more desirable waterfront locations. As the community grows, additional villa areas can extend farther along the waterfront, farther from the docks. Keep core home quality and customization meaningful for later residents; distinguish locations/views/access rather than deliberately making later homes poor quality. Lock a resident's assigned location once awarded, subject to the published entitlement rules.

### Founding eligibility and account protection

- Target: first 300 qualifying founding residents, not merely first 300 usernames or phone numbers.
- Require a registered player profile and an eligibility/claim process defined before public announcement.
- One founding entitlement per eligible account/person under a clearly stated anti-abuse policy.
- Use a stable internal account ID as the entitlement key. A phone number is a verification/recovery contact, not the property record.
- Changing a phone number must not remove or reset a villa.
- Duplicate-account suspicions should trigger review and recovery/merge procedures, not automatic confiscation.
- Use privacy-conscious verification, secure storage, rate limits, and minimal data collection. Phone verification alone does not prove one human equals one account.
- The residential ledger should record entitlement ID, original qualification/claim date, assigned villa, status, and approved transfer/recovery history.
- If a villa is not yet built, record the entitlement/reservation clearly; do not represent a not-yet-delivered feature as already usable.

### Activity, leave, and reassignment policy

The user prefers residential benefits to reward ongoing participation so inactive accounts do not lock up scarce homes, while also respecting family and life circumstances.

Principles:
- Measure meaningful participation, not daily logins or spending.
- Examples: verified learning mission, completed creator task, approved collaboration, music activity, attending/organizing an event, or meaningful community contribution.
- Keep founding recognition/history separate from the current right to occupy a specific villa.
- Provide advance notices, a clear response process, and an extended-leave request that does not require sensitive personal details.
- A possible 90-day inactivity checkpoint and subsequent grace/review period were discussed, but exact timing and consequences are **not finalized**. Do not implement or advertise the proposed 90/120/150-day schedule as a settled policy.
- If a villa is released under published rules, preserve the person's founding recognition and provide a clear return/priority pathway where feasible.
- Maintain a waiting list for unclaimed or legitimately released villas.
- Do not automatically confiscate a villa because of a missed login or a temporary life event.

### Transferability — open decision

Whether founding villa rights can be sold/transferred has not been finalized. Any transfer must be an intentional, auditable in-game process if eventually allowed. Define whether customizations move with the entitlement. Distinguish in-game residential rights from real-world property ownership, investment, cash-out, or guaranteed resale value. Obtain legal review before promising monetary resale or transferable value.

## 6. Existing world and access boundaries

Preserve the current Three.js world, landmarks, and working functionality. Do not rebuild working systems or introduce major dependencies without approval.

Current reported world experience:
- Player starts at the docks; LAMBO CITY Radio plays the user's music.
- HQ is currently the only enterable building.
- Floor 1 is intended as a major-label reception/front door and controlled invitation threshold, not an unrestricted opportunity hub.
- Floor 2 has working sound setup and session save/load, including Beat Lab; do not report these as unfinished. Preserve them.
- Floor 2 MPC/Beat Lab integration and screen switching are a separate design task: MPC in front of seated player viewpoint, Beat Lab display close to MPC, desk stays put, and music continues while switching views. Actual game screenshot determines elevator location, not a mismatched reference image.
- Floor 3 is intended for meetings, meet-and-greets, collaborations, business ventures, and conferences; scale it thoughtfully.
- Rooftop is scenic and may become an earned/invitation-based experience.
- Convention center, shops, dockside properties, yacht, studio areas, upper floors, and rooftop may be intentionally gated or decorative during rollout. Do not label intentional access restrictions as bugs.
- Initial rollout may temporarily allow public HQ access and a limited studio demo. Longer-term full studio and upper-floor/VIP access can be invitation-controlled.
- Guests can experiment in the limited demo; saving sessions requires a profile. Saved sessions should be private by default unless the player chooses to share.

## 7. Technical architecture and implementation approach

Keep the current browser-based Three.js architecture as the initial platform. Design interaction and spatial concepts so they can evolve toward VR later, but do not make VR a launch dependency.

Build new capabilities as modular systems with clear interfaces. Candidate module boundaries (proposed, not existing files):
- `identity/`: player account and profile.
- `career/`: career catalog, profile, progression, learning missions.
- `opportunities/`: campaign board, applications, task workflow, verification/moderation.
- `reputation/`: activity ledger and reputation service.
- `residential/`: villa entitlements, assignment, activity/leave, recovery, waiting list.
- `sponsorship/`: authorized placements and campaign management, later phase.

Use a secure backend for accounts, persistent profiles, task records, reputation events, villa entitlements, and customizations. Do not trust browser storage or client-side code for account identity, allocation, reputation awards, approvals, or transfers. Use server-side validation, access controls, audit logs, backups, and privacy-aware data handling.

The game client should present the systems and send permitted actions; it should not be the authority for scarce entitlements or consequential records.

## 8. Recommended development sequence

1. **Planning and protection:** document interfaces, constraints, dependencies, and acceptance tests. Back up and inspect relevant existing code before changes.
2. **Storyline prototype:** implement/validate the visitor path using the existing city and bounded HERO triggers.
3. **Profile foundation:** guest vs registered creator identity; saved work requires registration; privacy by default.
4. **Career profile and learning missions:** start with Recording Artist and one other path only after the first is proven.
5. **Artist Release Campaign pilot:** complete create -> apply -> select -> deliver -> review -> verify workflow with test data.
6. **Reputation ledger and HUD integration:** connect verified events; reuse existing HUD where possible.
7. **Villa entitlement prototype:** account-bound assignment, customization persistence, spawn location, founding allocation ledger, waiting list, recovery/leave rules.
8. **Real opportunities and safety controls:** moderation, consent, reporting, payment terms where applicable.
9. **Sponsorship readiness:** audience/engagement metrics, approved placements, sponsor permissions and disclosure.
10. **Scale additional careers, neighborhoods, social visits, watercraft, and future VR only as validated priorities.

### First end-to-end milestone

One registered artist creates a campaign for an actual release; another registered player applies, is selected, completes an agreed task, receives artist confirmation, and has the verified contribution reflected in their profile/reputation. Test this in isolation before connecting it to the live world or villa eligibility.

## 9. Open decisions — not yet settled

1. Are founding villa rights transferable/sellable, and under what restrictions?
2. What exact inactivity threshold, notice sequence, leave allowance, and recovery window should apply? The 90-day checkpoint is a proposal, not a final rule.
3. What verification method and anti-abuse standard qualifies someone for the first 300?
4. What happens to a founding resident's original villa and customization if their entitlement is legitimately released?
5. Which creator tasks are educational, volunteer, or paid, and what protections apply?
6. Which career paths follow Recording Artist in the first release?
7. What is the initial backend/account provider and data-retention policy?
8. What sponsor placements and brand permissions are available only after formal agreements?

## 10. Change-control requirements

- Treat this document as a planning blueprint, not authorization to implement every listed feature.
- Inspect existing files and working behavior before proposing edits.
- Preserve current Floor 2 save/load and other confirmed working systems.
- Keep intentional gates and access restrictions distinct from defects.
- Use isolated branches and tests for new systems.
- Do not modify the live deployment, merge, or deploy without explicit user approval.
- Report what was inspected, what changed, what was tested, and what remains unverified.


## 11. Founder-led proof of concept: HERO as the first artist

The project owner intends to use their own artist activity as the first real-world example for the Career & Opportunity System. The first pilot should use the existing **LAMBO CITY VOL 1** release by **HERO**, distributed through CD Baby.

This is a founder-led demonstration, not a claim that CD Baby or ASCAP has sponsored or endorsed LAMBO CITY.

### Artist case study

- Create the first artist career profile around HERO.
- Use LAMBO CITY VOL 1 as the first release campaign.
- Record the real release metadata and authorized artwork/links.
- Build a sample campaign with promotional tasks such as street-team participation, approved social promotion, creative assets, and a listening event.
- Track applications, deliverables, review, and verified outcomes.
- Show how an independent artist can use the system to organize a release and collaborate with other creators.

### LAMBO CITY Radio and music-rights proof of concept

The project owner also intends to use LAMBO CITY Radio as a practical example of music usage and rights administration. The owner plans to submit the appropriate licensing and playlist information to ASCAP and use actual royalty statements/payments received as evidence of the process.

Important separation:
- The game can teach how music usage, cue sheets/playlist reporting where applicable, registrations, licensing, and royalties work.
- The system must not assume that radio playback automatically creates an ASCAP payment. Eligibility, reporting requirements, repertoire data, licensing arrangements, and payment timing must be verified with ASCAP and the relevant rights holders.
- Any financial amounts displayed as real-world royalties must come from documented statements or payment records and be labeled with the reporting period and source.
- Simulated examples and in-game rewards must be clearly distinguished from actual royalty income.
- Do not claim an ASCAP integration or sponsor relationship unless one is formally established. Start with a manually documented case study using records the owner is authorized to share; protect private financial and account information.

### First implementation milestone

Build the HERO artist profile and LAMBO CITY VOL 1 release campaign as the first controlled proof of concept. Keep the ASCAP / LAMBO CITY Radio royalty case study as a separate evidence-backed module so the campaign workflow can be tested without waiting for royalty processing.

