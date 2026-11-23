# 14. TypeScript callers

## What the `.d.ts` is

Every chapter has shown a `.d.ts`: rust-js writes one beside each crate's
JavaScript, so a TypeScript app can call it. This chapter is about that
app: what it can count on, and what it can't.

```ts
// rust/src/lib.d.ts (generated, shortened)
export interface OrderId { readonly [$orderIdBrand]: never }   // only the crate makes one
export type Status = "open" | "shipped";
export interface Item { sku: string; qty: number }
export interface Order { id: OrderId; status: Status; items: Item[]; note?: string | undefined }

export function parseOrder(text: string): { TAG: "Ok"; _0: Order } | { TAG: "Err"; _0: string };
export function count(order: Order): number;
export function double(n: number): number;
```

Read it as a contract, both ways. The crate promises what it gives back,
and expects you to keep your side: what you pass in is what the types say.

## What `tsc` checks for you

A lot. `types.check.ts` shows each:

- **Shapes.** A `qty` that's a string, an item with no `sku`, a status
  that isn't `"open"` or `"shipped"`: all compile errors.
- **Sealed types.** `OrderId` is branded (chapter 2), so TypeScript can't
  make one up. Only `parseOrder` hands them out, the same as zod's
  `.brand`.
- **Results.** A `Result` is a union on `TAG`, and TypeScript narrows it:
  after `if (read.TAG === 'Ok')`, `read._0` is an `Order`.

## What nothing checks

TypeScript has one number type. A `u32` in Rust is "a whole number from 0
to 4,294,967,295"; in the `.d.ts` it's just `number`. So this compiles:

```ts
rust.double(-1)                         // tsc: fine
rust.withItem(order, { sku: 'C3', qty: -5 })   // tsc: fine
```

And rust-js doesn't check it at runtime either. It trusts the contract,
as TypeScript itself does. Here's what actually happens
(`bun chapters/14-typescript-callers/compare.ts`):

```
Values TypeScript built, past the readers:
  rust.double(-1)                       4294967294
  rust.double(3.5)                      7
  rust.count(+ an item of qty -5)       4294967294
  zod's count(+ an item of qty -5)      -2
```

`-1` is taken as a `u32`'s bits, and the answer is nonsense. zod's code
gives a *different* nonsense, `-2`: its `Item` type is just as unchecked
once you build the object yourself. Neither is a bug in its library; both
are a value that broke the contract.

## Where the checking is: the readers

The rule is the same in both worlds: **check at the edge, trust inside.**
Data from outside (a request, a file, a form) comes in through a reader:
`parseOrder`, or zod's `Order.parse`. The reader checks everything, every
field, every range, every union member:

```
{"id":7,"status":"open","items":[{"sku":"A1","qty":-5}]}   (a quantity below 0)
  zod:  refused: items.0.qty: Too small: expected number to be >=0
  rust: refused: invalid value: integer `-5`, expected u32 at line 1 column 53
```

After that, values flow between functions on their types. Every chapter
before this one has been about writing good readers. This one is about
remembering that a value you build yourself never went through one.

## Where it's different

- **A sealed type is the strongest promise.** Make a type only the crate
  can create (chapter 2's newtype, `OrderId` here), and TypeScript can't
  hand you a bad one without writing `as unknown as`. A plain struct's
  fields are open to anything with the right shape.
- **Wrapping, not errors.** When a bad number gets in, Rust's integer math
  wraps (chapter 11), so you get a big wrong number rather than a crash.
  A native debug build would panic instead.
- **The guide is getting a note.** rust-js's guide said a value "crosses
  as the shape it has in JS", but not what happens when it doesn't fit.
  This chapter filed
  [rust-js#2391](https://github.com/rust-js-lang/rust-js/issues/2391)
  to say so.

## Try it

In `types.check.ts`, change `negative`'s `qty` to `'-5'`. `tsc` refuses
it: a string isn't a number. Change it back to `-5`, and `tsc` is happy:
the type can't see the minus sign. That's the line between what TypeScript
checks and what only a reader can.
