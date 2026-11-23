// What a TypeScript caller of a crate can count on. Through its readers,
// everything is checked, as zod's `parse` checks it: cases.json's orders
// are taken and refused alike, in each side's words. Past them, nothing is:
// a value TypeScript builds is trusted to be what its type says, by rust-js
// as by zod. These tests pin what each does with one that isn't, so the
// chapter's numbers are this compiler's, not a guess. rust/tests/native.rs
// holds native Rust to the readers' cases.
import { expect, test } from 'bun:test'
import cases from './cases.json'
import * as rust from './rust/src/lib.js'
import * as zod from './zod/order.ts'

for (const { text, why, zod: issues, rust: refusal, label } of cases) {
  test(why, () => {
    const parsed = zod.Order.safeParse(JSON.parse(text))
    expect(parsed.success ? null : zod.issues(parsed.error)).toEqual(issues)
    const read = rust.parseOrder(text)
    // `TAG` is how TypeScript narrows a `Result`.
    if (read.TAG === 'Err') {
      expect(read._0).toBe(refusal!)
      return
    }
    expect(refusal).toBeNull()
    expect(rust.label(read._0)).toBe(label!)
    expect(rust.count(read._0)).toBe(zod.count(parsed.data!))
  })
}

const order = (() => {
  const read = rust.parseOrder(cases[0]!.text)
  if (read.TAG !== 'Ok') throw new Error(read._0)
  return read._0
})()

test("a number past its Rust type isn't checked: it's taken as a u32's bits", () => {
  expect(rust.double(21)).toBe(42)
  expect(rust.double(-1)).toBe(4294967294)
  expect(rust.double(3.5)).toBe(7)
  expect(rust.double(2 ** 32)).toBe(0)
})

test("an object TypeScript built isn't checked either, on either side", () => {
  const item = { sku: 'C3', qty: -5 }
  // 3 things and -5: -2, as a u32 sum wraps it.
  expect(rust.count(rust.withItem(order, item))).toBe(4294967294)
  const zodOrder = zod.Order.parse(JSON.parse(cases[0]!.text))
  expect(zod.count({ ...zodOrder, items: [...zodOrder.items, item] })).toBe(-2)
})

test('a string union cast past its members goes where no match arm expects', () => {
  expect(rust.label({ ...order, status: 'lost' as rust.Status })).toBe('#7 (lost, 3 things): leave at the door')
})
