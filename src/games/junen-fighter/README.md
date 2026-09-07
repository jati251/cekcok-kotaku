# Junen: Last Stand

Launch **Junen: Last Stand** from the existing arcade launcher. This is a standalone Three.js combat slice inspired by the supplied Jl. H. Junen photographs. It uses original procedural geometry and materials; no Street View screenshots, Sleeping Dogs assets, or remote asset requests are included.

## Play

- WASD / arrows: move; Shift: sprint.
- J / left mouse: three-hit punch sequence. K: heavy kick.
- E: counter. Press during the final 0.42 seconds of an enemy's amber warning, when the marker grows. An early counter only reduces incoming damage.
- Space: dodge in the movement/facing direction, with invulnerability during the dodge.
- Hold right mouse: orbit camera; Q: look around. The camera returns behind the street direction when released.
- P: pause/resume; Escape: return to the launcher.
- Touch devices show movement and combat buttons.

Walk toward the orange water tank, turquoise house, and pink house. Each encounter has three opponents. Defeating a group restores 25 health. Stamina regenerates, but strikes, kicks, sprinting, counters, and dodges consume it. The final encounter ends with a score and replay screen; losing all health offers a retry.

## Rendering

`neighborhood.ts` defines fourteen individually placed properties and the tank-side junction, with source-photo numbers and estimated dimensions. `world.ts` builds their separate facades, roofs, fences, carports, porch objects, trees, utilities and drains. Static objects are merged by material to limit draw calls. Canvas textures provide surface grain and bump; foliage and shallow puddles use animated shaders. Lighting uses an environment map, hemisphere fill, a moving directional shadow region, a procedural cloud sky, and distance fog.

The cinematic pipeline uses SSAO, restrained bloom, ACES tone mapping, edge shading, damage tint, and film grain. Balanced disables SSAO and caps pixel ratio at 1. All geometry, textures, render targets, audio contexts, and event listeners are disposed on exit. Hidden tabs and focus loss pause combat.

The lane now uses an estimated 2.9 m paved width, with movement and camera limits matched to the narrower street and side junction. Landmark encounters are beside their corresponding buildings. **Inspect map from photo viewpoints** opens eight fixed reference views without characters. The minimap includes the side junction.

Exact dimensions and photorealism remain unverified and unfinished. Characters, buildings and materials are still procedural, and hidden geometry is estimated. See [REFERENCE-AUDIT.md](./REFERENCE-AUDIT.md) for the image-by-image correspondence, uncertainties and source data needed for a measured, photorealistic reconstruction.

## Checks

```sh
node --experimental-strip-types src/games/junen-fighter/combat.test.mjs
pnpm build
```

The Node test requires Node 22.6+ with type stripping. It checks movement bounds, pause, encounter spawning, single-hit windows, timed counters, dodge invulnerability, stamina gating, enemy attacks, loss, and a normal-input playthrough through all three encounters. Browser checks cover launcher integration, scene rendering, HUD, pause/resume, and quality selection. Native Tauri packaging is separate from the web build.
