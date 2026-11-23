// What TypeScript sees of a record, checked by `tsc` (bun run types). Each
// `@ts-expect-error` must be needed, or tsc fails.
import * as rust from './rust/src/lib.js'
import * as zod from './zod/stock.ts'

// zod's counts are a record, `Record<string, number>`; rust-js's a `Map`.
const zodStock: zod.Stock = { counts: { apple: 3 }, tags: new Set(['organic']) }
// @ts-expect-error a record isn't a Map
export const asRust: rust.Stock = zodStock

// One made from the other: `new Map(Object.entries(..))`, and back.
export const converted: rust.Stock = { counts: new Map(Object.entries(zodStock.counts)), tags: zodStock.tags }
export const back: zod.Stock = { counts: Object.fromEntries(converted.counts), tags: converted.tags }
export const total: number = rust.total(converted)
