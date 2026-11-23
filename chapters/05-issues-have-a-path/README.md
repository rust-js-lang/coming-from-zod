# 5. An issue has a path

## What zod tells you when it says no

An order holds a customer and a list of items:

```json
{
  "customer": { "name": "Ada", "email": "ada@example.com" },
  "items": [{ "sku": "A1", "qty": 2 }, { "sku": "B2", "qty": -1 }]
}
```

The second item's `qty` is wrong. zod says exactly where:

```ts
// zod/order.ts
export const Order = z.object({
  customer: z.object({ name: z.string(), email: z.string() }),
  items: z.array(z.object({ sku: z.string(), qty: z.number().int().min(0) })),
})

Order.safeParse(order).error.issues
// [{ path: ['items', 1, 'qty'], message: 'Too small: expected number to be >=0' }]
```

Each issue has a **path**: the keys and indexes you'd follow from the top
of the value to the bad part. A form can put the message next to the right
box, and a log line tells you which item it was.

## What serde_json tells you

serde_json says where in the *text* it stopped, here of the order written
on one line:

```
invalid value: integer `-1`, expected u32 at line 1 column 103
```

That's right, and it's what you want when someone hand-wrote a broken
file. But "column 103" means nothing to a form, and in a list of 500
items you'd count characters to find which one.

## The Rust way: ask the reader where it was

The path isn't lost. As serde reads, it always knows where it is: inside
`items`, at index 1, at the key `qty`. It just doesn't tell you. The
crate [serde_path_to_error](https://docs.rs/serde_path_to_error) wraps
the reader, keeps track of where it is, and when the read fails, hands
you that place with the error:

```rust
// rust/src/lib.rs (shortened)
pub fn parse_order(text: &str) -> Result<Order, String> {
    let reader = &mut serde_json::Deserializer::from_str(text);
    serde_path_to_error::deserialize(reader)
        .map_err(|error| format!("{}: {}", error.path(), error.inner()))
}
```

Think of reading a building's floor plan aloud: "second floor, third
room, the window". serde_json alone tells you "the 103rd word you read
was wrong". serde_path_to_error tells you the floor, room and window.

```
items[1].qty: invalid value: integer `-1`, expected u32 at line 1 column 103
```

`Order`, `Customer` and `Item` are the same `#[derive(Deserialize)]`
structs as ever. The path costs nothing until you ask for it: the plain
`serde_json::from_str` beside it, `parse_order_plain`, keeps no path.

## What rust-js writes

rust-js knows serde_path_to_error, as it knows serde_json. Its runtime's
JSON reader keeps the path, by the crate's own rules, only when the read
goes through it:

```js
// rust/src/lib.js (generated)
export function parseOrder(text) {
  const reader = new $JsonReader(text);
  const result = $jsonPathRead(reader, orderDeserialize_deserialize);
  return result.TAG === "Err"
    ? {
        TAG: "Err",
        _0: `${$displayJsonPath(result._0.path)}: ${$displayJsonError(result._0.original)}`,
      }
    : result;
}
```

`$jsonPathRead` reads with a list beside it, the path so far: it pushes
`items`, then `1`, then `qty` as it goes in, and pops each on the way
out. When something's wrong, the error takes a copy of the list. The
error itself, `{ path, original }`, is serde_path_to_error's `Error`, and
`error.path()` and `error.inner()` are its two halves. `parseOrderPlain`
is `$fromJson(text, ..)`, which keeps no list at all.

## Side by side

`bun chapters/05-issues-have-a-path/compare.ts`:

```
{"customer":{"name":"Ada","email":"ada@example.com"},"items":[{"sku":"A1","qty":2},{"sku":"B2","qty":-1}]}   (the second item's qty is below 0)
  zod:   refused: items.1.qty: Too small: expected number to be >=0
  plain: refused: invalid value: integer `-1`, expected u32 at line 1 column 103
  path:  refused: items[1].qty: invalid value: integer `-1`, expected u32 at line 1 column 103
{"customer":{"name":"Ada","email":"ada@example.com"},"items":[{"sku":"A1","qty":"two"}]}   (the first item's qty is text)
  zod:   refused: items.0.qty: Invalid input: expected number, received string
  plain: refused: invalid type: string "two", expected u32 at line 1 column 85
  path:  refused: items[0].qty: invalid type: string "two", expected u32 at line 1 column 85
{"customer":{"name":"Ada","email":7},"items":[]}   (the customer's email is a number)
  zod:   refused: customer.email: Invalid input: expected string, received number
  plain: refused: invalid type: integer `7`, expected a string at line 1 column 35
  path:  refused: customer.email: invalid type: integer `7`, expected a string at line 1 column 35
{"customer":{"name":"Ada"},"items":[]}   (the customer has no email)
  zod:   refused: customer.email: Invalid input: expected string, received undefined
  plain: refused: missing field `email` at line 1 column 26
  path:  refused: customer: missing field `email` at line 1 column 26
{"customer":{"name":"Ada","email":"ada@example.com"},"items":{}}   (items is an object, not a list)
  zod:   refused: items: Invalid input: expected array, received object
  plain: refused: invalid type: map, expected a sequence at line 1 column 61
  path:  refused: items: invalid type: map, expected a sequence at line 1 column 61
{"customer":{"name":"Ada","email":7},"items":[{"sku":"A1","qty":-1},{"qty":1.5}]}   (four things wrong at once)
  zod:   refused: customer.email: Invalid input: expected string, received number | items.0.qty: Too small: expected number to be >=0 | items.1.sku: Invalid input: expected string, received undefined | items.1.qty: Invalid input: expected int, received number
  plain: refused: invalid type: integer `7`, expected a string at line 1 column 35
  path:  refused: customer.email: invalid type: integer `7`, expected a string at line 1 column 35
```

(The order that's taken is in [cases.json](cases.json) too.) Each line is
checked, by `compare.test.ts`, against what native Rust says
(`rust/tests/native.rs`), and the first issue is at the same place as
zod's.

## Where it's different

- **zod lists every problem. serde stops at the first.** The last case
  has four things wrong: zod gives four issues, serde one. serde reads the
  text once, front to back, and stops where it can't go on, the way a
  compiler used to stop at the first error. For a form that shows every
  bad box at once, that's a real difference; for an API that answers 400,
  the first is usually enough.
- **A missing field is at its parent.** zod says `customer.email` is
  missing. serde says `customer` is missing a field, and names it in the
  message, `missing field` then `email`. Same place, said from one step
  up: serde only finds out a field is missing when it reaches the end
  of the object.
- **The same place, written two ways.** zod's path is a list,
  `['items', 1, 'qty']`, which the chapter joins as `items.1.qty`;
  serde_path_to_error writes `items[1].qty`. `compare.test.ts` checks
  they name the same place.
- **Some places can't be named.** What chapter 4 flattens, and what an
  internally tagged enum like chapter 3's holds, serde reads in two steps:
  it gathers the fields first, then reads them. A mistake found in the
  second step is placed at the whole value. So chapter 4's user with
  `"id": 7` says the root, which `Display` leaves out, and the message is
  serde_json's alone.

## A gap this chapter found

rust-js refused serde_path_to_error when this chapter was written: its
reader didn't keep a path, and serde_json's `Deserializer::from_str` was
refused. We filed
[rust-js#2379](https://github.com/rust-js-lang/rust-js/issues/2379) and
sent the change,
[rust-js#2380](https://github.com/rust-js-lang/rust-js/pull/2380), which
keeps the path in rust-js's reader by the crate's own rules, checked
against native serde_path_to_error. Until it lands, we carry it as
`patches/0004-serde-path-to-error.patch`. This chapter's test is the
check: without the patch, rust-js refuses `parse_order`. See
[PATCHES.md](../../PATCHES.md).

## Try it

In `cases.json`, change the second case's `"sku":"B2"` to `"sku":5` and
run `bun run test`. It fails, printing what zod and Rust now say: zod
lists two issues, `items.1.sku` and `items.1.qty`, and Rust only the
first, `items[1].sku`. Then give `parse_order` `parse_order_plain`'s
body: the path is gone, and with it the only way to tell which item it
was.
