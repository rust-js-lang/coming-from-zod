// zod and the Rust that rust-js compiled take and refuse the same people,
// in the words cases.json gives each. What they take is the same object, an
// id a number or a string, a contact an email's object or a phone's, and
// each side's functions say the same of the other's. rust/tests/native.rs
// holds native Rust to the same cases.
import { expect, test } from 'bun:test'
import cases from './cases.json'
import * as rust from './rust/src/lib.js'
import * as zod from './zod/person.ts'

// zod's object with each `null` made `undefined`, rust-js's `None` (chapter 6).
const undefinedForNull = (value: object): object =>
  Object.fromEntries(
    Object.entries(value).map(([key, v]) => [key, v === null ? undefined : typeof v === 'object' ? undefinedForNull(v) : v]),
  )

for (const { text, why, zod: issues, rust: refusal, said } of cases) {
  test(why, () => {
    const parsed = zod.Person.safeParse(JSON.parse(text))
    expect(parsed.success ? null : zod.issues(parsed.error)).toEqual(issues)
    const read = rust.parsePerson(text)
    expect(read.TAG === 'Ok' ? null : read._0).toEqual(refusal)
    if (!parsed.success || read.TAG !== 'Ok') return
    expect<object>(read._0).toEqual(undefinedForNull(parsed.data))
    const { id, contact } = parsed.data as unknown as rust.Person
    expect(`${rust.idLabel(id)}: ${rust.reach(contact)}`).toBe(said!)
    expect(`${zod.idLabel(read._0.id)}: ${zod.reach(read._0.contact as zod.Contact)}`).toBe(said!)
  })
}
