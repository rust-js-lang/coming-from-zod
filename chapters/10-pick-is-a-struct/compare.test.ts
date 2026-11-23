// zod and the Rust that rust-js compiled take and refuse new users and
// patches, each in the words cases.json gives it, and make the same user of
// what both take, and show the same of it to others. rust/tests/native.rs
// holds native Rust to the same cases.
import { expect, test } from 'bun:test'
import cases from './cases.json'
import * as rust from './rust/src/lib.js'
import * as zod from './zod/user.ts'

const ada = { id: 'u1', name: 'Ada', email: 'ada@example.com', admin: false }

for (const { kind, text, why, zod: issues, rust: refusal, user, public: shown } of cases) {
  test(why, () => {
    const parsed = (kind === 'new' ? zod.NewUser : zod.UserPatch).safeParse(JSON.parse(text))
    expect(parsed.success ? null : zod.issues(parsed.error)).toEqual(issues)
    const read = kind === 'new' ? rust.parseNewUser(text) : rust.parsePatch(text)
    expect(read.TAG === 'Ok' ? null : read._0).toEqual(refusal)
    if (read.TAG !== 'Ok') return
    const made = kind === 'new' ? rust.create('u9', read._0 as rust.NewUser) : rust.apply(ada, read._0 as rust.UserPatch)
    expect(JSON.stringify(made)).toBe(user!)
    expect(rust.publicJson(made)).toBe(shown!)
    if (!parsed.success) return
    const zodMade = kind === 'new' ? zod.create('u9', parsed.data as zod.NewUser) : zod.apply(ada, parsed.data)
    expect(JSON.stringify(zodMade)).toBe(user!)
    expect(zod.publicJson(zodMade)).toBe(shown!)
  })
}
