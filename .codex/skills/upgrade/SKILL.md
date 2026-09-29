---
name: upgrade
description: "Upgrade exactly one named unit in the Miragine project with two switchable running poses, three distinct attack methods, and at least one polished cinematic signature effect."
---

# Unit upgrade

Use this skill only when the user names one unit to upgrade. One invocation handles one unit and stops after that unit is ready for review; never continue automatically to another unit.

## Scope

- Work from `D:\milaqi` and keep all generated files, builds, screenshots, and temporary data on D:.
- Preserve the named unit's gameplay contract by default: price, supply, HP, armor, damage, attack interval, movement speed, range, counters, AI behavior, and faction skin palette stay unchanged unless the user explicitly asks for a balance change.
- Shared helper edits are allowed only when they are required by the named unit and do not alter another unit's appearance or behavior. Avoid broad renderer or sprite refactors.
- If no unit is named, ask for its exact in-game name or id before editing. Do not infer a target from context.

## Required result for the named unit

1. **Two running poses.** Implement two visibly different run silhouettes or weapon rhythms (for example, a compact sprint and a longer stride). The unit must be able to switch between them while already running, without teleporting, resetting its position, or interrupting the battle. The switch may be phase-based or state-based, but it must be observable in a normal playthrough.
2. **Three attack methods.** Add three visually and mechanically timed attack presentations for the same unit. They may be alternate forms of the unit's existing attack, but each must have a distinct motion, projectile, weapon path, or impact shape. Select them deterministically or randomly per attack and keep all three on the existing attack cadence unless the user requests balance changes.
3. **One signature effect.** At least one of the three attacks must have a polished, high-end cinematic effect: a deliberate anticipation or charge-up, layered motion or trajectory treatment, a readable impact reaction, and a short aftermath such as particles, fragments, rings, smoke, or light. Color should support the faction identity, but color intensity alone is never sufficient. It must remain legible when several units overlap and must fade cleanly rather than leaving permanent canvas artifacts.
4. **Faction compatibility.** The effect and model must work for both sides and all six faction skins. Use the unit's existing faction palette as the base, then add a contrasting highlight; do not hard-code only the red side.
5. **Existing combat rules.** Ranged units must still keep their distance, melee units must still reach the engagement line, and the upgrade must not create new target-selection or collision behavior.

## Recommended implementation path

1. Inspect the unit record in `src/units.js`, its visual id in `src/sprites.js`, its attack-effect selection in `src/engine.js`, and its effect branch in `src/render.js` before editing.
2. Add the two run poses to the named unit's sprite path. Keep the pose selection in the unit's existing run animation state so idle, attack, corpse, and faction-skin rendering continue to work.
3. Give the three attacks separate effect variants. Store only the variant on the effect event; do not duplicate damage calculations or create a second combat hit.
4. Render the signature effect with bounded alpha, a clear start-to-impact progression, layered motion and impact feedback, and a `save()`/`restore()` pair. Any temporary canvas state such as line dashes, shadows, transforms, and composite mode must be restored.
5. Add or update a focused test for the named unit's three effect variants and run-pose metadata where practical. Use `node scripts/visual-review.mjs` for sprite/performance regression and inspect a real battle screenshot.

## Completion checks

Before reporting completion, verify all of the following:

- Only the specified unit's model/effect code and directly necessary shared helpers changed.
- A running unit can visibly change from pose A to pose B before reaching combat.
- Three attacks can be observed over repeated attacks; the signature effect is obvious at normal zoom.
- Faction 0 and faction 1 both render correctly.
- `npm.cmd test` passes with no balance or combat regressions.
- `node scripts/visual-review.mjs` passes.
- `npm.cmd run build` succeeds, and `node scripts/smoke.mjs --packaged` passes when a packaged build is required.
- Commit the one-unit change and create a version tag only after validation. Report the exact executable path and stop for user inspection; do not start the next unit.
