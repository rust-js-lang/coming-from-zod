// bun chapters/06-optional-and-default/compare.ts: each case, and what zod
// and Rust make of it.
import cases from './cases.json'
import { parseProfile } from './rust/src/lib.js'
import { Profile, issues } from './zod/profile.ts'

// JSON.stringify drops a key whose value is `undefined`, so show it.
const shown = (value: unknown) => JSON.stringify(value, (_, v) => (v === undefined ? '<undefined>' : v))

for (const { text, why } of cases) {
  const zod = Profile.safeParse(JSON.parse(text))
  const rust = parseProfile(text)
  console.log(`${text}   (${why})`)
  console.log(`  zod:  ${zod.success ? shown(zod.data) : `refused: ${issues(zod.error).join(' | ')}`}`)
  console.log(`  rust: ${rust.TAG === 'Ok' ? shown(rust._0) : `refused: ${rust._0}`}`)
}
