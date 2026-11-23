# 10. `.pick`, `.omit` and `.partial` are structs of their own

## One schema, many shapes

An app has a user, and a few shapes made from it. A client creates a user
without an id, since the server picks one. It updates a user by sending
only the fields that change. Other users see only the id and the name.
zod makes each of these from the first:

```ts
// zod/user.ts
export const User = z.object({ id: z.string(), name: z.string(), email: z.string(), admin: z.boolean() })

export const NewUser = User.omit({ id: true }).extend({ admin: z.boolean().default(false) }).strict()
export const UserPatch = User.omit({ id: true }).partial().strict()
export const PublicUser = User.pick({ id: true, name: true })
```

Add a field to `User` and it shows up in each of the others. That's the
appeal: one place to change.

## The Rust way: write each shape out

Rust has no `pick` or `omit`; a type can't be computed from another type's
fields. So each shape is a struct of its own:

```rust
// rust/src/lib.rs (shortened)
pub struct User { pub id: String, pub name: String, pub email: String, pub admin: bool }

#[serde(deny_unknown_fields)]
pub struct NewUser { pub name: String, pub email: String, #[serde(default)] pub admin: bool }

#[derive(Default)]
#[serde(deny_unknown_fields)]
pub struct UserPatch { pub name: Option<String>, pub email: Option<String>, pub admin: Option<bool> }

#[derive(Serialize)]
pub struct PublicUser { pub id: String, pub name: String }
```

`#[serde(deny_unknown_fields)]` is zod's `.strict()`: a new user that
brings its own `id` is refused, not quietly stripped.

That's more typing, and duplicated field names. But look at what joins
the shapes:

```rust
pub fn apply(user: &User, patch: UserPatch) -> User {
    User {
        id: user.id.clone(),
        name: patch.name.unwrap_or_else(|| user.name.clone()),
        email: patch.email.unwrap_or_else(|| user.email.clone()),
        admin: patch.admin.unwrap_or(user.admin),
    }
}
```

Add a field to `User`, and `apply`, `create` and every other place that
builds a `User` stops compiling until you say what the new field is in
each. zod's `{ ...user, ...patch }` would keep working. That's convenient,
and it's also how a new field silently never gets patched, or gets
patched when it shouldn't.

## What rust-js writes

The functions come out as the TypeScript you'd write:

```js
// rust/src/lib.js (generated)
export function create(id, new$) {
  return { id, name: new$.name, email: new$.email, admin: new$.admin };
}

export function apply(user, patch) {
  return {
    id: user.id,
    name: patch.name ?? user.name,
    email: patch.email ?? user.email,
    admin: patch.admin ?? user.admin,
  };
}
```

(`new` is a keyword in JavaScript, so the parameter is `new$`.) And each
struct is an interface in the `.d.ts`; `types.check.ts` checks that `User`
and `NewUser` are zod's, both ways.

## Side by side

`bun chapters/10-pick-is-a-struct/compare.ts` (patches are applied to Ada,
new users get the id `u9`):

```
new {"id":"u7","name":"Ada","email":"ada@example.com"}   (a new user that brings its own id)
  zod:  refused: : Unrecognized key: "id"
  rust: refused: unknown field `id`, expected one of `name`, `email`, `admin` at line 1 column 5
patch {"name":"Countess"}   (a patch of the name alone)
  zod:  {"id":"u1","name":"Countess","email":"ada@example.com","admin":false}
  rust: {"id":"u1","name":"Countess","email":"ada@example.com","admin":false}
patch {"name":null}   (a patch that sets the name to null)
  zod:  refused: name: Invalid input: expected string, received null
  rust: {"id":"u1","name":"Ada","email":"ada@example.com","admin":false}
```

(The rest are in [cases.json](cases.json).) They agree on every case but
the last. Both make the same users, and both show the same `{"id","name"}`
to others.

## Where it's different

- **A `null` in a patch.** zod's `.partial()` makes a field *optional*,
  so a `null` is refused. Rust's `Option` reads a left-out field and a
  `null` alike (chapter 6), so `{"name": null}` means "leave the name as
  it is". If `null` should mean "clear it", the field needs to tell three
  things apart (left out, `null`, a value). That's `Option<Option<String>>`
  with a reader of its own, a common pattern for PATCH APIs.
- **Writing shapes out is the cost, and it's real.** Four structs repeat
  field names. A crate can generate the variants for you, but most Rust
  code just writes them, because each shape tends to drift from the others
  over time anyway: the public view gains a computed field, the patch
  loses one that can't change.
- **The compiler follows every shape.** Rename `email` and every struct,
  every `apply` and every `create` that mentions it is a compile error
  until it's fixed. zod's derived schemas follow the rename, but the code
  that builds objects from them doesn't.

## Try it

Add `pub nickname: Option<String>` to `User` and run `cargo build`. It
fails in `create` and in `apply`: each builds a `User` and doesn't say
what its nickname is. Fix them, and ask yourself whether `UserPatch` should
have a nickname. In zod, you'd have had to remember to ask.
