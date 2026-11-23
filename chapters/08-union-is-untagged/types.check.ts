// What TypeScript sees of a union, checked by `tsc` (bun run types). Each
// `@ts-expect-error` must be needed, or tsc fails.
import * as rust from './rust/src/lib.js'
import * as zod from './zod/person.ts'

// rust-js's Id is zod's, `number | string`: each is given where the other
// is asked.
const id: rust.Id = 42
export const asZod: zod.Id = id
export const fromZod: rust.Id = zod.Id.parse('u-7')
export const label: string = rust.idLabel(fromZod) + zod.idLabel(id)

// An email's contact is one in both, and `in` tells which it is.
const contact: rust.Contact = { email: 'ada@example.com' }
export const asZodContact: zod.Contact = contact
export const isEmail: boolean = 'email' in contact

// A boolean is neither.
// @ts-expect-error a boolean isn't an Id
export const notAnId: rust.Id = true
