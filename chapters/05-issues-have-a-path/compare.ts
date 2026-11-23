// bun chapters/05-issues-have-a-path/compare.ts: each case, and what zod,
// serde_json alone and serde_path_to_error say of it.
import cases from './cases.json'
import { parseOrder, parseOrderPlain } from './rust/src/lib.js'
import { Order, issues } from './zod/order.ts'

const said = (read: { TAG: string; _0: unknown }) => (read.TAG === 'Ok' ? 'taken' : `refused: ${read._0}`)

for (const { text, why } of cases) {
  const zod = Order.safeParse(JSON.parse(text))
  console.log(`${text}   (${why})`)
  console.log(`  zod:   ${zod.success ? 'taken' : `refused: ${issues(zod.error).join(' | ')}`}`)
  console.log(`  plain: ${said(parseOrderPlain(text))}`)
  console.log(`  path:  ${said(parseOrder(text))}`)
}
