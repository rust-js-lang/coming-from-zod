# 1. The flip

## Why zod exists

A TypeScript type is a label on a box. The compiler trusts the label, but
when the program runs nobody opens the box. The label is gone by then:
types are erased.

```
fetch() → JSON → [ box labeled "User" ] → your code trusts it
                      ▲
              nobody looked inside
```

For data your own code made, that's fine. For data from outside, an HTTP
body or a file, the label is a guess. And TypeScript can't turn a type into
a check, because at run time there's no type left to turn.

So zod flips it. You write the check, and the type is read off it:

```ts
// zod/user.ts
export const User = z.object({
  name: z.string(),
  age: z.uint32(),
})

export type User = z.infer<typeof User>
```

One source, so the check and the type can't drift apart. That's the whole
trick.

## The Rust way: flip it back

In Rust a type isn't a label. You can't get a `User` out of bytes without
running code that builds one, and serde writes that code from the type:

```
zod:   check ──z.infer──► type
Rust:  type  ──derive───► check
```

```rust
// rust/src/lib.rs
#[derive(Debug, Deserialize)]
pub struct User {
    pub name: String,
    pub age: u32,
}

pub fn parse_user(text: &str) -> Result<User, String> {
    serde_json::from_str(text).map_err(|error| error.to_string())
}
```

Still one source, but now the source is the type. `u32` already says
"a whole number from 0 to 4,294,967,295", so there's nothing to add for
`age`.

## What rust-js writes

rust-js compiles that to JavaScript you can read. The derive becomes the
check, a table of each field and how to read it:

```js
// rust/src/lib.js (generated)
function userDeserialize_deserialize(json) {
  return json.struct(
    "struct User",
    [
      ["name", $json.string],
      ["age", $json.u32],
    ],
    ([name, age]) => ({ name, age }),
  );
}

export function parseUser(text) {
  const result = $fromJson(text, userDeserialize_deserialize);
  return result.TAG === "Err" ? { TAG: "Err", _0: $displayJsonError(result._0) } : result;
}
```

And the struct becomes the type, for whoever calls it from TypeScript. This
is your `z.infer`:

```ts
// rust/src/lib.d.ts (generated)
export interface User {
    name: string;
    age: number;
}

export function parseUser(text: string):
  | { TAG: "Ok"; _0: User }
  | { TAG: "Err"; _0: string };
```

A `Result` isn't a throw. It's a value with a `TAG`, so the caller can't
forget the error case the way an uncaught `.parse()` lets you.

## Side by side

`bun chapters/01-the-flip/compare.ts` runs both on each case in
[cases.json](cases.json):

```
{"name":"Ada","age":36}   (a user)
  zod:  ok {"name":"Ada","age":36}
  rust: ok {"name":"Ada","age":36}
{"name":"Ada","age":36,"admin":true}   (an unknown key: both drop it)
  zod:  ok {"name":"Ada","age":36}
  rust: ok {"name":"Ada","age":36}
{"name":"Ada"}   (age is missing)
  zod:  refused: … "path": [ "age" ], "message": "Invalid input: expected number, received undefined"
  rust: refused: missing field `age` at line 1 column 14
{"name":"Ada","age":"36"}   (age is text, not a number)
  zod:  refused: … "path": [ "age" ], "message": "Invalid input: expected number, received string"
  rust: refused: invalid type: string "36", expected u32 at line 1 column 24
{"name":"Ada","age":-1}   (age is below zero)
  zod:  refused: … "path": [ "age" ], "message": "Too small: expected number to be >=0"
  rust: refused: invalid value: integer `-1`, expected u32 at line 1 column 22
{"name":"Ada","age":36.5}   (age is not whole)
  zod:  refused: … "path": [ "age" ], "message": "Invalid input: expected int, received number"
  rust: refused: invalid type: floating point `36.5`, expected u32 at line 1 column 24
{"name":"Ada","age":4294967296}   (age is past u32)
  zod:  refused: … "path": [ "age" ], "message": "Too big: expected number to be <=4294967295"
  rust: refused: invalid value: integer `4294967296`, expected u32 at line 1 column 30
{"name":null,"age":36}   (name is null)
  zod:  refused: … "path": [ "name" ], "message": "Invalid input: expected string, received null"
  rust: refused: invalid type: null, expected a string at line 1 column 12
```

They take and refuse exactly the same inputs. `bun run test` holds them to
it ([compare.test.ts](compare.test.ts)).

## The same check on the server

The messages on the Rust side aren't rust-js's invention. They're
serde_json's, word for word and at the same column.
[rust/tests/native.rs](rust/tests/native.rs) runs the same crate with
native Rust on the same `cases.json` and expects the same messages.

That's the part zod can't do. If your server is Rust, this one crate is its
check too:

```
               ┌── rustc ────►  server: refuses the bad request
lib.rs ────────┤
               └── rust-js ──►  browser: same check, same words
                                + lib.d.ts for TypeScript
```

With zod, a Rust server would need its own copy of the rules, and you'd
hope the two agree.

## Where it's different

- **Where the error is.** zod says which field, `path: ["age"]`. serde_json
  says where in the text, `line 1 column 14`, and names the field only
  when it's missing. An API usually wants the field. That's a later
  chapter.
- **zod reads any JS value; this reads JSON text.** `User.parse(value)`
  takes an object you already have. `parse_user` takes the text. For an
  object, you'd stringify it first, for now.

## Try it

Change `age: u32` to `age: u8` in `lib.rs` and run `bun run rust`. The
diff of `lib.js` shows the check changing with the type, `$json.u32` to
`$json.u8`, with nothing else to edit. Then `bun run test` fails where the
messages now say `expected u8`, in the compiled JS and in native Rust
alike.
