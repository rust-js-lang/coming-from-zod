// bun chapters/02-refine-is-a-newtype/compare.ts: each case, and what zod and Rust say of it.
import cases from './cases.json'
import { parseSignup as rust } from './rust/src/lib.js'
import { Signup } from './zod/signup.ts'

for (const { text, why } of cases) {
  const zod = Signup.safeParse(JSON.parse(text))
  const compiled = rust(text)
  console.log(`${text}   (${why})`)
  console.log(`  zod:  ${zod.success ? 'ok' : `refused: ${zod.error.issues.map((issue) => issue.message).join(' | ')}`}`)
  console.log(`  rust: ${compiled.TAG === 'Ok' ? 'ok' : `refused: ${compiled._0}`}`)
}
