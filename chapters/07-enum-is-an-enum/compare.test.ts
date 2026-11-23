// zod and the Rust that rust-js compiled take and refuse the same members,
// in the words cases.json gives each. What they take is the same object, its
// role the same string, and each side's functions of a role answer the same
// of every role. rust/tests/native.rs holds native Rust to the same cases.
import { expect, test } from 'bun:test'
import cases from './cases.json'
import * as rust from './rust/src/lib.js'
import * as zod from './zod/member.ts'

for (const { text, why, zod: issues, rust: refusal } of cases) {
  test(why, () => {
    const parsed = zod.Member.safeParse(JSON.parse(text))
    expect(parsed.success ? null : zod.issues(parsed.error)).toEqual(issues)
    const read = rust.parseMember(text)
    expect(read.TAG === 'Ok' ? null : read._0).toEqual(refusal)
    if (parsed.success && read.TAG === 'Ok') expect(read._0).toEqual(parsed.data)
  })
}

test("the roles are the same strings, in the same order", () => {
  expect(rust.roles()).toEqual(zod.roles())
  expect(rust.Role.ALL).toEqual(zod.Role.options)
  for (const role of zod.Role.options) expect(rust.roleName(role)).toBe(role)
})

test('each side answers the same of every role, and of every pair', () => {
  for (const role of zod.Role.options) {
    expect(rust.canEdit(role)).toBe(zod.canEdit(role))
    for (const min of zod.Role.options) expect(rust.atLeast(role, min)).toBe(zod.atLeast(role, min))
  }
})
