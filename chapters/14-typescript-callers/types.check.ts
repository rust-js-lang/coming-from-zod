// What `tsc` checks of a TypeScript caller, and what it can't (bun run
// types). Each `@ts-expect-error` must be needed, or tsc fails.
import * as rust from './rust/src/lib.js'
import * as zod from './zod/order.ts'

declare const order: rust.Order

// The shapes: a field's type, a union's members, a missing field.
// @ts-expect-error a qty is a number
export const textQty: rust.Item = { sku: 'A1', qty: 'two' }
// @ts-expect-error 'lost' isn't a Status
export const lost: rust.Status = 'lost'
// @ts-expect-error an item has a sku
export const noSku: rust.Item = { qty: 1 }

// A sealed type: only the crate makes an OrderId, and only zod's parse a
// branded one, unless you say "trust me".
// @ts-expect-error a number isn't an OrderId
export const forged: rust.Order = { ...order, id: 7 }
// @ts-expect-error a number isn't zod's branded OrderId either
export const zodForged: zod.Order = { id: 7, status: 'open', items: [] }

// But not a number's range: `number` is all TypeScript has for a `u32`, so
// this is fine to tsc, and only a reader would refuse it.
export const negative: rust.Item = { sku: 'A1', qty: -5 }
export const twice: number = rust.double(-1)

// A `Result` is narrowed by its `TAG`.
const read = rust.parseOrder('{}')
export const said: string = read.TAG === 'Ok' ? rust.label(read._0) : read._0
