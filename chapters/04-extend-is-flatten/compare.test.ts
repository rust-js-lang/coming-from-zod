// zod and the Rust that rust-js compiled take and refuse the same records,
// each in the words cases.json gives it, and what they take is the same flat
// JavaScript object, which either side's `label` takes. rust/tests/native.rs
// holds native Rust to the same cases.
import { expect, test } from 'bun:test'
import cases from './cases.json'
import * as rust from './rust/src/lib.js'
import * as zod from './zod/records.ts'

for (const { kind, text, why, zod: issues, rust: refusal } of cases) {
  test(why, () => {
    const parsed = (kind === 'user' ? zod.User : zod.Post).safeParse(JSON.parse(text))
    expect(parsed.success ? null : parsed.error.issues.map((issue) => issue.message)).toEqual(issues)
    const read = kind === 'user' ? rust.parseUser(text) : rust.parsePost(text)
    expect(read.TAG === 'Ok' ? null : read._0).toEqual(refusal)
    if (parsed.success && read.TAG === 'Ok') {
      expect(read._0).toEqual(parsed.data)
      // Each side's label takes the other's record, as each takes its own.
      expect(rust.label(parsed.data)).toBe(zod.label(read._0))
      expect(rust.label(read._0)).toBe(zod.label(parsed.data))
    }
  })
}

test("a post's byline reads its own fields and its base's", () => {
  const user = rust.parseUser('{"id":"u1","createdAt":"2026-11-23","name":"Ada","email":"ada@example.com"}')
  const post = rust.parsePost('{"id":"p1","createdAt":"2026-11-24","title":"Hello","authorId":"u1"}')
  if (user.TAG !== 'Ok' || post.TAG !== 'Ok') throw new Error('a case was refused')
  expect(rust.byline(post._0, user._0)).toBe('Hello by Ada (p1, created 2026-11-24)')
})
