# Patches to rust-js

The `rust-js` submodule is pinned to a commit of
[rust-js-lang/rust-js](https://github.com/rust-js-lang/rust-js), unchanged.
When a chapter needs something rust-js doesn't do yet, we write the change
as a patch in [patches/](patches/), open an issue upstream, and list both
here. `bun run rust` applies each patch to the submodule before it builds
([scripts/patch-rust-js.ts](scripts/patch-rust-js.ts)), once. When the fix
is upstream, the submodule moves to a commit that has it, and the patch and
its row go.

| Patch | Gap | Chapter | Upstream issue |
|---|---|---|---|
| [0001-sealed-tuple-structs-declared-opaque](patches/0001-sealed-tuple-structs-declared-opaque.patch) | A tuple struct with a private field, `pub struct Email(String)`, is declared `any` in the `.d.ts`, so TypeScript takes anything where an `Email` is asked for. The patch declares it opaque, an interface branded by a `unique symbol`, as rust-js declares std's opaque types (ADR 1149). | [2](chapters/02-refine-is-a-newtype/README.md) | [rust-js#2356](https://github.com/rust-js-lang/rust-js/issues/2356) |

Pinned: `530abe1e6` (rust-js `main`, 2026-11-23).
