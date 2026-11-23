// What TypeScript sees of a role, checked by `tsc` (bun run types). Each
// `@ts-expect-error` must be needed, or tsc fails.
import * as rust from './rust/src/lib.js'
import * as zod from './zod/member.ts'

// rust-js's Role is zod's, the same three strings: each is given where the
// other is asked.
const role: rust.Role = 'editor'
export const asZod: zod.Role = role
export const fromZod: rust.Role = zod.Role.parse('admin')
export const allowed: boolean = rust.canEdit(fromZod) && zod.canEdit(role)

// A string that isn't one isn't one, in both.
// @ts-expect-error 'owner' isn't a rust-js Role
export const notRust: rust.Role = 'owner'
// @ts-expect-error 'owner' isn't a zod Role
export const notZod: zod.Role = 'owner'
