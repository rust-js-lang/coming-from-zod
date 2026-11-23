// bun chapters/10-pick-is-a-struct/compare.ts: each case, and what zod and
// Rust make of it: a new user, given an id, or Ada with a patch applied.
import cases from './cases.json'
import * as rust from './rust/src/lib.js'
import * as zod from './zod/user.ts'

const ada = { id: 'u1', name: 'Ada', email: 'ada@example.com', admin: false }

for (const { kind, text, why } of cases) {
  const z = (kind === 'new' ? zod.NewUser : zod.UserPatch).safeParse(JSON.parse(text))
  const zodUser = !z.success ? null : kind === 'new' ? zod.create('u9', z.data as zod.NewUser) : zod.apply(ada, z.data)
  const read = kind === 'new' ? rust.parseNewUser(text) : rust.parsePatch(text)
  const rustUser =
    read.TAG !== 'Ok' ? null : kind === 'new' ? rust.create('u9', read._0 as rust.NewUser) : rust.apply(ada, read._0 as rust.UserPatch)
  console.log(`${kind} ${text}   (${why})`)
  console.log(`  zod:  ${zodUser ? JSON.stringify(zodUser) : `refused: ${zod.issues(z.error!).join(' | ')}`}`)
  console.log(`  rust: ${rustUser ? JSON.stringify(rustUser) : `refused: ${read._0}`}`)
}
