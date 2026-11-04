# PR #28 — restart vote validation

## Change type and scope

- [x] Feature: visible restart voting, exact gameplay pause/resume and room-specific policy.
- [x] Fixes required by this feature: themed popup styling, native localization, visible paused countdowns,
  public-room policy inspection, readable policy summaries and correctness-check regressions.
- Related PR: <https://github.com/moring-m/Stronghold-Protocol_Ko_Arca/pull/28>.
- Expected result: participants can recognize and answer a vote without losing game time or communication access.

## Sources and assumptions

The design basis is the user-approved PR discussion, not an undocumented official restart rule. Defaults, bounds,
eligibility and input confirmation are specified in [the contract](../design/restart-vote.md); revision history is in
[0.3.3k](../history/0.3.3.md). [ASSUMED]: no official combat behaviour is inferred or intentionally changed.
Operator kits are not modified, so the operator-specific Fidelity checklist does not apply.

`APP_VERSION` and the README badge advance from 0.3.3j1 to 0.3.3k, with update and integrated patch notes.
The package/lockfile/base version stays 0.3.3 because this is a letter-suffixed fork feature release; wire protocol
version stays 1. Commit messages use English without attribution trailers.

## Baseline and CI classification (2026-11-05)

- Latest fetched master: `c247041056720000154a70b0432a65d8346fa4e7`.
- Remote PR snapshot reviewed: `3ed47c1f7215b0d48147ada7d90f2827591f1013`.
- CI execution: <https://github.com/moring-m/Stronghold-Protocol_Ko_Arca/actions/runs/41848467764>.
- Local comparison: Windows, Node 24.19.0, identical locked runtime dependencies and generated vendor files.
- The same 333 files with actual CI code failures were run on separate, pinned master and PR checkouts:
  `node --test --test-concurrency=2 --test-timeout=180000 --test-reporter=<JSON reporter> <failed files>`.
  Environment: `CI=true`, `SP_E2E=0`, `SP_REAL_E2E=0`, `RENDER_E2E=0`, `NO_COLOR=1`.

| Classification | Result |
| --- | --- |
| Unique CI code-failure entries, normalized by file and test name | 1,448 |
| Same failing entry reproduced on both current master and original PR | 1,443 |
| CI failure reproduced only on the PR | 0 |
| Not reproduced locally | 5; remain unclassified, not claimed fixed |
| Master local cohort | 4,525 tests: 3,022 pass, 1,478 fail, 25 skip |
| Original PR local cohort | The same 4,525 / 3,022 / 1,478 / 25 |

These are test entries, not independent defects. Test-name matching establishes baseline failures; it does not
prove that every OS/Node combination has the same underlying cause. Windows path separators and TAP escaped `#`
are normalized before deduplication. [Machine-readable evidence](pr28-ci-classification.json) lists all 333 files,
case counts and the five unreproduced test names.

The final working tree was also rerun over the same cohort. One apparent additional deploy-fold assertion was
caused by an old working file retaining CRLF despite `eol=lf`. Its normalized bytes were exactly the committed
source; an LF checkout and isolated recheck returned the same failure set as master. No deploy-fold logic changed.

All four attached Actions jobs exceeded their existing 25-minute job limit. Logs also contain 180-second file
timeouts, recorded separately in the evidence. No CI timeout, concurrency, matrix, required check, test-discovery
or workflow policy was changed. A retry or larger timeout alone would not resolve the assertion failures.

## PR-specific problems corrected

| Finding | Correction and verification |
| --- | --- |
| Three additional arithmetic type errors in `shared/restartVote.js` | Convert normalized numeric policy fields with `Number`; typecheck returns to the same 23 baseline diagnostics |
| 31 additional lint errors in capture tools | Declare browser globals used only inside Puppeteer callbacks; full-tree error count returns to the same 229 baseline errors |
| Korean-only vote text and missing accessible translations | Native catalogs, named placeholders and scoped choice/unit context; regenerate Korean UI and language-pack hashes |
| Japanese DOM retranslation repeatedly adds whitespace around seconds | Explicit native-translation boundary for text and attributes; countdown/draft tip rendered once; real Chromium regression covers repeated mutations |
| Visible countdown still used wall time while gameplay was paused | Read `m.public.pausedAt` during the vote, preserving scaled timing; Chromium checks freeze and resume |
| Restart settings absent from public-room inspection | Map `restartSettings` to the numeric `restart` category; regression checks options, units and default omission |
| New metadata displayed as untranslated/raw numeric policy values | Localize rule text in game information, public-room inspection, results and records |

## Verification results and limits

| Check | Result |
| --- | --- |
| Focused vote/match-host/version/public-settings/Chromium regressions | 39 pass, 0 fail, including the native Japanese countdown regression |
| Four/eight-player strategy-complete five-second wait | Frozen during a vote; resumes the exact remaining duration |
| Real local four-player browser scenarios | Korean, English, Simplified Chinese and Japanese settings, selection, fast-click guard, confirmation and waiting verified |
| Responsive vote controls | 390×844, 320×640 and 844×390; chat, emotes and confirmation accessible |
| Full-tree lint | 229 baseline errors; no additional PR errors; warnings are not suppressed |
| Typecheck | 23 baseline errors; no additional PR errors |
| Native i18n source audit | 1,205 baseline findings reduced to 1,203; no added unwrapped/missing-English findings |
| Import boundaries | `node tools/check-imports.mjs --strict` passes |
| Whitespace | `git diff --check` passes |
| Full Golden corpus | Both checkouts report mismatches; CLI output is identical apart from elapsed time; no expectations regenerated |
| Full `npm run ci` / `npm test` success | Not established: current Actions attempts cancel, and the complete failed-file cohort still has baseline failures |

Commands used include `node --test test/version.test.js test/restart-vote.test.js test/lobby-restart-vote.test.js
test/match/restart-pause.test.js test/match/plugin-host.test.js test/ui/public-room-settings.test.js
test/ui/restart-vote-i18n.browser.test.js` with `SP_E2E=1`, the repository ESLint configuration, TypeScript
`--noEmit --checkJs -p jsconfig.json`, and `node tools/golden.mjs --jobs 1` on both checkouts. Core i18n and
documentation-consistency suites still have inherited failures; they are not represented as passes.

Local browser scenarios use one real Chromium browser plus automated participants and supported test-phase
commands. They do not establish multi-device Internet, physical mobile-device, network-instability or long-session
behaviour. Existing screenshots and the 28-theme composite are under `docs/images/restart-vote/`. Downloaded theme
payloads stay outside the game source tree. No native game assets, secrets or personal configuration are added.

The remote PR title/body and CI policy remain unchanged during this local preparation. This document supplies
the contribution-template verification/applicability details; it is not an edit to the remote PR description.
