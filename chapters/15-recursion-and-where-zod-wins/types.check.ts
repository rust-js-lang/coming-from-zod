// What TypeScript sees of a type that holds itself, checked by `tsc` (bun
// run types).
import * as rust from './rust/src/lib.js'
import * as zod from './zod/comment.ts'

// The same recursive type in both, each given where the other is asked.
const thread: rust.Comment = { author: 'ada', text: 'Hi', replies: [{ author: 'grace', text: 'Hello', replies: [] }] }
export const asZod: zod.Comment = thread
export const fromZod: rust.Comment = asZod
export const many: number = rust.count(fromZod) + zod.count(thread)
