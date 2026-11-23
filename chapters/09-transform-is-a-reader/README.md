# 9. `.transform` and `z.coerce` are readers

## What goes in isn't what comes out

A signup form sends what people type: an email with stray spaces and
capitals, an age as text, tags as one comma-separated string. You want to
keep something tidier:

```ts
// zod/signup.ts
export const Signup = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  age: z.coerce.number().int().min(13),
  tags: z.string().transform((text) => text.split(',').map((tag) => tag.trim()).filter((tag) => tag !== '')),
})

export type SignupInput = z.input<typeof Signup>   // what the form sends
export type Signup = z.output<typeof Signup>       // what you keep
```

zod's schema describes both at once: each step can change the value, so
the type going in and the type coming out are two types.

## The Rust way: the struct is what you keep; reading it is code

A Rust struct has one type: what you keep. What the JSON may look like on
the way in belongs to the code that reads each field, and serde lets you
name it:

```rust
// rust/src/lib.rs (shortened)
#[derive(Deserialize)]
pub struct Signup {
    pub email: Email,
    #[serde(deserialize_with = "age")]
    pub age: u32,
    #[serde(deserialize_with = "tags")]
    pub tags: Vec<String>,
}
```

Three ways to say how a field is read, each for its own job:

- **`#[serde(try_from = "String")]` on a type**: read a `String`, then
  turn it into this type, or fail. `Email`'s `try_from` trims, lower-cases
  and checks. Since it's the only way to make an `Email`, every `Email`
  anywhere is tidy (chapter 2's newtype, with a cleanup step).
- **`deserialize_with = "age"` on a field**: a function that reads it.
  `age` reads a number *or* text, using chapter 8's untagged enum, parses
  the text, and checks the minimum. That's `z.coerce.number().min(13)`,
  written out.
- **`deserialize_with = "tags"`**: read a `String`, then split it. That's
  `.transform(..)`.

```rust
fn tags<'de, D: Deserializer<'de>>(d: D) -> Result<Vec<String>, D::Error> {
    let text = String::deserialize(d)?;
    Ok(text.split(',').map(str::trim).filter(|tag| !tag.is_empty()).map(str::to_string).collect())
}
```

More code than zod's one-liners, but each reader is a plain function you
can test and reuse.

## What rust-js writes

The splitting reads like zod's transform:

```js
// rust/src/lib.js (generated)
function tags(d) {
  const result = $jsonRead(d, $json.string);
  if (result.TAG === "Err") {
    return result;
  }
  const text = result._0;
  return {
    TAG: "Ok",
    _0: text
      .split(",")
      .map((s) => $trim(s))
      .filter((tag) => tag !== ""),
  };
}
```

And the `.d.ts` describes only what you keep. That's `z.output`; there's
no `z.input`, since what may go in is the readers' business:

```ts
// rust/src/lib.d.ts (generated)
export interface Signup {
    email: Email;
    age: number;
    tags: string[];
}
```

## Side by side

`bun chapters/09-transform-is-a-reader/compare.ts`:

```
{"email":"  ADA@example.com ","age":"36","tags":"rust, zod,,js "}   (as a form sends it: padded, an age as text, a stray comma)
  zod:  {"email":"ada@example.com","age":36,"tags":["rust","zod","js"]}
  rust: ada@example.com (36), tagged rust + zod + js
{"email":"ada@example.com","age":true,"tags":""}   (an age that is true)
  zod:  refused: age: Too small: expected number to be >=13
  rust: refused: data did not match any variant of untagged enum NumberOrText at line 1 column 37
{"email":"ada@example.com","age":"thirty","tags":""}   (an age that isn't a number)
  zod:  refused: age: Invalid input: expected number, received NaN
  rust: refused: not a whole number: "thirty" at line 1 column 41
{"email":"ada@example.com","tags":"rust"}   (no age)
  zod:  refused: age: Invalid input: expected number, received NaN
  rust: refused: missing field `age` at line 1 column 41
```

(The rest are in [cases.json](cases.json).) Both take and refuse the same
signups, and what they take ends up the same: the same email, age and
tags. Both refuse too young, a bad email, and tags that are already a list.

## Where it's different

- **`z.coerce` coerces everything, so it can surprise you.** It runs
  JavaScript's `Number(..)` on whatever arrives. `true` becomes `1`, so
  zod's complaint about `"age": true` is that 1 is *too small*. A missing
  age becomes `NaN`. Rust's reader takes exactly what you wrote it to take,
  a number or text, and says what it didn't get.
- **Your errors are yours.** Rust's messages for age and email are the
  ones the readers wrote, `not a whole number: "thirty"`. That's more work,
  and more control. serde adds where in the text it was.
- **One type, not two.** zod's `z.input` is useful when the same schema
  is shared with a form library. Rust has no equivalent: the input's shape
  is the reader's code, not a type. The `.d.ts` only promises the output.
- **The email is sealed.** In zod, `email` is a plain string once read.
  rust-js keeps chapter 2's promise: an `Email` is opaque to TypeScript,
  which reads it through `Email.asStr(email)` and can't make one up
  (`types.check.ts`).

## Try it

Add `"age": ""` to a case. zod's `Number("")` is `0`, so it says *too
small*. Rust's reader trims, fails to parse, and says `not a whole
number: ""`. Neither is wrong, but only one of them is telling you what
the user actually typed.
