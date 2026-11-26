# LAMBO CITY — ALIVE Social Presence & Creator Roadmap

**Status:** Product direction recorded; implementation not started.  
**Planning branch:** `planning/alive-social-creator-roadmap`  
**Separate active visual workstream:** `feature/convention-center-luxury-detail`

This document preserves the agreed direction so development can resume across separate conversations without treating planned features as completed code.

## Product structure

- **LAMBO CITY** is the main world, platform, player accounts, and social experience.
- **ALIVE** is the underlying character technology: persistent identity, memory, behavior, and responsive character interactions. It remains embedded in LAMBO CITY initially, while its architecture and ownership are kept suitable for possible future independent commercialization.
- **ALIVE Social Presence & Spatial Voice** is a feature inside LAMBO CITY, not a separate business.
- **LAMBO CITY Studio** remains the dedicated music-production environment. Its recording and effects chain must not be coupled to or degraded by live social voice.

## Creator identity and character-based broadcasting

The goal is to let people build an online presence through their LAMBO CITY character without requiring them to show their physical face or stream a face-camera feed.

Planned capabilities, to be designed and implemented in stages:

1. Persistent player-created character identity, appearance, and recognizable presence.
2. Character voice, animation, and in-world interactions.
3. In-world camera tools and cinematic scene capture.
4. Recording, editing, clips, and export.
5. Supported livestreaming and publishing workflows for destinations such as YouTube, Twitch, TikTok, and Instagram, subject to each platform's APIs, permissions, and policies.
6. Longer-term creator channels, shows, performances, events, audience interaction, and monetization.

Avatar-based streaming already exists in the wider industry. LAMBO CITY's opportunity is to integrate character identity, the explorable world, music creation, events, recording, and publishing into one connected experience. Do not claim the general concept is unprecedented.

## Social voice and presence

**Agreed default direction:** mutual friends can hear one another through proximity voice, with explicit controls and temporary invitations for other conversations.

Planned behavior:

- Proximity-based spatial audio: voices become clearer nearby and fade with distance.
- Mutual friendship is the default permission for player-to-player voice.
- Following someone alone does not automatically grant microphone access.
- Private mode, mute, block, report, and clear microphone permission controls.
- Temporary conversation invitations for people who are not mutual friends.
- Special in-world characters such as HERO may speak to players when story and proximity conditions permit.
- Ambient NPC voices are distinct from live player voice and should not create constant background noise.
- Voice connections should be managed efficiently; do not create an unbounded full-mesh connection between every player.

The social voice service should be architecturally separate from Studio recording. Browser microphone access, low-latency voice transport, spatial positioning, access control, moderation, and connection scaling need their own design and testing.

## Reputation and safety principles

Social reputation may reflect constructive participation, collaborations, performances, event attendance, and community contributions. Reputation must never silently override voice privacy or consent. Users retain control over who can hear them and when their microphone is active.

## Delivery order

1. Preserve this product direction and define account/identity dependencies.
2. Design character identity and permissions.
3. Design and prototype spatial voice with mutual-friend access, temporary invitations, and safety controls.
4. Integrate special-character voice behaviors through ALIVE without conflating NPC dialogue with player voice.
5. Add in-world recording and creator capture tools.
6. Add editing/export, then platform-specific livestream/publishing integrations.
7. Expand creator channels, events, and monetization only after the foundations are reliable.

## Engineering constraints

- Preserve the existing approved world layout, navigation, camera behavior, and working systems.
- Keep features modular and dependency-aware; do not load heavy creator or voice systems until needed.
- Prioritize smooth performance on iPad and desktop.
- Measure actual load time, frame rate, memory, and voice latency on target devices rather than assuming performance.
- Keep user consent and moderation controls explicit.
- Respect third-party platform APIs and terms; do not promise direct publishing or streaming until a supported integration is verified.
- Do not merge or deploy this planning branch without the user's review and approval.

## Competitive research

Study leading games, creator platforms, browser graphics, real-time communications, and AI character systems as research—not as assets or code to copy. Turn findings into evaluated proposals. Record what is verified, what is an inference, implementation cost, performance impact, and whether it creates a meaningful LAMBO CITY advantage.

## Current implementation status

- This file records product decisions and future direction only.
- No creator livestreaming, social spatial voice, or new ALIVE account/permission implementation is claimed as complete by this roadmap commit.
- The Convention Center is a separate workstream on `feature/convention-center-luxury-detail`.
- Keep the Convention Center as the immediate active development priority unless the user changes priorities.
