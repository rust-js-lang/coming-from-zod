// bun chapters/07-enum-is-an-enum/compare.ts: each case, and what zod and
// Rust make of it.
import cases from './cases.json'
import { canEdit, parseMember } from './rust/src/lib.js'
import { Member, issues } from './zod/member.ts'

for (const { text, why } of cases) {
  const zod = Member.safeParse(JSON.parse(text))
  const rust = parseMember(text)
  console.log(`${text}   (${why})`)
  console.log(`  zod:  ${zod.success ? `${JSON.stringify(zod.data)}, can edit: ${canEdit(zod.data.role)}` : `refused: ${issues(zod.error).join(' | ')}`}`)
  console.log(`  rust: ${rust.TAG === 'Ok' ? `${JSON.stringify(rust._0)}, can edit: ${canEdit(rust._0.role)}` : `refused: ${rust._0}`}`)
}
