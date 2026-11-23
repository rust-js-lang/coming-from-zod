// bun chapters/08-union-is-untagged/compare.ts: each case, and what zod and
// Rust make of it.
import cases from './cases.json'
import { idLabel, parsePerson, reach } from './rust/src/lib.js'
import { Person, issues } from './zod/person.ts'

for (const { text, why } of cases) {
  const zod = Person.safeParse(JSON.parse(text))
  const rust = parsePerson(text)
  console.log(`${text}   (${why})`)
  console.log(`  zod:  ${zod.success ? JSON.stringify(zod.data) : `refused: ${issues(zod.error).join(' | ')}`}`)
  console.log(`  rust: ${rust.TAG === 'Ok' ? `${JSON.stringify(rust._0)}, ${idLabel(rust._0.id)}: ${reach(rust._0.contact)}` : `refused: ${rust._0}`}`)
}
