# Patches to rust-js

The `rust-js` submodule is pinned to a commit of
[rust-js-lang/rust-js](https://github.com/rust-js-lang/rust-js), unchanged.
When a chapter needs something rust-js doesn't do yet, we write the change
as a patch in `patches/`, open an issue upstream, and list both here.
`bun run rust` applies each patch to the submodule before it builds
([scripts/patch-rust-js.ts](scripts/patch-rust-js.ts)), once. When the fix
is upstream, the submodule moves to a commit that has it, and the patch and
its row go.

| Patch | Gap | Chapter | Upstream issue |
|---|---|---|---|
| none | | | |

Pinned: `a02d3e806` (rust-js `main`, 2026-11-23).

## Landed upstream

| Patch | Gap | Chapter | Issue | Fixed by |
|---|---|---|---|---|
| 0001-sealed-tuple-structs-declared-opaque | A tuple struct with a private field, `pub struct Email(String)`, was declared `any`, so TypeScript took anything where an `Email` was asked for. It's now an interface branded by a `unique symbol` (ADR 1187). | [2](chapters/02-refine-is-a-newtype/README.md) | [rust-js#2356](https://github.com/rust-js-lang/rust-js/issues/2356) | [rust-js#2359](https://github.com/rust-js-lang/rust-js/pull/2359), `a02d3e806` |
