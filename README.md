# coming-from-zod

You know [zod](https://zod.dev). This is what the same problems look like
when you write Rust and compile it to JavaScript with
[rust-js](https://github.com/rust-js-lang/rust-js).

It's a guide, not a port: zod isn't rebuilt here. Each chapter takes one
thing you do with zod, does it the Rust way, and runs both on the same
inputs, so you can see where they agree and where they don't.

## Chapters

1. [The flip](chapters/01-the-flip/README.md): zod writes the check and
   reads the type off it. Rust writes the type and derives the check.
2. [`.refine` is a newtype](chapters/02-refine-is-a-newtype/README.md): a
   refinement zod forgets once it has run, Rust keeps as a type only the
   check can make.

## Run it

```bash
git clone --recurse-submodules https://github.com/rust-js-lang/coming-from-zod.git
cd coming-from-zod
bun install
bun install --cwd rust-js --frozen-lockfile --ignore-scripts
bun run rust     # patch rust-js, then compile each chapter's Rust to JS (builds rust-js first)
bun run test     # tsc, then zod vs the compiled Rust, and native Rust, on the same cases
```

`bun run rust` builds the compiler from the `rust-js` submodule the first
time, which takes a while. If you already have a rust-js build of the same
commit, `RUST_JS_COMPILER=path/to/rust-js bun run rust` uses it.

The JS rust-js writes is committed beside the Rust it's from (`lib.js`,
`lib.d.ts`), so you can read it without building anything.

## Layout

```
coming-from-zod/
├── rust-js/                     the compiler, a submodule pinned to a commit
├── chapters/01-the-flip/
│   ├── zod/user.ts              the zod way
│   ├── rust/src/lib.rs          the Rust way
│   ├── rust/src/lib.js, .d.ts   what rust-js writes from it (committed)
│   ├── rust/tests/native.rs     native Rust on the same cases
│   ├── cases.json               the inputs, and what each should do
│   └── compare.ts, .test.ts     both, side by side
├── chapters/02-refine-is-a-newtype/
│   └── types.check.ts           what TypeScript lets through, checked by tsc
├── patches/                     our changes to rust-js, applied by `bun run rust`
├── scripts/patch-rust-js.ts     applies them, once
└── PATCHES.md                   why each patch exists, and its upstream issue
```

## When rust-js falls short

rust-js is young, and a chapter will sometimes need something it doesn't do
yet. When that happens we write a patch to it in `patches/`, which
`bun run rust` applies to the submodule, so the chapter can go on, and
open an issue on [rust-js](https://github.com/rust-js-lang/rust-js/issues)
so it's fixed upstream. [PATCHES.md](PATCHES.md) lists each patch and its issue; when the
fix lands, the submodule moves to it and the patch goes.
