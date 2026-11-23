// zod and the Rust that rust-js compiled take and refuse the same stock, in
// the words cases.json gives each, and say the same of what they take. zod's
// counts are a plain object, a record; rust-js's are a JS `Map`.
// rust/tests/native.rs holds native Rust to the same cases.
import { expect, test } from 'bun:test'
import cases from './cases.json'
import * as rust from './rust/src/lib.js'
import * as zod from './zod/stock.ts'

const said = (s: { total: number; low: string[]; apples: number; organic: boolean }) =>
  `${s.total} in all, low: [${s.low.join(', ')}], apples: ${s.apples}, organic: ${s.organic}`

for (const { text, why, zod: issues, rust: refusal, summary } of cases) {
  test(why, () => {
    const parsed = zod.Stock.safeParse(JSON.parse(text))
    expect(parsed.success ? null : zod.issues(parsed.error)).toEqual(issues)
    const read = rust.parseStock(text)
    expect(read.TAG === 'Ok' ? null : read._0).toEqual(refusal)
    if (!parsed.success || read.TAG !== 'Ok') return
    const stock = read._0
    expect(stock.counts).toBeInstanceOf(Map)
    expect(stock.tags).toBeInstanceOf(Set)
    expect(Object.fromEntries(stock.counts)).toEqual(parsed.data.counts)
    expect([...stock.tags]).toEqual([...parsed.data.tags])
    const z = parsed.data
    expect(said({ total: rust.total(stock), low: rust.low(stock, 5), apples: rust.count(stock, 'apple'), organic: rust.tagged(stock, 'organic') })).toBe(summary!)
    expect(said({ total: zod.total(z), low: zod.low(z, 5), apples: zod.count(z, 'apple'), organic: zod.tagged(z, 'organic') })).toBe(summary!)
    // zod's record given to Rust's code: made a `Map` first.
    const asRust: rust.Stock = { counts: new Map(Object.entries(z.counts)), tags: z.tags }
    expect(rust.total(asRust)).toBe(zod.total(z))
  })
}
