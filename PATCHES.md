# Patches to rust-js

The `rust-js` submodule is pinned to a commit of
[rust-js-lang/rust-js](https://github.com/rust-js-lang/rust-js), unchanged.
When a chapter needs something rust-js doesn't do yet, we write the change
as a patch in [patches/](patches/), open an issue upstream, and list both here.
`bun run rust` applies each patch to the submodule before it builds
([scripts/patch-rust-js.ts](scripts/patch-rust-js.ts)), once. When the fix
is upstream, the submodule moves to a commit that has it, and the patch and
its row go.

None open.

Pinned: `f173c6b0d` (rust-js `main`, 2026-11-23).

## Landed upstream

| Patch | Gap | Chapter | Issue | Fixed by |
|---|---|---|---|---|
| 0001-sealed-tuple-structs-declared-opaque | A tuple struct with a private field, `pub struct Email(String)`, was declared `any`, so TypeScript took anything where an `Email` was asked for. It's now an interface branded by a `unique symbol` (ADR 1187). | [2](chapters/02-refine-is-a-newtype/README.md) | [rust-js#2356](https://github.com/rust-js-lang/rust-js/issues/2356) | [rust-js#2359](https://github.com/rust-js-lang/rust-js/pull/2359), `a02d3e806` |
| 0002-serde-reads-a-tagged-enum-by-its-own-tag | **A wrong answer.** An enum with `#[rust_js::tag = "type"]`, read by serde, was built `{ TAG: "circle", .. }`, not `{ type: "circle", .. }`, so a `match` on it took the wrong arm: a circle's area was `NaN`, native `12.57`. | [3](chapters/03-discriminated-union/README.md) | [rust-js#2360](https://github.com/rust-js-lang/rust-js/issues/2360) | [rust-js#2361](https://github.com/rust-js-lang/rust-js/pull/2361), `f6bc352ac` |
| 0003-serde-reads-a-flattened-struct-flat | **A wrong answer.** A struct with a `#[rust_js::flatten]` field, read by serde, was built nested, `{ base: { id, .. }, name }`, where every other piece of rust-js reads it flat, so `user.base.id` read `undefined`: a post's byline said `(undefined, created undefined)`, and printing a user threw. | [4](chapters/04-extend-is-flatten/README.md) | [rust-js#2364](https://github.com/rust-js-lang/rust-js/issues/2364) | `b4bc51f88` |
