# XXVIII · Parallax

> The stars stay still. Move yourself, and the universe seems to move.

Parallax is a small, browser-local observatory about distance inferred from two points of view.

Three fixed beacons have different depths. The warm near light moves dramatically as the visitor moves sideways; the cold distant light hardly shifts. None of the beacons move in world space.

## The experiment

Move horizontally across the scene. Tap or click once to record observation A. Move to a different part of the observer rail and tap or click again to record B. The room retains both sightings, connects them with dotted displacement tracks, and shows a measured pixel shift and reconstructed distance for each beacon.

A third tap starts a new pair of observations. A very short baseline is rejected because it would produce an unhelpful measurement.

The background dust also follows the same parallax projection, but only the three foreground beacons are measured.

## The actual rule

The projected horizontal coordinate of a fixed light is

    screenX = screenX0 - focal * observer / depth

For a pair of observations, the signed pixel disparity is

    disparity = -focal * (observerB - observerA) / depth

Therefore the room reconstructs the distance by inversion:

    depth = abs(focal * baseline / disparity)

The readouts are calculated from the two rendered positions rather than secretly populated with the source depths. Depth units are arbitrary world units, and the scene is intentionally an ideal pinhole model: no noise or lens distortions.

## Controls

- Move horizontally: change your observer position and watch apparent shift.
- Click/tap: capture A; click/tap from a different viewpoint for B; click again to restart.
- Space: capture the current viewpoint (including with keyboard-based stage navigation).
- R: reset both observations.
- Esc: return to the Atrium.

## Implementation and care

The room uses one Canvas 2D stage and the existing navigation shell. A deterministic set of background lights, three fixed beacons, and two optional observation markers are enough; there are no textures, external requests, or new dependencies.

It follows Solarium's shared reduced-motion and visibility handling. Observations reset upon re-entry, and short baselines are excluded.

## Why it follows Holonomy

Holonomy showed that returning to the same place need not return the same orientation.

Parallax reverses the emphasis: a stationary thing can appear to change just because the observer changes place.

Sometimes motion belongs to the witness.

[← Room Atlas](./README.md)
