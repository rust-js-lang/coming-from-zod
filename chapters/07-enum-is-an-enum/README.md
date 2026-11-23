# 7. `z.enum` is an enum

## A field that's one of a few strings

A team member has a role, and there are three:

```ts
// zod/member.ts
export const Role = z.enum(['viewer', 'editor', 'admin'])
export type Role = z.infer<typeof Role>   // 'viewer' | 'editor' | 'admin'

export const Member = z.object({ name: z.string(), role: Role })
```

`z.enum` gives you two things: a check (`'owner'` is refused) and a type
TypeScript can narrow on. You also get the list, `Role.options`, for a
dropdown.

## The Rust way: the type *is* the list

Chapter 3's enum had variants that carry data. Here the variants carry
nothing; each one is just a name:

```rust
// rust/src/lib.rs (shortened)
#[derive(Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Role {
    #[cfg_attr(rust_js, rust_js::name = "viewer")]
    Viewer,
    #[cfg_attr(rust_js, rust_js::name = "editor")]
    Editor,
    #[cfg_attr(rust_js, rust_js::name = "admin")]
    Admin,
}
```

As in chapter 3, two attributes, two questions:

- **`#[serde(rename_all = "lowercase")]` is the JSON**: `"admin"`, not
  `"Admin"`.
- **`#[rust_js::name = "admin"]` is the JavaScript value.** A variant
  that holds nothing is a plain string in JS, its own name `"Admin"`
  unless it's given another.

Functions of a role are what you'd expect, with one gift: the order you
write the variants in *is* an order. `derive(PartialOrd)` makes
`Viewer < Editor < Admin`, so "at least an editor" is one comparison:

```rust
pub fn can_edit(role: Role) -> bool {
    matches!(role, Role::Editor | Role::Admin)
}

pub fn at_least(role: Role, min: Role) -> bool {
    role >= min
}
```

## What rust-js writes

The type is zod's, word for word:

```ts
// rust/src/lib.d.ts (generated)
export type Role = "viewer" | "editor" | "admin";
```

And the functions come out as a person would write them in TypeScript:

```js
// rust/src/lib.js (generated)
export function roles() {
  return ["viewer", "editor", "admin"];
}

export function roleName(role) {
  return role;
}

export function canEdit(role) {
  return role === "editor" || role === "admin";
}

export function atLeast(role, min) {
  return $cmpIn(["viewer", "editor", "admin"], role, min) >= 0;
}
```

Look at `roleName`. In Rust it's a three-arm `match` that turns each
role into its name. In JS a role already *is* its name, so the `match`
disappears and it's `return role`. And `atLeast` compares positions in
the list, which is what zod's version does by hand with `indexOf`.

## Side by side

`bun chapters/07-enum-is-an-enum/compare.ts`:

```
{"name":"Ada","role":"admin"}   (an admin)
  zod:  {"name":"Ada","role":"admin"}, can edit: true
  rust: {"name":"Ada","role":"admin"}, can edit: true
{"name":"Ada","role":"Admin"}   (a role in the wrong case)
  zod:  refused: role: Invalid option: expected one of "viewer"|"editor"|"admin"
  rust: refused: unknown variant `Admin`, expected one of `viewer`, `editor`, `admin` at line 1 column 28
{"name":"Ada","role":2}   (a role that's a number)
  zod:  refused: role: Invalid option: expected one of "viewer"|"editor"|"admin"
  rust: refused: expected value at line 1 column 22
```

(The rest are in [cases.json](cases.json).) Both take and refuse the
same members, and what they take is the same object. `compare.test.ts`
also checks that each side's `canEdit` and `atLeast` agree on every role
and every pair, and `types.check.ts` that the two `Role` types are one.

## Where it's different

- **Rust has no `Role.options`.** An enum doesn't come with a list of its
  variants; you write one, `Role::ALL`, and keep it in step. (The `strum`
  crate can derive one, `Role::iter()`.) zod gets the list for free,
  since the list is how you wrote the schema.
- **But Rust gets the order for free.** zod's list has an order, but a
  `'viewer' < 'admin'` in TypeScript compares the strings alphabetically,
  not by rank. You need `indexOf`. In Rust, `role >= Role::Editor` just
  works, and it's checked by the compiler: comparing a role to a string
  doesn't compile.
- **serde's error for a number is unhelpful.** zod says what it wanted;
  serde_json says `expected value`, because its enum reader only knows
  strings and objects. It's the same message natively.
- **Adding a role.** Add `Owner` to the enum, and every `match` on a role
  that doesn't handle it stops compiling (chapter 3). In zod, a `switch`
  without a `never` check quietly ignores it.

## Try it

Add `Owner` after `Admin`, with its `#[rust_js::name = "owner"]`, and run
`cargo test`. It doesn't compile: `role_name`'s `match` has no arm for
`Role::Owner`, and Rust says so (E0004). Add `Role::Owner => "owner"`. Now `roles()` still says
three roles, because `Role::ALL` is the list you keep by hand; that's the
price of writing it out. Add it there too, and `bun run rust` gives
`"owner"` everywhere.
