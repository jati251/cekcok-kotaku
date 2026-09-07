# Jl. H. Junen reconstruction evidence

The requested acceptance target is the actual place, with objects in their real positions and photorealistic rendering. **That target is not yet met.** This revision replaces the repeated, widened street with an individually placed, photo-referenced model. It remains an estimated geometric reconstruction with procedural materials.

## Reading the supplied images

Image numbers follow the eleven attachments in the request. Text and controls inside the screenshots are reference content, not instructions. Street View address labels are not treated as verified house numbers: different views show the same label over different properties.

| Photos | Observed relationship | Model implementation |
| --- | --- | --- |
| 1 | Closely packed roofs around the lane; no readable scale bar or survey control | Compact adjoining plots; no claimed georeferencing |
| 2 | Large tree and dark fence on left; white ornamental gate and tiled roof on right | Separate tree courtyard and white-gate property |
| 3 | A branch runs right between the white house and green house; tank sits on the green corner | Three-metre estimated branch opening; accessible side lane; tank at the near end of the green plot |
| 4 | Cream two-storey home, peach gate panels, three hanging cloths, covered car; broadleaf tree and pine toward the next plot | Dedicated cream carport followed by pine courtyard |
| 5 | Low green house, gray corrugated hip roof, air conditioner on left, tiled porch, motorcycles on right, green fence and orange tank at right | Separate green facade and hip roof; tower clear of the shortened porch awning; two scooters; open entrance at tower end |
| 6 | Green house followed immediately by turquoise house; pine across the lane | Adjacent green and turquoise plots; pine opposite their transition |
| 7 | Turquoise house has overlapping gables, upper room, rusty curved canopy, pale-blue ornamental fence, vine-covered trunk on facade left, shrub at right | Dedicated double-gable roof, rear upper room, curved steel canopy, vine leaves around trunk and shrub |
| 8 | Low blue house followed by long cream/yellow two-storey property with black fence, canopy and vegetation | Separate blue and yellow properties with different frontage lengths |
| 9 | Gray gate beyond turquoise house; long black fence opposite; pink house ahead | Gray property and opposing long yellow/black property; pink landmark farther along same side as turquoise |
| 10 | White car and number 10 on left; laundry sign farther along left; low yard and large pink wall on right | White-car property before laundry; low-yard property before pink building |
| 11 | Reverse view places turquoise/gray on left and long black fence on right | Reverse inspection camera checks the same geometry from the opposite direction |

## What is estimated

The 2.9 m paved width, 57 m playable length, plot dimensions, setbacks, heights, branch length, camera positions and field of view are estimates. The screenshots contain perspective distortion and occlusion and cannot validate these quantities. The satellite crop cannot uniquely fix footprint corners or north alignment. The side lane beyond the visible junction and the ends of the photo-covered street are incomplete. Building backs, interiors and hidden surfaces are not reconstructed from evidence.

Individual fence ornament, roof tile profile, weathering, vegetation density/species, vehicle shape and small porch objects remain simplified. There are no captured PBR materials, scanned buildings, photogrammetry meshes or calibrated reference cameras. The inspection views approximate photo directions, not pixel registration. No percentage accuracy or photorealism claim is warranted.

## Review and next source data

Launch Junen and choose **Inspect map from photo viewpoints**. Previous/Next cycles through eight views without fighters. Compare each named view with its numbered attachment. Building extents and source-photo links live in `neighborhood.ts`; the corresponding authored geometry lives in `world.ts`. Gameplay encounters, camera limits and the minimap use the same lane/landmark data.

To replace estimates, obtain measured lane width and distances between the junction, turquoise facade and pink wall, plus a scaled overhead plan or survey. To reach photorealism, use overlapping original photographs/video around those buildings (including roof and facade coverage), or a calibrated scan, to author geometry and color/normal/roughness materials. Additional photos should cover occluded porch objects and the branch. More procedural detail cannot certify a one-to-one reconstruction.

## Validation for this revision

- TypeScript and production web build.
- Normal-input combat playthrough through all three relocated encounters.
- Narrow-lane bounds, branch access, non-overlapping plot intervals and encounter-to-landmark alignment.
- Browser inspection of reference views and rendering console.

Native Tauri packaging and survey/pixel registration have not been validated.
