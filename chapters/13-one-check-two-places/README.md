# 13. One check, in two places

## Why zod is everywhere

Here's the real reason teams reach for zod. A signup form checks its
fields in the browser, so the user sees mistakes at once. The server
checks them again, because the browser can't be trusted. Written twice,
the two checks drift apart: the browser lets something through, and the
server refuses it with a message the form never shows.

zod's answer: write the schema once, in TypeScript, and import it from
both:

```ts
// zod/signup.ts: imported by the server and by the browser
export const Signup = z.object({
  name: z.string().trim().min(1, 'required'),
  email: z.string().refine((email) => /^[^@]+@[^@]*\.[^@]*$/.test(email), 'not an email address'),
  age: z.number().int().min(13, 'must be 13 or older'),
})
```

It works because both sides run JavaScript.

## The Rust way: one crate, compiled twice

With rust-js the server doesn't have to be JavaScript. Write the check
once, in a Rust crate, as every chapter so far has:

```rust
// rust/src/lib.rs (shortened)
#[derive(Serialize, Deserialize)]
#[serde(try_from = "SignupForm")]
pub struct Signup { pub name: String, pub email: String, pub age: u32 }

/// The server's answer to a signup's body: `201` and the signup made, or
/// `422` and why not. The browser asks it too, before it sends anything.
pub fn respond(body: &str) -> (u16, String) {
    match serde_json::from_str::<Signup>(body) {
        Ok(signup) => (201, serde_json::to_string(&signup).expect("a signup is JSON")),
        Err(error) => (422, serde_json::to_string(&Refusal { error: error.to_string() }).expect("a refusal is JSON")),
    }
}
```

Then build it two ways:

```
                       ┌── cargo build ─────► native code ── examples/server.rs (HTTP)
  rust/src/lib.rs  ────┤
                       └── rust-js build ───► lib.js + lib.d.ts ── the browser's form
```

- **The server** is native Rust. `examples/server.rs` is a plain HTTP
  server built on std, no framework, whose every answer is `respond`. Run
  it with `cargo run --example server`. A real one would use axum or
  actix; the check would be the same call.
- **The browser** imports the JavaScript rust-js writes:

```ts
import { respond } from './rust/src/lib.js'

const [status, json] = respond(JSON.stringify(formFields))
if (status === 422) showError(JSON.parse(json).error)   // before sending anything
```

## Side by side

`bun chapters/13-one-check-two-places/compare.ts` starts the native server
and sends it each signup over HTTP, then asks the JavaScript, then zod:

```
{"name":" ","email":"ada","age":12}   (every rule broken)
  server (native Rust): 422 {"error":"name: required | email: not an email address | age: must be 13 or older"}
  browser (rust-js):    422 {"error":"name: required | email: not an email address | age: must be 13 or older"}
  zod:                  422 {"error":"name: required | email: not an email address | age: must be 13 or older"}
{"name":"Ada","email":"ada@example.com","age":"36"}   (an age that's text)
  server (native Rust): 422 {"error":"invalid type: string \"36\", expected u32 at line 1 column 50"}
  browser (rust-js):    422 {"error":"invalid type: string \"36\", expected u32 at line 1 column 50"}
  zod:                  422 {"error":"age: Invalid input: expected number, received string"}
{"name":   (a body that isn't JSON)
  server (native Rust): 422 {"error":"EOF while parsing a value at line 1 column 8"}
  browser (rust-js):    422 {"error":"EOF while parsing a value at line 1 column 8"}
  zod:                  422 {"error":"JSON Parse error: Unexpected EOF"}
```

(The rest are in [cases.json](cases.json).) Look at the first two lines
of each: the server and the browser, one native and one JavaScript, give
the same answer byte for byte, down to the column of a broken body.
`compare.test.ts` checks that for every case, against the running server.

That's the whole point of this guide in one test. Every chapter's
`native.rs` and `compare.test.ts` have quietly been checking the same
thing: the Rust you write is the Rust that runs, on either side.

## Where it's different

- **zod shares a schema; this shares a program.** zod's schema is shared
  because both sides are JavaScript. The crate is shared because rust-js
  makes JavaScript of it, and that's not limited to checks: anything the
  form and the server must agree on, pricing, permissions, formatting, can
  live in the same crate.
- **The server doesn't have to be Node.** That's the trade: you need
  rust-js in the build, and a Rust toolchain. In return, the server is a
  native binary, and the browser's check can't drift from it, because
  it's compiled from the same source.
- **Some messages differ from zod's,** as every chapter showed: serde's
  are about the text, zod's about the value. The rules you write yourself,
  in `try_from`, can say exactly what zod says.
- **Bundle size.** The browser now loads rust-js's runtime, `@rust-js/std`,
  for its JSON reader. It only takes what the code uses, but it's not
  nothing. zod has the same cost; check your numbers.

## Try it

Add a rule to `try_from`: say, the name must be at most 40 characters.
Run `bun run rust`, add a case with a long name to `cases.json`, and run
`bun chapters/13-one-check-two-places/compare.ts`. The server and the
browser both refuse it, with the
same words, and you changed one file. Add the same rule to zod and you
change one file too. That's the part both get right.
