Prepared competition copy, 27 October 2026. Publication is not competition submission.

Title: Creator Shot Guide — Reveal Rehearsal
Tagline: Plan the move. Keep a reference. Compare the reveal.

Inspiration
Bartzilla creates videos. In footage of a monument, his strongest shot began
on a miniature and pulled back to reveal the real structure. The important
creative decision happened during filming, before the edit. We asked how AR
could support that decision while keeping the creator's attention on the scene.

What it does
Creator Shot Guide separates where the planned camera moves from where it looks.
Place start, finish and target; choose holds and movement timing; rehearse the
sequence using a virtual cue. Save a reference, change a decision and compare
the plans without silently changing the reference. A labelled synthetic inset
illustrates framing intent, rather than pretending to show a connected phone.

Why this approach
The core is a creator's decision loop, not an automatic score. The tool makes
the changed decision explicit: a different endpoint, timing, pace or zoom intent.
Camera targeting and previsualisation have established precedents. Our project
explores their use in a small spatial rehearsal-and-comparison workflow.

How we built it
Lens Studio, TypeScript, CLAD, Spectacles Interaction Kit and UIKit. The design
evolved through Bartzilla's feedback and separate implementation and acceptance
checks. Pure calculation tests are kept separate from live Preview interactions
and visual review. Failed tests are retained, not replaced with success claims.

What we learned
A transport-level successful click need not cause the expected application
change. Our independent test exposed that distinction. We also replaced a dense
control wall with EDIT, FRAME and COMPARE pages and added a reference snapshot
that survives later changes by value.

Limitations and next steps
This is a stationary Preview-tested planning experience. It does not control
or track a phone camera, detect obstacles, recognise scenes or guarantee a better
film. Plans are in-session, not persistent anchors. Headset comfort and actual
creator benefit need field evaluation. The next useful trial would compare a
creator's planned and captured reveal while documenting whether the spatial
references helped, confused or distracted them.

Demo: https://youtu.be/cvHd_nS7T4o
Repository: https://github.com/Bart-Core/creator-shot-guide
Verified: 62 pure logic assertions and 49 native Preview assertions passed. No LEAF result or hardware trial claimed.
