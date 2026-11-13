# GlyphGrid

React Native / Expo spatial puzzle: rotate overlapping 2×2 tile groups to reconstruct a target. Includes 40 deterministic solvable levels, 3×3–5×5 boards, daily puzzles, undo/restart, local progress, hints and stars.

## Run
```sh
npm install
npm start
```
Original dependencies target **Expo SDK 53**. Use a compatible Expo Go version or development build; compatibility with the latest Expo Go is not asserted. iOS Simulator requires macOS/Xcode. Android requires an emulator or device.

## Engine validation
With Node.js 24+, no Expo installation is required for the pure engine tests:
```sh
node --test engine.test.mjs
```
Tests cover all 40 constructive solutions, rotation invariants, determinism, scoring, hints and invalid rotations. Mobile builds, device interaction and full typechecking remain separate validation work.

## Preservation and layout
Source files and assets are at the repository root; imports and asset paths were adjusted. `GlyphGrid-Original-Archive.zip` preserves the earlier project byte-for-byte. This version adds rotation validation and engine tests.

## Design and limits
- Scrambling a known goal guarantees a constructive solution.
- Par is the scramble length, not a proven shortest path.
- Hints greedily minimize mismatches; they are not a complete solver.
- Daily seeds use the local date. The original daily progress key is shared across dates.
- No accounts, ads, analytics, or online leaderboard.

Before store release, configure your app identifiers, review privacy/artwork, update dependencies as appropriate and test on physical devices. No store publication or adoption is claimed.

Interview extensions: a bounded BFS solver, admissible A* heuristic, date-specific progress, screen-reader tests and malformed-save recovery.

Recovered from the earlier GlyphGrid project and prepared with AI assistance. No historical commits or deployment claims have been invented.
