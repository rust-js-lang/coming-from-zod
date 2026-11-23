// What TypeScript sees of an order and of a refusal, checked by `tsc` (bun
// run types). Each `@ts-expect-error` must be needed, or tsc fails.
import * as rust from './rust/src/lib.js'
import * as zod from './zod/order.ts'

const order: rust.Order = {
  customer: { name: 'Ada', email: 'ada@example.com' },
  items: [{ sku: 'A1', qty: 2 }],
}

// rust-js's Order is zod's: each is given where the other is asked.
export const asZod: zod.Order = order
export const fromZod: rust.Order = asZod

// A refusal is text, the path first: `items[1].qty: invalid value: ..`.
const read = rust.parseOrder('{}')
export const said: string = read.TAG === 'Err' ? read._0 : rust.summary(read._0)

// @ts-expect-error a refusal is no order
export const notAnOrder: rust.Order = read.TAG === 'Err' ? read._0 : read._0
