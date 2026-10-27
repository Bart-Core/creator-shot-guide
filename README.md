# Creator Shot Guide — Reveal Rehearsal

Plan a reveal before filming it. Place camera endpoints and an independent look-at target, rehearse timing, keep an immutable reference and compare a changed plan.

**[Watch the actual 94-second Preview demo](https://youtu.be/cvHd_nS7T4o).**

## Who and why
For creators planning a detail-to-subject reveal. Bartzilla's miniature-to-monument footage inspired a spatial decision loop: move, look, time, compare. Camera targeting and previsualisation are established techniques; we do not claim to have invented them.

## Use
EDIT: drag A/B/TARGET and set timing. FRAME: choose illustrative zoom intent. COMPARE: save a reference, change the plan and replay reference/current. REFINE returns to planning; CANCEL is not a completed rehearsal. A one-second gesture lock prevents duplicate UI releases.

## Project and dependencies
Tested in Lens Studio 5.23.2.26081320. Open CreatorShotGuide.esproj after restoring dependencies. This repository contains project files, source, scene and planning documents, **not a self-contained SDK distribution**. Snap binary packages are intentionally not redistributed under an assumed licence.

Obtain the six named packages in dependencies.json from Lens Studio's official Asset Library. A local project with the exact tested packages can be used with `python restore_dependencies.py PATH_TO_ITS_PACKAGES`. The helper checks every package SHA-256 before copying and preserves the supplied asset metadata. No network, installation, signing keys or credentials are accessed. Different package versions are not claimed compatible. Lens Studio generates its own local signing material when needed.

## Verification
Run Node 22.18+ (or compatible TypeScript stripping):
```
node test_film_math_independent.mjs
node test_comparison_independent.mjs
node test_comparison_invalid.mjs
```
The 62 logic assertions test calculations, snapshots and invalid inputs. Separately, 49 native Preview assertions passed on the tested working project, including genuine marker drag, button actions, reference/current replay and cancellation. Native Preview checks are not LEAF scenarios. No LEAF pass is claimed. Earlier failed interaction tests led to the gesture lock; successful command transport alone was insufficient.

## Honest boundaries
Preview only; no hardware field evaluation. Framing is a labelled synthetic illustration, not a phone feed. No phone tracking/control, obstacle detection, scene recognition, persistent world anchors or filming. Headset comfort and improved real filming remain unproven. Reference plans last for the session. Do not walk backwards using this prototype as a safety guide.

## Attribution
Bartzilla / BART-CORE, AI-assisted development using Codex, CLAD and Lens Studio MCP. Spectacles Interaction Kit/UIKit are Snap components. See THIRD_PARTY.md. Planning and provenance are in devpost/.
