# 3. A discriminated union is an enum

## What `discriminatedUnion` is for

Some data comes in kinds. A shape is a circle, a square or a rectangle,
and each kind has its own fields: a circle has a `radius`, a square a
`side`. One field, here `type`, says which kind it is:

```json
{ "type": "circle", "radius": 2 }
{ "type": "square", "side": 3 }
```

zod writes that as a list of objects, one per kind, each with its own
`type`:

```ts
// zod/shape.ts
export const Shape = z.discriminatedUnion('type', [
  z.object({ type: z.literal('circle'), radius: z.number() }),
  z.object({ type: z.literal('square'), side: z.number() }),
  z.object({ type: z.literal('rectangle'), width: z.number(), height: z.number() }),
])
```

zod reads `type` first, then checks only the fields that kind has. And
after a `switch` on `shape.type`, TypeScript knows which kind it's looking
at, so `shape.radius` is allowed only in the circle's `case`.

## The Rust way: it's what an enum is

Rust has this built in. An enum is a list of kinds, and each kind, a
*variant*, carries its own fields:

```rust
// rust/src/lib.rs (shortened)
#[derive(Deserialize)]
#[serde(tag = "type", rename_all = "lowercase")]
#[cfg_attr(rust_js, rust_js::tag = "type")]
pub enum Shape {
    #[cfg_attr(rust_js, rust_js::name = "circle")]
    Circle { radius: f64 },
    #[cfg_attr(rust_js, rust_js::name = "square")]
    Square { side: f64 },
    #[cfg_attr(rust_js, rust_js::name = "rectangle")]
    Rectangle { width: f64, height: f64 },
}
```

Without the attributes, that's the whole idea: three kinds, each with its
fields. The attributes say how it looks from outside, and there are two
kinds of them:

- **`#[serde(..)]` is the JSON.** `tag = "type"` says which field holds the
  kind, and `rename_all = "lowercase"` says `Circle` is written `"circle"`.
- **`#[rust_js::..]` is the JavaScript object.** `tag = "type"` and `name =
  "circle"` make rust-js build `{ type: "circle", radius: 2 }`, the same
  shape as the JSON. Leave them out and rust-js uses its own default,
  `{ TAG: "Circle", radius: 2 }`: still a discriminated union, just
  tagged by `TAG`.

Two sets of attributes for one idea is more to write than zod. You get
something for it in the next section.

## What rust-js writes

The type TypeScript sees is exactly zod's `z.infer<typeof Shape>`:

```ts
// rust/src/lib.d.ts (generated)
export type Shape = {
    type: "circle";
    radius: number;
} | {
    type: "square";
    side: number;
} | {
    type: "rectangle";
    width: number;
    height: number;
};
```

They aren't just alike, they're the same type. `types.check.ts` gives a
zod `Shape` where rust-js's is asked for and the other way round, and
`tsc` is fine with both. `compare.test.ts` does it at run time too: zod's `area`
gets the object Rust parsed, and Rust's `area` gets zod's.

The `match` becomes the `if` chain you'd write by hand:

```js
// rust/src/lib.js (generated)
export function area(shape) {
  if (shape.type === "circle") {
    return Math.PI * shape.radius * shape.radius;
  }
  if (shape.type === "square") {
    return shape.side * shape.side;
  }
  return shape.width * shape.height;
}
```

## What you get for it: a `match` can't forget a kind

Say you add a triangle, or you write a function that forgets the
rectangle. In TypeScript, whether anyone notices depends on the function.
One that returns a value gets "Function lacks ending return statement"
(TS2366), which says something's missing but not what. One that returns
nothing gets no complaint at all:

```ts
function drawOnlyCircles(shape: Shape): void {
  switch (shape.type) {
    case 'circle':
      console.log(shape.radius)
  }
}   // squares and rectangles: silently nothing
```

The TypeScript answer is to ask by hand, with `never`, "is anything left?":

```ts
default: {
  const left: never = shape   // error TS2322: Type '{ type: "rectangle"; ... }'
                              // is not assignable to type 'never'.
}
```

That works, but only where you remember to write it.

In Rust you don't write anything. A `match` must cover every variant, in
every function, always:

```
error[E0004]: non-exhaustive patterns: `&Shape::Rectangle { .. }` not covered
 --> src/lib.rs:8:11
  |
8 |     match shape {
  |           ^^^^^ pattern `&Shape::Rectangle { .. }` not covered
```

Add a `Triangle` to the enum, and every `match` that doesn't handle it
stops compiling, each one listed. The doc comment on `area` in `lib.rs`
holds a `match` without the rectangle, as a `compile_fail,E0004` test:
`cargo test` passes only if Rust refuses it.

## Side by side

`bun chapters/03-discriminated-union/compare.ts`:

```
{"type":"circle","radius":2}   (a circle)
  zod:  {"type":"circle","radius":2}, area 12.566370614359172
  rust: {"type":"circle","radius":2}, area 12.566370614359172
{"type":"square","side":3,"color":"red"}   (an unknown key: both drop it)
  zod:  {"type":"square","side":3}, area 9
  rust: {"type":"square","side":3}, area 9
{"type":"triangle","base":3}   (a type that isn't one of them)
  zod:  refused: Invalid discriminator value. Expected 'circle' | 'square' | 'rectangle'
  rust: refused: unknown variant `triangle`, expected one of `circle`, `square`, `rectangle` at line 1 column 18
{"radius":2}   (no type)
  zod:  refused: Invalid discriminator value. Expected 'circle' | 'square' | 'rectangle'
  rust: refused: missing field `type` at line 1 column 12
{"type":"Circle","radius":2}   (the type in the wrong case)
  zod:  refused: Invalid discriminator value. Expected 'circle' | 'square' | 'rectangle'
  rust: refused: unknown variant `Circle`, expected one of `circle`, `square`, `rectangle` at line 1 column 16
{"type":"circle","side":2}   (a circle without its radius)
  zod:  refused: Invalid input: expected number, received undefined
  rust: refused: missing field `radius`
{"type":"circle","radius":"2"}   (a radius that's text)
  zod:  refused: Invalid input: expected number, received string
  rust: refused: invalid type: string "2", expected f64
```

(The square and the rectangle are in [cases.json](cases.json) too.) Both
take and refuse the same inputs, and what they take is the same object
with the same area.

## Where it's different

- **serde tells a missing `type` from a wrong one.** zod says "Invalid
  discriminator value" for both. serde says `missing field \`type\`` for
  one, and names the value it didn't know for the other.
- **But once serde knows the kind, it loses the place.** "a circle without
  its radius" says `missing field \`radius\``, with no line or column.
  That's serde's, not rust-js's: native Rust says the same. To read
  `type` first, serde buffers the object, and the buffered copy has no
  position in the text. zod's message doesn't have one either, but it
  has the path, `["radius"]`.
- **Two sets of attributes.** zod's one schema is the JSON and the type.
  In Rust, serde's attributes set the JSON and rust-js's set the JS
  object. They usually agree, as here, but nothing makes them.

## A bug this chapter found

Writing this chapter turned up a wrong answer in rust-js: an enum read by
serde was built with `TAG` even when `#[rust_js::tag = "type"]` asked for
`type`. The `match` in `area` then found no `type`, took the wrong branch,
and a circle's area came out `NaN`, where native Rust says `12.57`.

We patched our copy, filed
[rust-js#2360](https://github.com/rust-js-lang/rust-js/issues/2360), and
the fix landed in rust-js
([#2361](https://github.com/rust-js-lang/rust-js/pull/2361)). rust-js's
guide now explains the two attributes too, serde's for the JSON and
rust-js's for the JS object
([#2362](https://github.com/rust-js-lang/rust-js/issues/2362)). This
chapter's test is the check: without the fix, `rust._0` isn't
`zod.data` for any shape it takes. See [PATCHES.md](../../PATCHES.md).

## Try it

Add `Triangle { base: f64, height: f64 }` to the enum, and its
`#[cfg_attr(rust_js, rust_js::name = "triangle")]`, and run `cargo test`.
`area` stops compiling and names the triangle. Handle it, run
`bun run rust`, and look at what changed in `lib.d.ts`: the union has a
fourth member, and zod's `Shape` no longer matches it, so `tsc` tells you
where.
