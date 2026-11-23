// bun chapters/15-recursion-and-where-zod-wins/compare.ts: each thread, and
// what zod and Rust make of it.
import cases from './cases.json'
import * as rust from './rust/src/lib.js'
import * as zod from './zod/comment.ts'

const short = (text: string) => (text.length > 80 ? `${text.slice(0, 77)}...` : text)

for (const { text, why } of cases) {
  const z = zod.Comment.safeParse(JSON.parse(text))
  const r = rust.parseThread(text)
  console.log(`${short(text)}   (${why})`)
  console.log(`  zod:  ${z.success ? `${zod.count(z.data)} comments, ${zod.depth(z.data)} deep` : `refused: ${zod.issues(z.error).join(' | ')}`}`)
  console.log(`  rust: ${r.TAG === 'Ok' ? `${rust.count(r._0)} comments, ${rust.depth(r._0)} deep` : `refused: ${r._0}`}`)
}
