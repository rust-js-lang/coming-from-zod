// What TypeScript sees of a field that's changed as it's read, checked by
// `tsc` (bun run types). Each `@ts-expect-error` must be needed, or tsc fails.
import * as rust from './rust/src/lib.js'
import * as zod from './zod/signup.ts'

// zod has two types, what goes in and what comes out.
export const sent: zod.SignupInput = { email: ' Ada@Example.com ', age: '36', tags: 'rust, zod' }
export const kept: zod.Signup = { email: 'ada@example.com', age: 36, tags: ['rust', 'zod'] }

// rust-js declares what comes out: the struct. What may go in is its reader's.
const read = rust.parseSignup('{"email":"ada@example.com","age":36,"tags":"rust"}')
export const tags: string[] = read.TAG === 'Ok' ? read._0.tags : []

// Its email is an `Email`, which only its reader makes (chapter 2).
// @ts-expect-error a string isn't an Email
export const madeUp: rust.Signup = { email: 'ada@example.com', age: 36, tags: [] }
