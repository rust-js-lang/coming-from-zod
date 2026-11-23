# 8. `z.union` is `#[serde(untagged)]`

## A value that's one of a few shapes, with nothing to say which

Chapter 3's union had a field, `type`, that said which kind each value
was. Real data often has no such field. An id is a number or a string. A
contact is an object with an `email`, or one with a `phone`:

```ts
// zod/person.ts
export const Id = z.union([z.number().int().min(0), z.string()])

export const Email = z.object({ email: z.string() })
export const Phone = z.object({ phone: z.string(), ext: z.string().nullish() })
export const Contact = z.union([Email, Phone])
```

`z.union` tries each option in turn and takes the first that fits.
TypeScript gets `number | string` and `Email | Phone`, and code tells them
apart by looking: `typeof id === 'number'`, `'email' in contact`.

## The Rust way: an enum, read by trying each variant

It's still an enum, with one variant per shape. Two attributes say there's
no tag, one for each side, as in chapters 3 and 7:

```rust
// rust/src/lib.rs (shortened)
#[derive(Deserialize)]
#[serde(untagged)]
#[cfg_attr(rust_js, rust_js::untagged)]
pub enum Id {
    Number(u32),
    Text(String),
}

#[derive(Deserialize)]
#[serde(untagged)]
#[cfg_attr(rust_js, rust_js::untagged)]
pub enum Contact {
    Email(Email),
    Phone(Phone),
}

pub struct Email {
    #[cfg_attr(rust_js, rust_js::test(key))]
    pub email: String,
}
```

- **`#[serde(untagged)]` is the JSON**: read `42` or `"u-7"` as it is,
  trying `Number` and then `Text`, as zod tries its options.
- **`#[rust_js::untagged]` is the JavaScript value**: each value *is* its
  payload, `42` or `"u-7"`, not an object around it.
- **`#[rust_js::test(key)]`** says how JavaScript tells an `Email` from a
  `Phone`: by whether it has an `email` key.

Rust code still says which variant it means, so a `match` can't forget
one:

```rust
pub fn reach(contact: &Contact) -> String {
    match contact {
        Contact::Email(Email { email }) => format!("write to {email}"),
        Contact::Phone(Phone { phone, ext: Some(ext) }) => format!("call {phone}, ext. {ext}"),
        Contact::Phone(Phone { phone, ext: None }) => format!("call {phone}"),
    }
}
```

## What rust-js writes

The types are zod's:

```ts
// rust/src/lib.d.ts (generated)
export type Id = number | string;
export type Contact = Email | Phone;
```

And the `match`es become exactly the checks you'd write by hand:

```js
// rust/src/lib.js (generated)
export function idLabel(id) {
  return typeof id === "number" ? `#${id}` : id;
}

export function reach(contact) {
  if ("email" in contact) {
    return `write to ${contact.email}`;
  }
  if (contact.ext != null) {
    return `call ${contact.phone}, ext. ${contact.ext}`;
  }
  return `call ${contact.phone}`;
}
```

Compare `zod/person.ts`'s `idLabel` and `reach`: they're the same lines.

## Side by side

`bun chapters/08-union-is-untagged/compare.ts`:

```
{"id":1,"contact":{"email":"ada@example.com","phone":"555-0100"}}   (a contact with both: the first that fits wins)
  zod:  {"id":1,"contact":{"email":"ada@example.com"}}
  rust: {"id":1,"contact":{"email":"ada@example.com"}}, #1: write to ada@example.com
{"id":-1,"contact":{"email":"ada@example.com"}}   (an id that's neither: a number below 0)
  zod:  refused: id: Too small: expected number to be >=0
  rust: refused: data did not match any variant of untagged enum Id at line 1 column 8
{"id":1,"contact":{"email":7}}   (an email that's a number)
  zod:  refused: contact: Invalid input
  rust: refused: data did not match any variant of untagged enum Contact at line 1 column 30
```

(The rest are in [cases.json](cases.json).) Both take the same people,
and in the same way: a contact with both keys is an `Email`, because
that's the first option, and its `phone` is dropped. Both refuse the
same, too.

## Where it's different

- **serde's error says almost nothing.** `data did not match any variant
  of untagged enum Id`: not which variant came closest, nor why each one
  failed. serde reads the value once, keeps it, tries each variant on
  it, and throws the failures away. zod's errors aren't always better
  (`Invalid input`), but for the id it found the closest option and said
  why. If the message matters, an untagged enum is the wrong tool: give
  the JSON a tag (chapter 3), or read it in two steps.
- **Order matters, in both.** The first variant that fits wins. Put
  `Text(String)` before `Number(u32)` and a number is still a number, as
  `"42"` and `42` are different JSON; but put a struct with optional
  fields first, and it can swallow everything after it.
- **A type tells JavaScript which is which, not the data.** zod tests
  each option on the value as it is. rust-js has to tell the variants
  apart in JavaScript by looking, `typeof` or `in`. So it refuses a union
  it can't tell apart: two variants that are both strings, say. zod would
  take that, but your code couldn't tell them apart either.

## A gap this chapter found

rust-js refused serde on an enum with `#[rust_js::untagged]`, which was
on its list for later. Lifting the refusal showed why it was waiting:
serde's reader built each variant as `{ TAG: "Number", _0: 42 }`, and its
writer read `out._0`, where the value is just `42`. That's the same
mistake chapters 3 and 4 found, serde's code deciding the shape of a
value that the rest of rust-js already decides.

We filed [rust-js#2388](https://github.com/rust-js-lang/rust-js/issues/2388)
and sent the fix,
[rust-js#2389](https://github.com/rust-js-lang/rust-js/pull/2389), checked
against native serde for each of serde's ways to write an enum. It's
merged, so this chapter needed no patch.

## Try it

Swap `Email` and `Phone` in `Contact`, and run `bun run rust` and `bun
run test`. The case with both keys now fails: Rust reads it as a `Phone`,
while zod still says `Email`. Swap zod's options too, and the two agree
again, on the other answer. That's the whole of "the first that fits
wins", and the reason to keep the order the same on both sides.
