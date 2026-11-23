// bun chapters/09-transform-is-a-reader/compare.ts: each case, and what zod
// and Rust make of it.
import cases from './cases.json'
import { parseSignup, welcome } from './rust/src/lib.js'
import { Signup, issues } from './zod/signup.ts'

for (const { text, why } of cases) {
  const zod = Signup.safeParse(JSON.parse(text))
  const rust = parseSignup(text)
  console.log(`${text}   (${why})`)
  console.log(`  zod:  ${zod.success ? JSON.stringify(zod.data) : `refused: ${issues(zod.error).join(' | ')}`}`)
  console.log(`  rust: ${rust.TAG === 'Ok' ? welcome(rust._0) : `refused: ${rust._0}`}`)
}
