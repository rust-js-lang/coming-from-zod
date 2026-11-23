# 15. Recursion, and where zod wins

## A schema that holds itself

A comment has replies, and each reply is a comment. zod needs a trick for
that: a schema can't refer to itself before it exists, so `replies` is a
getter, read only when zod asks for it:

```ts
// zod/comment.ts
export const Comment = z.object({
  author: z.string(),
  text: z.string(),
  get replies() {
    return z.array(Comment).default([])
  },
})
```

(Older zod used `z.lazy(() => ..)` and a hand-written type.)

## The Rust way: nothing special

A Rust type can name itself, so a comment that holds comments is just
that:

```rust
// rust/src/lib.rs (shortened)
#[derive(Deserialize)]
pub struct Comment {
    pub author: String,
    pub text: String,
    #[serde(default)]
    pub replies: Vec<Comment>,
}

pub fn depth(comment: &Comment) -> usize {
    1 + comment.replies.iter().map(depth).max().unwrap_or(0)
}
```

(A struct that held *one* `Comment` directly would need a `Box<Comment>`,
since its size would be infinite. A `Vec` already holds its items
elsewhere.) rust-js writes `replies: Comment[]` in the `.d.ts`, the same
type zod infers.

## Side by side

`bun chapters/15-recursion-and-where-zod-wins/compare.ts`:

```
{"author":"ada","text":"Rust or zod?","replies":[{"author":"grace","text":"Bo...   (a thread)
  zod:  4 comments, 3 deep
  rust: 4 comments, 3 deep
{"author":"a1","text":".","replies":[{"author":"a2","text":".","replies":[{"a...   (a thread 60 comments deep)
  zod:  60 comments, 60 deep
  rust: 60 comments, 60 deep
{"author":"a1","text":".","replies":[{"author":"a2","text":".","replies":[{"a...   (a thread 70 comments deep)
  zod:  70 comments, 70 deep
  rust: refused: recursion limit exceeded at line 1 column 2368
```

Both take and refuse the same threads, except the deepest. serde_json
stops at 128 levels of nesting, and each comment is two (an object and its
list of replies). That's a deliberate guard: a hostile request nested a
million deep can't exhaust the server's stack. zod has no such limit. If
your data really is that deep, serde_json has an opt-out
(`disable_recursion_limit`, behind a feature), but think twice.

## Where zod wins

Fifteen chapters of "here's the Rust way" deserve an honest list of the
other side:

- **Every problem at once.** zod collects every issue in the data; serde
  stops at the first one in a field (chapter 5). For a big form, showing
  every bad box at once is zod's for free. In Rust you get it only for
  rules you check yourself, in `try_from` (chapter 12).
- **Error messages about the data.** zod's paths and messages are made
  for showing to people. serde's say where in the *text*, and some say
  almost nothing (chapter 8's untagged enums).
- **Shapes from shapes.** `.pick`, `.omit`, `.partial` and `.extend` make
  a new schema in one line. In Rust each shape is a struct you write out
  (chapter 10).
- **Input and output types.** zod's `z.input` types what a form sends,
  for form libraries. Rust has only the output (chapter 9).
- **No build step.** zod is a library; rust-js is a compiler and a Rust
  toolchain in your build. For a TypeScript-only app that just needs to
  check some JSON, zod is less to set up.

## Where Rust wins

And the other list, for balance:

- **The type comes first** (chapter 1): no schema to keep in step with a
  type, because the type *is* the schema.
- **Values that can't be wrong** (chapter 2): a sealed `Email` is valid
  everywhere, not just where someone remembered to check.
- **Exhaustive `match`** (chapters 3 and 7): add a kind, and every place
  that forgot it stops compiling.
- **One program, two places** (chapter 13): the server and the browser run
  the same code, not just the same schema.
- **Order and maps are real types** (chapters 7 and 11): `role >= Editor`,
  a `Map` that can't confuse a key with `__proto__`.

## The map

| zod | Rust | Chapter |
|---|---|---|
| `z.object`, `z.infer` | a struct, `#[derive(Deserialize)]` | [1](../01-the-flip/README.md) |
| `.refine`, `.brand` | a newtype with `TryFrom` | [2](../02-refine-is-a-newtype/README.md) |
| `z.discriminatedUnion` | an enum, `#[serde(tag)]` | [3](../03-discriminated-union/README.md) |
| `.extend` | a field, `#[serde(flatten)]` | [4](../04-extend-is-flatten/README.md) |
| `issue.path` | `serde_path_to_error` | [5](../05-issues-have-a-path/README.md) |
| `.optional`, `.nullable`, `.default` | `Option`, `deserialize_with`, `#[serde(default)]` | [6](../06-optional-and-default/README.md) |
| `z.enum` | a fieldless enum | [7](../07-enum-is-an-enum/README.md) |
| `z.union` | `#[serde(untagged)]` | [8](../08-union-is-untagged/README.md) |
| `.transform`, `z.coerce` | `try_from`, `deserialize_with` | [9](../09-transform-is-a-reader/README.md) |
| `.pick`, `.omit`, `.partial`, `.strict` | structs of their own, `deny_unknown_fields` | [10](../10-pick-is-a-struct/README.md) |
| `z.record`, `z.set` | `HashMap`, `HashSet` | [11](../11-record-is-a-map/README.md) |
| `.superRefine` | `#[serde(try_from)]` of a form | [12](../12-refine-the-whole/README.md) |
| one schema, server and browser | one crate, built twice | [13](../13-one-check-two-places/README.md) |
| `z.infer` for callers | the `.d.ts` | [14](../14-typescript-callers/README.md) |
| `z.lazy` | a type that names itself | 15 |

## What writing this guide fixed

Every chapter ran its Rust both natively and through rust-js, and
compared the answers. Where they differed, that was a rust-js bug, filed
and fixed along the way. [PATCHES.md](../../PATCHES.md) lists them all:
sealed newtypes declared `any`; serde building enums and flattened structs
in the wrong shape; error paths refused; a missing `deserialize_with` field
read as `None`; a crash on `Option::deserialize`; untagged unions refused.
Each is fixed in rust-js now, so this guide runs on rust-js as it is, with
no patches.

## Try it

Find the deepest thread serde takes: somewhere between 60 and 70
comments. `bun chapters/15-recursion-and-where-zod-wins/deep.ts 64`
prints one 64 deep; add a few to `cases.json` and run `compare.ts`.
Count the levels before you look: each comment is two, an object and its
list of replies, except the last, which has no list.
