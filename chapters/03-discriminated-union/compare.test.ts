// zod and the Rust that rust-js compiled take and refuse the same shapes,
// each in the words cases.json gives it, and what they take is the same
// JavaScript object, `{ type: "circle", radius: 2 }`, with the same area.
// rust/tests/native.rs holds native Rust to the same cases.
import { expect, test } from 'bun:test'
import cases from './cases.json'
import { area as rustArea, parseShape } from './rust/src/lib.js'
import { Shape, area as zodArea } from './zod/shape.ts'

for (const { text, why, zod: issues, rust: refusal } of cases) {
  test(why, () => {
    const zod = Shape.safeParse(JSON.parse(text))
    expect(zod.success ? null : zod.error.issues.map((issue) => issue.message)).toEqual(issues)
    const rust = parseShape(text)
    expect(rust.TAG === 'Ok' ? null : rust._0).toEqual(refusal)
    if (zod.success && rust.TAG === 'Ok') {
      expect(rust._0).toEqual(zod.data)
      expect(rustArea(rust._0)).toBe(zodArea(zod.data))
      // One union, two producers: zod's area takes Rust's shape, and Rust's zod's.
      expect(zodArea(rust._0)).toBe(rustArea(zod.data))
    }
  })
}
