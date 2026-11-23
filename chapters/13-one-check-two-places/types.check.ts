// What TypeScript sees of the check, checked by `tsc` (bun run types).
import * as rust from './rust/src/lib.js'
import * as zod from './zod/signup.ts'

// Both answer a body with a status and JSON, the same shape: a browser's
// code can call either.
type Answer = (body: string) => [number, string]
export const fromRust: Answer = rust.respond
export const fromZod: Answer = zod.respond
export const signup: zod.Signup = { name: 'Ada', email: 'ada@example.com', age: 36 } satisfies rust.Signup
