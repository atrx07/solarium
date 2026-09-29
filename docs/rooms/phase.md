# XII · Phase

[← Room Atlas](./README.md)

**Medium:** coupled oscillators / synchronization  
**Introduced:** 010 / PHASE  
**Source:** [`src/rooms/phase.ts`](../../src/rooms/phase.ts)

Seventy-two clocks begin with different natural rhythms and phases.

None of them is appointed leader. Each one only feels the population's current average rhythm and, when the visitor comes near, a local pacemaker.

## Interaction

- Move the pointer near clocks to entrain nearby phases.
- Hold to raise global coupling strength and make agreement easier.
- Click to send a phase shock through the population.
- **Space** pauses/resumes the clocks.
- **R** reseeds the original phase spread.
- **Esc** returns to the Atrium.

## Under the hood

The room uses a Kuramoto-style mean-field model. Instead of comparing every oscillator with every other oscillator, the population is reduced each frame to a complex order parameter: a coherence magnitude and a mean phase.

Each oscillator advances from three influences:

1. its own natural frequency,
2. attraction toward the current mean phase, scaled by coherence and coupling strength,
3. optional local attraction toward the visitor's pointer-phase when the pointer is nearby.

The center hand is the live mean phase. The coherence percentage and thin bar near the bottom show how much the population currently agrees.

All oscillator positions, frequencies, and initial phases are deterministic. There is no remote data, backend, asset, or runtime dependency.

## Intent

Previous Solarium rooms explored collective motion, growth, chemistry, waves, optics, and chaos.

Phase explores something quieter: many independent clocks gradually discovering a shared **when**.
