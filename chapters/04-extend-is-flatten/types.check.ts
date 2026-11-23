// What TypeScript sees of an extended record, checked by `tsc` (bun run
// types). Each `@ts-expect-error` must be needed, or tsc fails.
import * as rust from './rust/src/lib.js'
import * as zod from './zod/records.ts'

const user: rust.User = { id: 'u1', createdAt: '2026-11-23', name: 'Ada', email: 'ada@example.com' }

// rust-js's User is zod's: each is given where the other is asked.
export const asZod: zod.User = user
export const fromZod: rust.User = asZod

// A User is a Base, in both: TypeScript's types are structural, and rust-js
// declares `interface User extends Base`.
export const labelled: string = rust.label(user) + zod.label(user)

// But a Post isn't a User: it has no name or email.
const post: rust.Post = { id: 'p1', createdAt: '2026-11-24', title: 'Hello', authorId: 'u1' }
// @ts-expect-error a Post is missing a User's name and email
export const wrong: rust.User = post
