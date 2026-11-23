// zod and the Rust that rust-js compiled take and refuse the same signups,
// in the words cases.json gives each, and turn what they take into the same
// values: the email trimmed and lower-case, the age a number, the tags a
// list. rust/tests/native.rs holds native Rust to the same cases.
import { expect, test } from 'bun:test'
import cases from './cases.json'
import * as rust from './rust/src/lib.js'
import * as zod from './zod/signup.ts'

for (const { text, why, zod: issues, rust: refusal, welcome } of cases) {
  test(why, () => {
    const parsed = zod.Signup.safeParse(JSON.parse(text))
    expect(parsed.success ? null : zod.issues(parsed.error)).toEqual(issues)
    const read = rust.parseSignup(text)
    expect(read.TAG === 'Ok' ? null : read._0).toEqual(refusal)
    if (!parsed.success || read.TAG !== 'Ok' || welcome === null) return
    // The email is opaque to TypeScript (chapter 2): Rust's `as_str` reads it.
    expect(rust.Email.asStr(read._0.email)).toBe(parsed.data.email)
    expect(read._0.age).toBe(parsed.data.age)
    expect(read._0.tags).toEqual(parsed.data.tags)
    expect(rust.welcome(read._0)).toBe(welcome)
    expect(zod.welcome(parsed.data)).toBe(welcome)
  })
}
