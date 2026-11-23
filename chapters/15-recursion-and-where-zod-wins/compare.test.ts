// zod and the Rust that rust-js compiled take and refuse the same threads, in
// the words cases.json gives each, but for one: a thread nested past
// serde_json's recursion limit, which zod takes. What both take is the same
// object, and both say the same of it. rust/tests/native.rs holds native
// Rust to the same cases.
import { expect, test } from 'bun:test'
import cases from './cases.json'
import * as rust from './rust/src/lib.js'
import * as zod from './zod/comment.ts'

const summary = (count: number, depth: number, authors: string[]) => `${count} comments, ${depth} deep, by ${authors.join(', ')}`

for (const { text, why, zod: issues, rust: refusal, summary: said } of cases) {
  test(why, () => {
    const parsed = zod.Comment.safeParse(JSON.parse(text))
    expect(parsed.success ? null : zod.issues(parsed.error)).toEqual(issues)
    const read = rust.parseThread(text)
    expect(read.TAG === 'Ok' ? null : read._0).toEqual(refusal)
    if (read.TAG !== 'Ok') return
    expect(summary(rust.count(read._0), rust.depth(read._0), rust.authors(read._0))).toBe(said!)
    if (!parsed.success) return
    expect(read._0).toEqual(parsed.data)
    expect(summary(zod.count(parsed.data), zod.depth(parsed.data), zod.authors(parsed.data))).toBe(said!)
  })
}
