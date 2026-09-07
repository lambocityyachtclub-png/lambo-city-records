# LAMBO CITY — NORTH STAR

## What This File Is

This document is the guiding vision for LAMBO CITY.

It is NOT a replacement for the existing codebase.

It is NOT a request to rebuild the world.

It exists to keep future development focused on finishing, connecting, and polishing the world that already exists.

---

# 1. THE VISION

LAMBO CITY is a cinematic digital destination built around:

- Music
- Luxury
- Cars
- Waterfront life
- Entertainment
- Nightlife
- VIP experiences
- HERO
- LAMBO CITY Records
- The LAMBO CITY Yacht Club

The goal is for a visitor to enter the website and feel like they have entered an actual destination.

The world should feel:

- Complete
- Connected
- Intentional
- Luxurious
- Cinematic
- Alive
- Easy to understand

LAMBO CITY should feel BUILT, not assembled.

---

# 2. THE CURRENT WORLD IS THE FOUNDATION

The existing world is valuable.

Existing buildings, environments, lighting, jumbotron elements, stage elements, marina elements, yacht elements, stores, headquarters, and other systems should NOT be recreated simply because a new feature is being added.

Before changing anything:

1. Inspect the existing implementation.
2. Identify what already exists.
3. Determine what is actually unfinished.
4. Modify only what is necessary.
5. Preserve working systems.

If something already exists and works, leave it alone unless there is a specific reason to improve it.

---

# 3. CURRENT PRIORITY

The current objective is NOT to endlessly add more features.

The objective is:

## MAKE THE EXISTING WORLD MAKE SENSE.

The primary focus is:

### A. MAP FLOW

The player should be able to naturally understand how the different areas connect.

Look for:

- Dead ends
- Confusing paths
- Areas that feel disconnected
- Buildings that feel randomly placed
- Waterfront areas that don't connect naturally
- Places where the player doesn't know where to go next
- Unnecessary empty spaces
- Awkward transitions between districts

The solution should generally be to improve the surrounding map/circulation rather than rebuilding established landmarks.

---

# 4. FINISH WHAT ALREADY EXISTS

After the map flow makes sense, the next goal is to make the existing destinations feel finished.

Important destinations include:

- LAMBO CITY Records Headquarters
- Marina
- Yacht Club
- Dock
- Waterfront
- Existing Yacht
- Boardwalk
- Stores
- VIP areas
- Jet Ski / water activity area
- Grand Stage
- Jumbotron
- HERO performance environment

These areas should feel like intentional destinations.

The goal is NOT to replace them.

The goal is to finish their surroundings, connections, presentation, and atmosphere.

---

# 5. THE WATERFRONT

The waterfront should become one of the strongest areas of LAMBO CITY.

The existing yacht, dock, marina, and waterfront elements should remain the foundation.

Improve:

- Pedestrian circulation
- Boardwalk connections
- Dock access
- Arrival areas
- Waterfront transitions
- Connections between the Yacht Club and other destinations
- Connections between VIP areas and the water
- Overall sense of place

The waterfront should feel like a luxury destination rather than a collection of separate objects.

---

# 6. LAMBO CITY RECORDS HEADQUARTERS

The Records Headquarters is an established landmark.

Do not casually move or replace it.

The objective is to make the HQ area feel finished through:

- Proper surrounding space
- Arrival experience
- Walkability
- Landscaping
- Lighting where needed
- Signage where needed
- Connections to the rest of the city

Do not add unnecessary features simply because they are possible.

---

# 7. THE GRAND STAGE

The Grand Stage is a major destination.

The existing stage, jumbotron, lighting, and other stage systems should be inspected before adding anything.

If these systems already exist, DO NOT recreate them.

The goal is to complete the experience around them.

The final experience should allow the player to approach the Grand Stage and feel that something is happening there.

The long-term centerpiece is:

# HERO PERFORMANCE

HERO should eventually be able to perform on the Grand Stage.

The performance experience may include:

- HERO entering the stage
- HERO performing
- Music activation
- Stage lighting
- Jumbotron/video presentation
- Movement/dance
- Audience/crowd atmosphere
- Cinematic presentation

The exact implementation should use the existing systems wherever possible.

The performance should feel like an EVENT.

---

# 8. EXISTING SYSTEMS MUST BE CHECKED BEFORE BUILDING

The following types of systems may already exist:

- Lighting
- Jumbotron
- Stage lighting
- Stage video
- Stage audio
- Stage media
- Marina
- Yacht
- Dock
- HQ
- Collision
- Player movement
- HUD
- Music
- NPCs
- Environmental effects

Never assume a system does not exist.

Always inspect the repository first.

If a system exists:

### USE IT.

If it works:

### PRESERVE IT.

If it needs improvement:

### IMPROVE IT WITHOUT UNNECESSARY REWRITES.

---

# 9. DEVELOPMENT PHILOSOPHY

## EXPAND FIRST. DETAIL SECOND. POLISH LAST.

But for the current stage of LAMBO CITY:

## CONNECT FIRST. FINISH SECOND. POLISH THIRD.

The world does not need to become dramatically bigger right now.

It needs to become more coherent.

A smaller world that feels complete is better than a huge world that feels unfinished.

---

# 10. DO NOT OVERBUILD

Do not add systems just because they sound impressive.

Do not introduce:

- Multiplayer
- Accounts
- Backend infrastructure
- Cryptocurrency
- Wallets
- Complex economy systems
- Large unnecessary gameplay systems

unless explicitly requested for a future milestone.

The current priority is the immersive single-player world.

---

# 11. TECHNOLOGY

LAMBO CITY currently uses:

- Three.js
- Pure JavaScript
- HTML/CSS where appropriate
- Modular JavaScript systems

Do not introduce:

- React
- TypeScript
- A new framework
- A bundler
- A new architecture

unless explicitly approved.

The existing architecture should be preserved.

---

# 12. PERFORMANCE

LAMBO CITY must remain enjoyable on:

- Desktop
- iPad
- Mobile

Performance matters.

When improving visuals:

- Prefer efficient geometry
- Reuse materials and geometries when appropriate
- Avoid unnecessary lights
- Avoid unnecessary particles
- Avoid duplicating expensive systems
- Consider Safari performance
- Keep the world visually rich without making it unnecessarily heavy

Do not sacrifice the identity of the world simply to optimize it.

---

# 13. LANDMARK PROTECTION

Established landmarks should be treated as protected unless explicitly approved for movement or replacement.

Important protected elements include:

- Existing Records HQ
- Existing Yacht
- Existing Yacht Club
- Existing Dock
- Existing Marina
- Existing Stores
- Existing Grand Stage
- Existing Jumbotron
- Existing Stage systems
- Existing street/map foundation

If the map doesn't make sense around an established landmark:

## Fix the surrounding map first.

Do not automatically move the landmark.

---

# 14. MAP CIRCULATION

The player experience should generally feel like a journey.

A visitor should be able to move naturally between:

CITY
↓
BOARDWALK / STORES
↓
MARINA
↓
YACHT CLUB / DOCK
↓
YACHT / WATERFRONT
↓
VIP WATERFRONT AREAS
↓
WATER ACTIVITY
↓
GRAND STAGE / ENTERTAINMENT
↓
HERO PERFORMANCE

This is a guideline, not a requirement to force every area into a straight line.

The important thing is that the world feels connected and intentional.

---

# 15. THE RULE FOR NEW FEATURES

Before adding a new feature, ask:

1. Does this already exist?
2. Is it actually necessary?
3. Where does it belong?
4. Does it improve player circulation?
5. Does it improve immersion?
6. Can the existing system accomplish it?
7. Will it negatively affect performance?
8. Will it disturb an established landmark?

If the answer is unclear:

STOP AND INSPECT FIRST.

---

# 16. AI / DEVELOPMENT WORKFLOW

ChatGPT's role:

## ARCHITECT / CREATIVE DIRECTOR / REVIEWER

ChatGPT helps with:

- Overall vision
- World design
- Map flow
- Architecture
- System relationships
- Roadmap
- Debugging strategy
- Code review
- Protecting the project's direction

Claude's role:

## IMPLEMENTATION ENGINEER

Claude can help with:

- Writing code
- Modifying files
- Implementing approved features
- Testing changes
- Making focused commits

The human owner of LAMBO CITY makes the final decisions.

---

# 17. STANDARD WORKFLOW

Before making a meaningful change:

## INSPECT
Read the relevant files.

## UNDERSTAND
Determine what already exists.

## PLAN
Decide the smallest change that solves the problem.

## IMPLEMENT
Make the change.

## TEST
Verify existing functionality still works.

## REVIEW
Confirm that the change supports the North Star.

## COMMIT
Use a focused commit message.

---

# 18. THE MOST IMPORTANT RULE

## DO NOT REBUILD WHAT ALREADY WORKS.

LAMBO CITY has already been built through many iterations.

The objective now is to bring the existing world together.

If something is already good:

LEAVE IT GOOD.

If something is unfinished:

FINISH IT.

If something is disconnected:

CONNECT IT.

If something creates a dead end:

FIX THE FLOW.

If something is visually unfinished:

POLISH IT.

If something is unnecessary:

DO NOT ADD IT.

---

# 19. DEFINITION OF A SUCCESSFUL VERSION 1

Version 1 does NOT need to contain everything imaginable.

Version 1 succeeds when a visitor can:

1. Enter LAMBO CITY.
2. Understand where they are.
3. Explore naturally.
4. Move between major destinations without confusing dead ends.
5. Discover the waterfront.
6. Experience the Yacht Club environment.
7. Explore the Records/HQ area.
8. Discover the Grand Stage.
9. Experience the HERO performance.
10. Leave feeling like they visited a real digital destination.

The world should feel cohesive rather than feature-heavy.

---

# 20. FINAL NORTH STAR

LAMBO CITY IS NOT ABOUT ADDING EVERYTHING.

LAMBO CITY IS ABOUT MAKING WHAT ALREADY EXISTS FEEL REAL.

Protect the foundation.

Connect the world.

Finish the landmarks.

Make the journey make sense.

Make HERO's performance feel like a real event.

Polish what matters.

Do not build for the sake of building.

## THE GOAL:

# MAKE LAMBO CITY FEEL COMPLETE.
