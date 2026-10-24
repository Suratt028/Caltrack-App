# Dependency audit status

Last checked: 2026-10-20 (`npm audit --omit=dev`): **0 critical, 0 moderate, 15 high**.
It was 28 before (2 critical, 16 high, 10 moderate).

## What was fixed

- `express` 4.22.2 → 4.22.3 (stays on Express 4; pulls `qs` 6.16.x). `npm audit fix` then
  bumped `body-parser` 1.20.8 and `proxy-addr` 2.0.8 (critical), and `shell-quote` 1.12.0
  (critical, via `react-native` → `react-devtools-core`).
- Expo SDK 57 patch alignment via `npx expo install`: `expo` ~57.0.30, `expo-image-picker` ~57.0.20.
- `uuid` (moderate, via `@expo/config-plugins` → `xcode`) forced to `^11.1.1` with an npm
  `overrides` entry. `xcode` only calls `require('uuid').v4()`, which uuid 11 still exposes in CommonJS.

## Remaining (no upstream fix yet)

All 15 remaining "high" entries are two root advisories propagated up the Expo/Metro tooling tree:

| Package | Advisory | Path | Why it stays |
| --- | --- | --- | --- |
| `braces` ≤3.0.3 | GHSA-vfj7-8cjw-p6xm (DoS on deeply nested glob patterns) | `metro-file-map` / `@expo/metro-file-map` → `micromatch` → `braces` | 3.0.3 is the latest release; no patched version exists. Only dev tooling (Metro file watching) uses it, on patterns the project controls. |
| `node-forge` ≤1.4.0 | GHSA-86w9-cpqp-85rv (lax RSA PKCS#1 v1.5 signature parsing) | `@expo/cli`, `@expo/code-signing-certificates` | 1.4.0 is the latest release; no patched version exists. Used by the Expo CLI for dev code signing, not by the app or server at runtime. |

`npm audit fix --force` offers `expo@44` / `react-native@0.72` to "fix" these: that is a
major downgrade that would break the app, so it must not be run. Re-run `npm audit --omit=dev`
when braces or node-forge publish a fix, or on the next Expo SDK upgrade.
