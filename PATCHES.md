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

Pinned: `d2b0d8242` (rust-js `main`, 2026-11-23).

## Landed upstream

| Patch | Gap | Chapter | Issue | Fixed by |
|---|---|---|---|---|
| 0001-sealed-tuple-structs-declared-opaque | A tuple struct with a private field, `pub struct Email(String)`, was declared `any`, so TypeScript took anything where an `Email` was asked for. It's now an interface branded by a `unique symbol` (ADR 1187). | [2](chapters/02-refine-is-a-newtype/README.md) | [rust-js#2356](https://github.com/rust-js-lang/rust-js/issues/2356) | [rust-js#2359](https://github.com/rust-js-lang/rust-js/pull/2359), `a02d3e806` |
| 0002-serde-reads-a-tagged-enum-by-its-own-tag | **A wrong answer.** An enum with `#[rust_js::tag = "type"]`, read by serde, was built `{ TAG: "circle", .. }`, not `{ type: "circle", .. }`, so a `match` on it took the wrong arm: a circle's area was `NaN`, native `12.57`. | [3](chapters/03-discriminated-union/README.md) | [rust-js#2360](https://github.com/rust-js-lang/rust-js/issues/2360) | [rust-js#2361](https://github.com/rust-js-lang/rust-js/pull/2361), `f6bc352ac` |
| 0003-serde-reads-a-flattened-struct-flat | **A wrong answer.** A struct with a `#[rust_js::flatten]` field, read by serde, was built nested, `{ base: { id, .. }, name }`, where every other piece of rust-js reads it flat, so `user.base.id` read `undefined`: a post's byline said `(undefined, created undefined)`, and printing a user threw. | [4](chapters/04-extend-is-flatten/README.md) | [rust-js#2364](https://github.com/rust-js-lang/rust-js/issues/2364) | `b4bc51f88` |
| 0004-serde-path-to-error | **Refused.** `serde_path_to_error`, Rust's usual way to say where in a value a read failed, `items[1].qty`, was refused, and rust-js's JSON reader kept no path. It's now a crate rust-js knows, its reader keeping the path by the crate's rules (ADR 1188). | [5](chapters/05-issues-have-a-path/README.md) | [rust-js#2379](https://github.com/rust-js-lang/rust-js/issues/2379) | [rust-js#2380](https://github.com/rust-js-lang/rust-js/pull/2380), `b3b253215` |
| 0005-serde-own-reader-missing-field | **A wrong answer, and a crash.** A missing field with `deserialize_with` was read by its function from nothing, so an `Option` of it was `None` where serde says `missing field`; and `deserialize_with = "Option::deserialize"`, serde's way to say "there, but maybe `null`", panicked the compiler. | [6](chapters/06-optional-and-default/README.md) | [rust-js#2382](https://github.com/rust-js-lang/rust-js/issues/2382), [rust-js#2383](https://github.com/rust-js-lang/rust-js/issues/2383) | [rust-js#2386](https://github.com/rust-js-lang/rust-js/pull/2386), `3e794a021` |
| (none) | **Refused.** serde on a `#[rust_js::untagged]` enum, so `z.union`'s `number \| string` couldn't be read into its JS shape. Carried as a patch for an hour; landed before this chapter was committed. | [8](chapters/08-union-is-untagged/README.md) | [rust-js#2388](https://github.com/rust-js-lang/rust-js/issues/2388) | [rust-js#2389](https://github.com/rust-js-lang/rust-js/pull/2389), `d2b0d8242` |
