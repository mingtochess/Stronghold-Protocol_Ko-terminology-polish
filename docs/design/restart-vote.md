# Restart voting (Korean fork, v0.3.3k)

## Scope and design basis

This is an intentional room-management extension of the Korean fork, not an official game rule. Its basis is the
user-approved design for [PR #28](https://github.com/moring-m/Stronghold-Protocol_Ko_Arca/pull/28), confirmed through
2026-11-05: stop gameplay while voting, preserve communication, and let the host configure the room policy.
No combat values, RNG order, or official unit behaviour are changed.

The time limits, thresholds, cooldowns, quota and 150ms input guard below are product decisions for this extension,
not values inferred from official tables. [ASSUMED]: no undocumented official restart rule is asserted. Future
changes to these decisions must update this contract and name their design basis.

## Room policy

`shared/restartVote.js` derives policy from custom-extension values. Only custom rooms override it; ordinary and
augment rooms use the defaults. The host edits settings before starting, never during the game.

| Setting | Default | Allowed values |
| --- | --- | --- |
| Agreement | Unanimous | Unanimous or strictly more than half |
| Include eliminated players still in the room | Yes | Yes / no |
| Vote time limit | 45 seconds | 15–90 seconds |
| Room cooldown | 120 seconds | 0–3,600 seconds, from vote end |
| Requester's cooldown | 180 seconds | 0–3,600 seconds, from their request |
| Requests per person per game | 2 | 1–10; reset on the next game |

The requester automatically votes Yes. Bots and spectators are excluded. The threshold is `N` for unanimity or
`floor(N / 2) + 1` for majority: 3 of 4 or 5 of 8. The denominator counts eligible players, not submitted votes.
An eliminated player who leaves loses eligibility and any recorded vote; recompute the denominator and threshold.
A living eligible player leaving cancels the vote. Temporary disconnection is distinct from leaving the room.
Never pass with an empty electorate. Publish aggregate counts and the recipient's own answer, not other answers.

## Pause and resume contract

`server/restartVote.js` obtains `Match.beginRestartVote` before publishing a vote. Host proxies preserve this
ordering across workers/processes; concurrent requests cannot publish two votes. The vote deadline and request
cooldowns use wall time. Gameplay uses the paused match clock and tracked callbacks instead.

Freeze prep, event and augment choices, the strategy-complete five-second wait, server combat and client-authority
combat. Reject gameplay commands; preserve chat, emotes and permitted read-only communication. Hold in-flight
combat reports until resume rather than advancing settlement.

A rejected, expired or cancelled vote resumes the exact remaining duration by shifting deadlines and rescheduling
callbacks. A pause that existed before the vote remains in effect. A successful vote disposes the match and returns
participants to the same room, preserving seats, settings and chat while clearing ready state. Reject messages from
an older match/vote. Disconnection and solo pause controls must not bypass the restart pause or strand a completed vote.

## Presentation and input

The opaque panel uses the same `modal__box`, brackets, stripe, texture, frame and fonts as other themed popups. A
solid background colour sits below translucent theme gradients. The black veil remains 75% opaque with a 2px blur;
the existing chat and emote controls stay above it and remain in the keyboard focus cycle.

The cards are No / Yes (Korean: 반대 / 동의), with cross / check icons. The first click selects; a second click on
the same card confirms after at least 150ms. Faster clicks are ignored. Switching cards only selects and resets
the guard. Held keyboard repeats never confirm. There is no separate confirmation button. After submission,
show the confirmed answer and waiting status. Confirmed votes are immutable; timeout means the vote failed.

New text uses shared `t()` / `tc()`, Chinese source IDs, the Korean UI overlay, the English core catalog and the
Japanese fork catalog. Already localized regions use `data-i18n-native` so legacy DOM translation cannot repeatedly
translate text or accessibility attributes. Shared countdowns use the paused public timestamp, including time scaling.
Counts and policy text use named placeholders. Rebuild `public/i18n/ko/compiled.json` with `tools/build-korean-ui.mjs`, then
language-pack byte sizes and hashes with `tools/build-language-packs.mjs`.

## Evidence and limits

The PR includes before/after screenshots and a composite of 28 themes. Local rooms use one Chromium browser plus
automated participants; they do not establish multi-device Internet or physical mobile-device behaviour. Four/eight
player regressions cover the strategy-complete wait and exact resume timing. See
[validation and CI classification](../reviews/pr28-validation.md) for commands, baseline, failures and incomplete
checks. CI policy is outside this PR's scope.
