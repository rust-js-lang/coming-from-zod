// What TypeScript sees of the four shapes, checked by `tsc` (bun run
// types). Each `@ts-expect-error` must be needed, or tsc fails.
import * as rust from './rust/src/lib.js'
import * as zod from './zod/user.ts'

// rust-js's User and NewUser are zod's, both ways.
const user: rust.User = { id: 'u1', name: 'Ada', email: 'ada@example.com', admin: false }
export const asZod: zod.User = user
export const fromZod: rust.User = asZod
const fresh: rust.NewUser = { name: 'Ada', email: 'ada@example.com', admin: false }
export const freshAsZod: zod.NewUser = fresh

// A patch may leave anything out, in both.
export const patch: rust.UserPatch = { name: 'Countess' }
export const zodPatch: zod.UserPatch = { name: 'Countess' }

// A new user has no id, in both.
// @ts-expect-error NewUser has no `id`
export const withId: rust.NewUser = { id: 'u7', name: 'Ada', email: 'ada@example.com', admin: false }
