// What TypeScript sees of a field that may hold nothing, checked by `tsc`
// (bun run types). Each `@ts-expect-error` must be needed, or tsc fails.
import * as rust from './rust/src/lib.js'
import * as zod from './zod/profile.ts'

// zod's nothing is `null`, as the JSON had it, or the key left out.
const fromZod: zod.Profile = { name: 'Ada', nickname: null, bio: null, theme: 'light', newsletter: false }

// rust-js's is `undefined`: Rust has one `None`, and it's JS's `undefined`.
const fromRust: rust.Profile = { name: 'Ada', bio: undefined, theme: 'light', newsletter: false }

// So neither is the other's type.
// @ts-expect-error rust-js's nickname is `string | undefined`, and null isn't one
export const asRust: rust.Profile = fromZod
// @ts-expect-error zod's bio must be there, `string | null`, and undefined isn't one
export const asZod: zod.Profile = fromRust

// Made one: each `null` given as `undefined`.
export const said: string = rust.greeting({
  ...fromZod,
  nickname: fromZod.nickname ?? undefined,
  bio: fromZod.bio ?? undefined,
})
