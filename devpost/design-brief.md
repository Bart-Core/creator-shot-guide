---
status: draft
concept_approved: true
---

# Design brief: Creator Shot Guide — Reveal Rehearsal

## Provenance
Bartzilla selected the deliberate detail-to-monument reveal and requested
movement, time, zoom and perspective. He then explicitly approved the film
concept and commissioned implementation. The detailed defaults below are agent
decisions under that delegation, not invented interview answers. This document
itself has not yet received a separate personal review. Earlier v0.3 work is
a pre-brief prototype, not a build produced from an already approved brief.

## The one spatial moment
Before filming a small detail opening into a larger subject, a creator rehearses
where the camera moves, where it looks and when the reveal should land.
Spatial planning references support intentional filming, not automatic capture.

## Why it belongs on glasses
- Uses: draws planning references in the world and keeps eyes on the subject.
- Intended benefit: less switching between phone notes and the intended shot.
- The current laptop Preview proves interaction logic, not real-device benefit.

## Product or overlay
- Type: spatial planning tool with manually placed references (default).
- Sensing: no recognition, filming or measurement of a connected camera.
- Preview stand-in: explicitly labelled synthetic scene and virtual camera.
  A camera-view simulation is not a live phone view or calibrated composition.

## Where things live
- CAMERA A/B: separate planned camera endpoints in the rehearsal area (default).
- TARGET: independent intended look-at point, never conflated with camera path.
- Main controls: about 1m ahead, slightly below eye level; large targets (default).
- Virtual camera cue and phase indicator: near the planned path (default).
- Any simulation inset: clearly labelled SIMULATION; never presented as actual
  device framing. Exact layout dimensions remain implementation defaults.

## Hands and input
- Pinch/grab/drag to place CAMERA A/B and TARGET (default).
- Large standard SIK/UIKit buttons for timing, plan/probe/refine/cancel (default).
- Targets highlight when aimed at; no custom hand gestures or voice required.
- Phone operation is separate. Hands-free actual filming is not claimed.

## When things show
- Planning exposes placement and timing; rehearsal reduces editing controls.
- During rehearsal show phase/cue and retain cancel (default).
- Refinement preserves in-session geometry and changes one parameter at a time.
- Out-of-view warning is not obstacle detection or a safe walking instruction.

## Done criteria
1. CAMERA A/B and TARGET move independently with genuine Preview interactions.
2. A finite start-hold/movement/end-hold sequence preserves endpoints and
   distinguishes cancellation from completion. Defaults:1s/5s/1.5s.
3. A camera-position change is distinct from look direction and zoom intent;
   zoom never claims control of an actual lens. Default zoom is constant.
4. Refinement retains geometry and exposes the changed timing/zoom plan.
5. Degenerate geometry and invalid timing do not produce NaN, a crash or a
   false success. Actual test coverage and missing coverage are reported.

## Out of scope
- Actual phone control, calibrated framing, autofocus, camera/scene recognition.
- Automatic shot scores, persistent anchors, recording/identifying people.
- Safe-route guarantees, obstacle detection, proof of better audience metrics.
- Automatic dolly-zoom coordination or claims of world-first novelty.

## Risks and open questions
- Brille pose is not phone pose: camera cues are plans, not tracked phone data.
- Real headset readability, hand tracking and comfort: feel unproven.
- Spatial zoom demonstration must use a labelled synthetic scene or remain
  manual direction; it cannot masquerade as a tested real-camera feature.
- Lens Studio5.23.2 compatibility copy is the working target; preserve original.
- Fresh tests must prove new criteria; historical v0.3 assertions are not enough.

## Build notes for CLAD
- Build for SPECS so it runs and can be demonstrated in Lens Studio's preview. No SPECS device is available.
- Use Spectacles Interaction Kit (SIK) and UI Kit for all interactions, so they work with the mouse in Interactive Preview and with LEAF.
- Build any stand-in exactly as described above, and keep it obvious in the scene.
- Use real-world scale in centimeters. Keep content inside the user's view during the main task.
- The display is additive: black renders as transparent. Don't rely on black or very dark content to be seen; keep text light and readable from where the user stands.
- Get the basic flow working first, then add detail.
- Write LEAF scenarios for each done criterion, run them in preview, and report which pass. Say which criteria have no test.
- Don't record, identify, or follow people.

## After the build: judge it
This part is for you, after CLAD finishes.

1. **Does it work?** Ask your agent which LEAF tests passed and which done criteria have no test.
2. **Walk around it.** Open the preview in Interactive Preview. Use WASD to move, Q and E to go down and up, and right-drag (or hold Shift) to look around. Clicking acts as a pinch. Stand where a user would and look at the task.
3. **Ask the three questions.**
   - Does it use what I'm looking at?
   - Does it put something in my space, where it belongs?
   - Does it free my hands or let me keep my eyes up?
   - Would it be just as good on a phone? If so, what would make it need the glasses?
4. **Check comfort.**
   - Everything I need is in view while I do the task. Nothing sits at the edges, behind me, or stuck to my face.
   - Every control is within reach of someone standing there.
   - Text reads easily from where I stand. No dark UI disappearing.
   - Things show when needed and get out of the way.
5. **Label what you know.** Write "logic proven" next to anything the tests and preview show working, and "feel unproven" next to anything only real glasses could tell you (comfort over time, real hand tracking, real recognition).
6. **Fix with design notes, not code.** Tell your agent what to change in design terms, for example: "Move the step card 15 cm lower and next to the pan. Make the Next button twice as big. Re-run the tests." If a fix takes under a minute, like nudging a panel, do it yourself in the scene.
7. **Submit.** Record a video under 3 minutes of your Lens in the preview, public on YouTube. Make your repo public with your Lens Studio project and this `devpost/` folder. Details are on the hackathon site: https://learn-specs.devpost.com/resources
