// bun chapters/04-extend-is-flatten/compare.ts: each case, and what zod and Rust say of it.
import cases from './cases.json'
import { parsePost, parseUser } from './rust/src/lib.js'
import { Post, User } from './zod/records.ts'

for (const { kind, text, why } of cases) {
  const zod = (kind === 'user' ? User : Post).safeParse(JSON.parse(text))
  const rust = kind === 'user' ? parseUser(text) : parsePost(text)
  console.log(`${kind} ${text}   (${why})`)
  console.log(`  zod:  ${zod.success ? JSON.stringify(zod.data) : `refused: ${zod.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(' | ')}`}`)
  console.log(`  rust: ${rust.TAG === 'Ok' ? JSON.stringify(rust._0) : `refused: ${rust._0}`}`)
}
