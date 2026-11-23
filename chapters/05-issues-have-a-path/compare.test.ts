// zod and the Rust that rust-js compiled take and refuse the same orders, in
// the words cases.json gives each. rust/tests/native.rs holds native Rust to
// the same cases, so the JS says what native Rust says, path and all.
import { expect, test } from 'bun:test'
import cases from './cases.json'
import * as rust from './rust/src/lib.js'
import { Order, issues } from './zod/order.ts'

const refusal = (read: { TAG: string; _0: unknown }) => (read.TAG === 'Ok' ? null : read._0)

for (const { text, why, zod, plain, rust: withPath } of cases) {
  test(why, () => {
    const parsed = Order.safeParse(JSON.parse(text))
    expect(parsed.success ? null : issues(parsed.error)).toEqual(zod)
    expect(refusal(rust.parseOrderPlain(text))).toEqual(plain)
    const read = rust.parseOrder(text)
    expect(refusal(read)).toEqual(withPath)
    if (parsed.success && read.TAG === 'Ok') expect(read._0).toEqual(parsed.data)
  })
}

test('the first issue is at the same place on both sides', () => {
  // zod's path `items.1.qty` and serde_path_to_error's `items[1].qty` name
  // one place, written two ways; a missing field is the exception, its
  // path its parent's, and its name in the message.
  for (const { zod, rust: withPath } of cases) {
    if (zod === null || withPath === null) continue
    const zodPath = zod[0].split(': ')[0]
    const rustPath = withPath.split(': ')[0].replace(/\[(\d+)\]/g, '.$1')
    const missing = withPath.match(/missing field `(\w+)`/)
    expect(missing ? `${rustPath}.${missing[1]}` : rustPath).toBe(zodPath)
  }
})

test("an order taken is the same object, and Rust's code reads it", () => {
  const read = rust.parseOrder(cases[0].text)
  if (read.TAG !== 'Ok') throw new Error('the order was refused')
  expect(rust.summary(read._0)).toBe('Ada ordered 3')
})
