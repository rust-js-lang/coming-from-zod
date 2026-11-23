// What TypeScript lets through, checked by `tsc` (bun run types). Each
// `@ts-expect-error` must be needed, or tsc fails: it marks a mistake
// TypeScript catches.
import * as rust from './rust/src/lib.js'
import * as zod from './zod/signup.ts'

// zod: the brand makes a plain string not an Email...
// @ts-expect-error a string isn't a zod Email
zod.welcome('Ada' as zod.Name, 'not an email')
// ...but one `as` makes it one, as an Email is a string underneath.
zod.welcome('Ada' as zod.Name, 'not an email' as zod.Email)

// rust-js: a plain string isn't an Email either...
const signup = rust.parseSignup('{"name":"Ada","email":"ada@example.com"}')
if (signup.TAG === 'Ok') rust.welcome(signup._0.name, signup._0.email)
// @ts-expect-error a string isn't a rust-js Email
rust.welcome(signup.TAG === 'Ok' ? signup._0.name : undefined!, 'not an email')
// ...and nor does one `as` make it one: a string and an Email don't overlap.
// @ts-expect-error a string can't be cast to a rust-js Email
rust.welcome(undefined!, 'not an email' as rust.Email)
// Only `as unknown as`, which says "trust me", gets past it, in any TypeScript.
rust.welcome(undefined!, 'not an email' as unknown as rust.Email)
