// zod and the Rust that rust-js compiled take and refuse the same sign-ups,
// each in the words cases.json gives it; the compiled Rust in native
// serde_json's (rust/tests/native.rs holds native Rust to the same cases).
import { expect, test } from 'bun:test'
import cases from './cases.json'
import { Email, Name, parseSignup, welcome } from './rust/src/lib.js'
import { Signup } from './zod/signup.ts'

for (const { text, why, zod: issues, rust: refusal } of cases) {
  test(why, () => {
    const zod = Signup.safeParse(JSON.parse(text))
    expect(zod.success ? null : zod.error.issues.map((issue) => issue.message)).toEqual(issues)
    const compiled = parseSignup(text)
    expect(compiled.TAG === 'Ok' ? null : compiled._0).toEqual(refusal)
  })
}

test('a parsed sign-up is welcomed, its fields read through their types', () => {
  const signup = parseSignup('{"name":"Ada","email":"ada@example.com"}')
  if (signup.TAG !== 'Ok') throw new Error(signup._0)
  expect(welcome(signup._0.name, signup._0.email)).toBe("Welcome, Ada! We'll write to ada@example.com.")
  expect(Email.asStr(signup._0.email)).toBe('ada@example.com')
  expect(Name.asStr(signup._0.name)).toBe('Ada')
})
