// zod and the Rust that rust-js compiled take and refuse the same profiles,
// in the words cases.json gives each, and fill in the same defaults. What
// they take is the same object but for one thing: zod keeps a `null` as
// `null`, and rust-js's `None` is `undefined`. rust/tests/native.rs holds
// native Rust to the same cases.
import { expect, test } from 'bun:test'
import cases from './cases.json'
import * as rust from './rust/src/lib.js'
import * as zod from './zod/profile.ts'

// zod's object with each `null` made `undefined`, rust-js's `None`.
const undefinedForNull = (value: object) =>
  Object.fromEntries(Object.entries(value).map(([key, v]) => [key, v ?? undefined]))

for (const { text, why, zod: issues, rust: refusal, greeting } of cases) {
  test(why, () => {
    const parsed = zod.Profile.safeParse(JSON.parse(text))
    expect(parsed.success ? null : zod.issues(parsed.error)).toEqual(issues)
    const read = rust.parseProfile(text)
    expect(read.TAG === 'Ok' ? null : read._0).toEqual(refusal)
    if (!parsed.success || read.TAG !== 'Ok' || greeting === null) return
    expect<object>(read._0).toEqual(undefinedForNull(parsed.data))
    // Each side greets each side's profile alike: rust-js reads an `Option`
    // with `??` and `!= null`, which take `null` as `undefined`. TypeScript
    // doesn't know that, so zod's profile is given as `unknown` first
    // (types.check.ts).
    const zodsAsRust = parsed.data as unknown as rust.Profile
    expect(rust.greeting(read._0)).toBe(greeting)
    expect(zod.greeting(parsed.data)).toBe(greeting)
    expect(rust.greeting(zodsAsRust)).toBe(greeting)
    expect(rust.hasNickname(zodsAsRust)).toBe(rust.hasNickname(read._0))
  })
}
