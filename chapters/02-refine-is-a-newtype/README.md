# 2. `.refine` is a newtype

## What `.refine` checks, and what it forgets

zod's `.refine` adds a rule to a schema:

```ts
// zod/signup.ts (shortened)
const Email = z.string()
  .refine((text) => text.includes('@'), { message: 'an email has an @', abort: true })
  .refine((text) => !text.includes(' '), { message: 'an email has no spaces', abort: true })
```

`Email.parse(text)` checks the rules. But what comes out is a `string`, the
same type as what went in. The check happened, and the type has no memory
of it:

```ts
function welcome(name: string, email: string) { ... }

welcome(signup.name, signup.email)   // checked
welcome('Ada', 'not an email')        // never checked, and TypeScript is fine with it
```

Think of a bouncer who checks your ID at the door and then lets anyone
wander in through the back. The check is real, but nothing stops you going
around it.

zod's answer is `.brand`. It sticks a type-only tag on the result, so a
plain string isn't taken where an `Email` is:

```ts
.brand<'Email'>()
type Email = z.infer<typeof Email>   // string & { [z.$brand]: 'Email' }
```

That helps. But an `Email` is still a string underneath, so one `as` turns
any string into one:

```ts
welcome('Ada' as Name, 'not an email' as Email)   // TypeScript: fine
```

## The Rust way: the rule is the only door

In Rust you make a new type with a private field. A private field means
code outside the type's module can't build one with `Email(text)`. The
only door in is the one you write, and it checks:

```rust
// rust/src/lib.rs (shortened)
#[derive(Deserialize)]
#[serde(try_from = "String")]
pub struct Email(String);          // the field isn't `pub`

impl TryFrom<String> for Email {
    type Error = String;

    fn try_from(text: String) -> Result<Email, String> {
        // … each rule, Err(message) if it breaks one …
        Ok(Email(text))
    }
}
```

`#[serde(try_from = "String")]` tells serde to go through that door too:
read a string, then hand it to `try_from`. So there's no way to get an
`Email`, from JSON or anywhere else, without passing the rules.

Now a function can ask for the proof, not just the text:

```rust
pub fn welcome(name: &Name, email: &Email) -> String
```

It never checks the email, because it doesn't need to. **An `Email` that
exists has been checked.** People call this "parse, don't validate": don't
check a value and keep the old type; turn it into a type that can only hold
good values.

## What rust-js writes

The door becomes a function. The derive reads a string and gives it to the
door:

```js
// rust/src/lib.js (generated, shortened)
function emailDeserialize_deserialize(json) {
  return $json.tried(emailTryFromString_tryFrom($json.string(json)), (error) => error);
}

function emailTryFromString_tryFrom(text) {
  const splitOnce = $splitOnce(text, "@");
  if (splitOnce == null) {
    return { TAG: "Err", _0: "an email has an @" };
  }
  // …
  return { TAG: "Ok", _0: [text] };
}
```

The private field shows up in the types TypeScript sees. `Email` isn't a
`string`. It's a type with a hidden key, and only rust-js's JS can make one:

```ts
// rust/src/lib.d.ts (generated)
declare const $emailBrand: unique symbol;

export interface Email {
    readonly [$emailBrand]: never;
}

export function welcome(name: Name, email: Email): string;
```

`$emailBrand` is a `unique symbol` that's declared but never exported, so
no code outside can write an object with that key. In TypeScript:

```ts
// types.check.ts, checked by tsc
rust.welcome(name, 'not an email')                    // error: a string isn't an Email
rust.welcome(name, 'not an email' as rust.Email)      // error: a string and an Email don't overlap
rust.welcome(name, 'not an email' as unknown as rust.Email)  // only "trust me" gets through
```

Compare with zod's brand: there, one `as` was enough. Here a single `as` is
an error too. You have to say `as unknown as`, TypeScript's "I know what
I'm doing", which is easy to spot in review.

> **Found here, fixed upstream.** When this chapter was written, rust-js
> declared a newtype as `any`, which let TypeScript pass anything. We
> patched our copy, filed
> [rust-js#2356](https://github.com/rust-js-lang/rust-js/issues/2356), and
> the fix landed in rust-js as
> [ADR 1187](https://github.com/rust-js-lang/rust-js/blob/main/docs/decisions/1187-a-tuple-struct-no-caller-can-make-is-declared-opaque.md)
> ([#2359](https://github.com/rust-js-lang/rust-js/pull/2359)). See
> [PATCHES.md](../../PATCHES.md).

## Side by side

`bun chapters/02-refine-is-a-newtype/compare.ts`:

```
{"name":"Ada","email":"ada@example.com"}   (a sign-up)
  zod:  ok
  rust: ok
{"name":"Ada","email":"ada.example.com"}   (the email has no @)
  zod:  refused: an email has an @
  rust: refused: an email has an @ at line 1 column 40
{"name":"Ada","email":"ada@@example.com"}   (the email has two @s)
  zod:  refused: an email has one @, with text on each side
  rust: refused: an email has one @, with text on each side at line 1 column 41
{"name":"Ada","email":"@example.com"}   (nothing before the @)
  zod:  refused: an email has one @, with text on each side
  rust: refused: an email has one @, with text on each side at line 1 column 37
{"name":"Ada","email":"ada @example.com"}   (the email has a space)
  zod:  refused: an email has no spaces
  rust: refused: an email has no spaces at line 1 column 41
{"name":"   ","email":"ada@example.com"}   (the name is blank)
  zod:  refused: a name isn't blank
  rust: refused: a name isn't blank at line 1 column 13
{"name":"","email":"ada.example.com"}   (both are wrong)
  zod:  refused: a name isn't blank | an email has an @
  rust: refused: a name isn't blank at line 1 column 10
{"name":"Ada","email":7}   (the email isn't text)
  zod:  refused: Invalid input: expected string, received number
  rust: refused: invalid type: integer `7`, expected a string at line 1 column 23
```

Your own messages come through word for word on both sides, because they're
your words, not the library's. serde adds where in the text it was.

## Where it's different

- **zod tells you everything that's wrong; serde tells you the first
  thing.** Look at "both are wrong": zod lists two problems, serde stops at
  the name. For a form that should show every mistake at once, that
  matters. It's a later chapter.
- **`abort: true` is how we made zod stop at the first rule that fails, so
  each message matches.** Without it, zod runs every rule on the field:
  `"@ example.com"` would get two messages, "an email has one @, with text
  on each side" and "an email has no spaces", where Rust's `try_from`
  returns at the first.
- **The guarantee is total in Rust and strong in TypeScript.** Inside Rust,
  nothing can make an `Email` but `try_from`. A TypeScript caller can
  still write `as unknown as Email`. No TypeScript type can stop that,
  zod's included.

## Try it

Make the field `pub`, `pub struct Email(pub String);`, and run
`bun run rust`, then `bun run types`. Now anyone can build an `Email`
without the rules, so rust-js stops declaring it as sealed. The
`@ts-expect-error` lines in `types.check.ts` then have nothing to expect,
and tsc says so.
