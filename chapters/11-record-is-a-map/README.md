# 11. `z.record` is a `HashMap`

## When the keys are data

Most objects have keys you know when you write the code: `name`, `email`.
Some have keys that only arrive with the data: a shop's stock, item by
item. zod calls that a *record*:

```ts
// zod/stock.ts
export const Stock = z.object({
  counts: z.record(z.string(), z.number().int().min(0)),   // { "apple": 3, "pear": 12 }
  tags: z.array(z.string()).transform((tags) => new Set(tags)),
})
```

A record is a plain object used as a lookup table, and TypeScript types it
`Record<string, number>`. A set of tags arrives as a JSON list and becomes
a `Set` with a `.transform`.

## The Rust way: say it's a map

In Rust, a lookup table is a different type from a struct, and you say so:

```rust
// rust/src/lib.rs (shortened)
#[derive(Deserialize)]
pub struct Stock {
    pub counts: HashMap<String, u32>,
    pub tags: HashSet<String>,
}

pub fn count(stock: &Stock, item: &str) -> u32 {
    stock.counts.get(item).copied().unwrap_or(0)
}
```

serde reads a JSON object into a `HashMap`, and a JSON list into a
`HashSet`. There's no transform step, because the type says it's a set.

## What rust-js writes

rust-js gives std's map and set as JavaScript's own `Map` and `Set`:

```ts
// rust/src/lib.d.ts (generated)
export interface Stock {
    counts: Map<string, number>;
    tags: Set<string>;
}
```

```js
// rust/src/lib.js (generated)
export function count(stock, item) {
  return stock.counts.get(item) ?? 0;
}

export function tagged(stock, tag) {
  return stock.tags.has(tag);
}

export function low(stock, below) {
  const items = Array.from(stock.counts)
    .filter(([, count]) => count < below)
    .map(([item]) => item);
  items.sort($cmp);
  return items;
}
```

`.get(item) ?? 0` is what you'd write for a `Map` in TypeScript.

## Side by side

`bun chapters/11-record-is-a-map/compare.ts`:

```
{"counts":{"apple":3,"pear":12,"fig":0},"tags":["organic","local"]}   (a shop)
  zod:  counts {"apple":3,"pear":12,"fig":0}, tags ["organic","local"]
  rust: counts {"apple":3,"pear":12,"fig":0} (a Map), tags ["organic","local"]
{"counts":{"apple":3},"tags":["organic","organic"]}   (a tag twice: a set keeps one)
  zod:  counts {"apple":3}, tags ["organic"]
  rust: counts {"apple":3} (a Map), tags ["organic"]
{"counts":{"apple":1,"apple":7},"tags":[]}   (a key twice: the last one counts)
  zod:  counts {"apple":7}, tags []
  rust: counts {"apple":7} (a Map), tags []
```

(The rest are in [cases.json](cases.json).) They agree on every case:
the same counts, the same tags, a key given twice keeps its last value in
both, and the same refusals for a negative or fractional count.

## Where it's different

- **A `Map`, not an object.** zod's counts are a plain object, so
  `stock.counts.apple` works and so does `JSON.stringify`. rust-js's are
  a `Map`: `stock.counts.get('apple')`, and `JSON.stringify` gives `{}`
  for a `Map` (use `Object.fromEntries` first). TypeScript keeps you honest
  about which is which (`types.check.ts`). One gift of the `Map`: a key
  like `"constructor"` or `"__proto__"` is just a key, where a plain
  object needs `Object.hasOwn` to be safe. Note the zod version's `count`.
- **The value type is checked once, at the door.** In zod and in Rust, a
  record's values are all one type. In TypeScript, `stock.counts[item]` is
  typed `number`, but it's `undefined` for an item that isn't there unless
  you turn on `noUncheckedIndexedAccess`. Rust's `get` returns an
  `Option`, so you have to say what "not there" means (`unwrap_or(0)`).
- **Numbers wrap.** A `u32` count that adds up past 4,294,967,295 wraps
  around in rust-js, as in a release build of Rust; JavaScript's numbers
  just keep going. If totals can get that big, use `u64`, or `checked_add`
  to say what should happen.
- **Order.** A `HashMap` has no order, so `low` sorts its answer. zod's
  object keeps the order the keys arrived in. If order matters, Rust's
  `BTreeMap` keeps keys sorted, and the `indexmap` crate keeps arrival
  order.

## Try it

Change `HashMap` to `BTreeMap`, and `HashSet` to `BTreeSet`, and run
`bun run rust`, then `bun run test`. The Rust reads the same and native
Rust's tests pass; the `.d.ts` still says `Map` and `Set`. But one case
fails, "a shop": the tags now come out sorted, `local` before `organic`,
where zod's `Set` keeps the order they arrived in. Same data, a different
order, and the test noticed.
