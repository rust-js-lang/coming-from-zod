# 6. Optional, nullable, default

## Three ways zod says "maybe nothing"

A settings page sends a profile. Some of it is always there, some of it
may not be:

```ts
// zod/profile.ts
export const Profile = z.object({
  name: z.string(),                        // always there
  nickname: z.string().nullish(),          // may be left out, or null
  bio: z.string().nullable(),              // must be there, but may be null
  theme: z.string().default('light'),      // 'light' when left out
  newsletter: z.boolean().default(false),  // false when left out
})
```

JSON has two kinds of nothing, and zod keeps them apart:

- **Left out**: the key isn't in the object. zod calls that `.optional()`.
- **`null`**: the key is there, and says "nothing". zod calls that
  `.nullable()`.
- **Either**: `.nullish()`, the two together.

And `.default(x)` fills in `x` for a key that's left out.

## The Rust way: one `Option`, and serde says where it may be missing

Rust has one kind of nothing: an `Option<T>` is `Some(value)` or `None`.
Which JSON gives a `None` is serde's to say:

```rust
// rust/src/lib.rs (shortened)
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Profile {
    pub name: String,
    pub nickname: Option<String>,
    #[serde(deserialize_with = "Option::deserialize")]
    pub bio: Option<String>,
    #[serde(default = "light")]
    pub theme: String,
    #[serde(default)]
    pub newsletter: bool,
}
```

- **`Option<String>` is zod's `.nullish()`.** serde reads both a left-out
  key and `null` as `None`. That's what you want most of the time.
- **`deserialize_with = "Option::deserialize"` is zod's `.nullable()`.**
  It looks odd: it reads the field the way an `Option` is read anyway.
  The trick is that a field with its own reader loses serde's "left out
  means `None`" rule. So `null` is still `None`, but a left-out `bio` is
  `missing field`. It's serde's usual idiom for "must be there, may be
  null".
- **`#[serde(default)]` is zod's `.default()`.** `default` alone uses the
  type's `Default`, `false` for a `bool`. `default = "light"` names a
  function that makes the value.

## What rust-js writes

```js
// rust/src/lib.js (generated)
function profileDeserialize_deserialize(json) {
  return json.struct(
    "struct Profile",
    [
      ["name", $json.string],
      ["nickname", $json.option($json.string)],
      ["bio", $jsonPresent($json.option($json.string))],
      ["theme", $json.string, () => light()],
      ["newsletter", $json.bool, () => false],
    ],
    ([name, nickname, bio, theme, newsletter]) => ({ name, nickname, bio, theme, newsletter }),
  );
}
```

Each field's line says its rule: `$json.option(..)` for "maybe nothing",
`$jsonPresent(..)` for "but it must be there", and a function after the
reader for "this when it's left out".

The Rust that reads an `Option` reads like the TypeScript you'd write:

```rust
pub fn greeting(profile: &Profile) -> String {
    let name = profile.nickname.as_deref().unwrap_or(&profile.name);
    format!("Hi, {name}! ({} theme)", profile.theme)
}
```

```js
export function greeting(profile) {
  const name = profile.nickname ?? profile.name;
  return `Hi, ${name}! (${profile.theme} theme)`;
}
```

## Side by side

`bun chapters/06-optional-and-default/compare.ts` (`<undefined>` is a key
whose value is `undefined`, which `JSON.stringify` would leave out):

```
{"name":"Ada","bio":null}   (only what must be there: the rest left out)
  zod:  {"name":"Ada","bio":null,"theme":"light","newsletter":false}
  rust: {"name":"Ada","nickname":"<undefined>","bio":"<undefined>","theme":"light","newsletter":false}
{"name":"Ada","nickname":null,"bio":null}   (a nickname that's null)
  zod:  {"name":"Ada","nickname":null,"bio":null,"theme":"light","newsletter":false}
  rust: {"name":"Ada","nickname":"<undefined>","bio":"<undefined>","theme":"light","newsletter":false}
{"name":"Ada"}   (no bio: it must be there, even as null)
  zod:  refused: bio: Invalid input: expected string, received undefined
  rust: refused: missing field `bio` at line 1 column 14
{"name":"Ada","bio":null,"theme":null}   (a theme that's null: a default is for left out, not null)
  zod:  refused: theme: Invalid input: expected string, received null
  rust: refused: invalid type: null, expected a string at line 1 column 37
```

(The other cases are in [cases.json](cases.json).) Both take and refuse
the same profiles, fill in the same defaults, and greet each one the same.
Note the fourth: in both, a default is for a key that's *left out*; an
explicit `null` isn't "left out", so it's refused.

## Where it's different

- **Rust has one nothing; JavaScript has two.** rust-js writes `None` as
  `undefined`, always: a left-out `nickname` and a `null` one are both
  `nickname: undefined`. zod keeps what the JSON said, `null` as `null`
  and a left-out key left out. `compare.test.ts` checks that the objects
  are otherwise equal.
- **The types say so too.** rust-js's `.d.ts` has `nickname?: string |
  undefined`; zod's type has `string | null | undefined`. TypeScript
  refuses one where the other is asked for, both ways
  (`types.check.ts`). The code is kinder than the types: rust-js reads an
  `Option` with `??` and `!= null`, which treat `null` as `undefined`, so
  rust-js's `greeting` and `has_nickname` give the right answer for a zod
  object too. The test checks that, but TypeScript won't let you rely on
  it without a cast.
- **zod's `.optional()` alone has no one-word twin.** It takes a left-out
  key and refuses `null`. serde's `Option` takes both. If the difference
  matters to you, it takes a reader of your own; most APIs don't care.
- **"Must be there" is spelled oddly.** `deserialize_with =
  "Option::deserialize"` says it through a side effect. zod's
  `.nullable()` says it directly.

## Two bugs this chapter found

rust-js got the "must be there" idiom wrong twice:

- **A wrong answer** ([rust-js#2382](https://github.com/rust-js-lang/rust-js/issues/2382)).
  With a `deserialize_with` function of your own that reads an `Option`, a
  left-out `bio` came out as `None`. serde never calls that function for a
  missing field and says `missing field`; rust-js called it on nothing.
- **A crash** ([rust-js#2383](https://github.com/rust-js-lang/rust-js/issues/2383)).
  `deserialize_with = "Option::deserialize"` itself crashed the compiler.
  It named serde's own code, which rust-js took to be the crate's.

Both were fixed in [rust-js#2386](https://github.com/rust-js-lang/rust-js/pull/2386),
checked against native serde, so this chapter needed no patch; the
submodule is pinned past the fix. See [PATCHES.md](../../PATCHES.md).

## Try it

Remove `#[serde(deserialize_with = "Option::deserialize")]` from `bio` and
run `bun run rust`, then `bun run test`. The case with no `bio` now passes
in Rust and still fails in zod: without the attribute, `bio` is
`.nullish()`, not `.nullable()`. Then change zod's `bio` to `.nullish()`
too: now both take it, and what's out of date is `cases.json`, which
still expects them to refuse.
