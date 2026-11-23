# 4. `.extend` is a field, flattened

## What `.extend` does

Most records in an app share a few fields, an `id` and when it was made.
zod writes those once and builds the rest on top:

```ts
// zod/records.ts
export const Base = z.object({ id: z.string(), createdAt: z.string() })

export const User = Base.extend({ name: z.string(), email: z.string() })
export const Post = Base.extend({ title: z.string(), authorId: z.string() })
```

`.extend` makes a new schema with `Base`'s fields copied in, so a user is
one flat object:

```json
{ "id": "u1", "createdAt": "2026-11-23", "name": "Ada", "email": "ada@example.com" }
```

And since TypeScript compares types by their shape, a `User` has
everything a `Base` has, so a function that takes a `Base` takes a user or
a post:

```ts
export function label(record: Base): string { .. }

label(user)   // fine
label(post)   // fine
```

## The Rust way: a user *has* a base

Rust has no `extend`. A struct doesn't inherit another's fields. It holds
one:

```rust
// rust/src/lib.rs (shortened)
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Base {
    pub id: String,
    pub created_at: String,
}

#[derive(Deserialize)]
pub struct User {
    #[serde(flatten)]
    #[cfg_attr(rust_js, rust_js::flatten)]
    pub base: Base,
    pub name: String,
    pub email: String,
}
```

Think of it as a box inside a box: the user box holds a base box, a name
and an email. That's honest about what's going on, and in Rust you say
which box you mean. `label` takes a `Base`, and you hand it the user's:

```rust
pub fn label(record: &Base) -> String { .. }

label(&user.base)
label(&post.base)
```

But the JSON isn't a box in a box. It's one flat object. So, as in the
last chapter, two attributes say how it looks from outside:

- **`#[serde(flatten)]` is the JSON.** Read the base's fields out of the
  user's own object, not from a `"base": { .. }` inside it.
- **`#[rust_js::flatten]` is the JavaScript object.** Make the user one
  flat object too, `{ id, createdAt, name, email }`, not `{ base: { .. },
  name, email }`.

## What rust-js writes

TypeScript sees `extends`, the shape zod's `.extend` gives:

```ts
// rust/src/lib.d.ts (generated)
export interface Base {
    id: string;
    createdAt: string;
}

export interface User extends Base {
    name: string;
    email: string;
}

export function label(record: Base): string;
```

The best part is in the JS. Since the user is flat, its `base` isn't a
separate object. It's the user itself. So `label(&post.base)` in Rust
becomes plain `label(post)`:

```js
// rust/src/lib.js (generated)
function userDeserialize_deserialize(json) {
  return json.struct(
    "struct User",
    [
      ["name", $json.string],
      ["email", $json.string],
    ],
    ([name, email, base]) => ({ ...base, name, email }),
    { flatten: [baseDeserialize_deserialize] },
  );
}

export function byline(post, author) {
  return `${post.title} by ${author.name} (${label(post)})`;
}
```

So Rust code says "the post's base", TypeScript code says "the post", and
both are right about the same object. `types.check.ts` checks that zod's
`User` and rust-js's are one type, both ways, and that a `Post` isn't a
`User`. `compare.test.ts` checks that each side's `label` takes the
other's records.

## Side by side

`bun chapters/04-extend-is-flatten/compare.ts`:

```
user {"id":"u1","createdAt":"2026-11-23","name":"Ada","email":"ada@example.com","admin":true}   (an unknown key: both drop it)
  zod:  {"id":"u1","createdAt":"2026-11-23","name":"Ada","email":"ada@example.com"}
  rust: {"id":"u1","createdAt":"2026-11-23","name":"Ada","email":"ada@example.com"}
user {"id":"u1","name":"Ada","email":"ada@example.com"}   (no createdAt, a base field)
  zod:  refused: createdAt: Invalid input: expected string, received undefined
  rust: refused: missing field `createdAt` at line 1 column 50
user {"id":7,"createdAt":"2026-11-23","name":"Ada","email":"ada@example.com"}   (an id that's a number)
  zod:  refused: id: Invalid input: expected string, received number
  rust: refused: invalid type: integer `7`, expected a string at line 1 column 72
user {"id":"p1","createdAt":"2026-11-24","title":"Hello","authorId":"u1"}   (a post read as a user)
  zod:  refused: name: Invalid input: expected string, received undefined | email: Invalid input: expected string, received undefined
  rust: refused: missing field `name` at line 1 column 68
```

(The user and the post that are taken are in [cases.json](cases.json)
too.) They take and refuse the same records, and what they take is the
same flat object.

## Where it's different

- **Rust says which part it means.** `label(&user.base)`, not
  `label(user)`. It's a little more to type, and it's the reason a `User`
  can't be mistaken for a `Base` anywhere you didn't say so. TypeScript
  callers of the compiled code don't see this: to them, a `User` is a
  `Base`.
- **zod can change a field when it extends; flatten can't.**
  `Base.extend({ id: z.number() })` replaces `id`'s schema. A flattened
  `Base` always has its own `id`.
- **Flatten makes serde read the object twice, and the place is lost.**
  serde reads the user's own fields, keeps what's left, then reads the
  base from that. When the base's `id` is wrong, the error points to the
  end of the object, `line 1 column 72`, not to `id`. zod's error has the
  path, `id`. That's serde's, and native Rust says the same.
- **Two attributes again.** As in chapter 3: serde's for the JSON,
  rust-js's for the JS object. Leave out `#[rust_js::flatten]` and the JS
  is `{ base: { id, createdAt }, name, email }`, with a `.d.ts` that says
  so. It's correct, just not zod's shape.

## A bug this chapter found

Writing this chapter turned up a second wrong answer in rust-js, a cousin
of chapter 3's. serde's reader built a flattened user nested,
`{ base: { .. }, name }`, even with `#[rust_js::flatten]`. Every other piece
of the compiled code reads it flat, so `user.base.id` read `undefined`,
and printing a user threw an error where native Rust prints it.

We patched our copy (`patches/0003-serde-reads-a-flattened-struct-flat.patch`)
and filed [rust-js#2364](https://github.com/rust-js-lang/rust-js/issues/2364).
This chapter's test is the check: without the patch, `read._0` isn't
`parsed.data` for any record it takes. See [PATCHES.md](../../PATCHES.md).

## Try it

Delete `#[cfg_attr(rust_js, rust_js::flatten)]` from `User` and run
`bun run rust`. In `lib.d.ts`, `User` stops extending `Base` and gets a
`base: Base` field. Then `bun run test`: `tsc` refuses `label(user)`, and
the objects no longer match zod's. Put it back, and delete
`#[serde(flatten)]` instead: now the JSON must have `"base": { .. }`, and
every case that zod takes, Rust refuses.
