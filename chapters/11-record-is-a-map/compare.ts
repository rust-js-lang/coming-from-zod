// bun chapters/11-record-is-a-map/compare.ts: each case, and what zod and
// Rust make of it.
import cases from './cases.json'
import * as rust from './rust/src/lib.js'
import * as zod from './zod/stock.ts'

for (const { text, why } of cases) {
  const z = zod.Stock.safeParse(JSON.parse(text))
  const r = rust.parseStock(text)
  console.log(`${text}   (${why})`)
  console.log(`  zod:  ${z.success ? `counts ${JSON.stringify(z.data.counts)}, tags ${JSON.stringify([...z.data.tags])}` : `refused: ${zod.issues(z.error).join(' | ')}`}`)
  console.log(`  rust: ${r.TAG === 'Ok' ? `counts ${JSON.stringify(Object.fromEntries(r._0.counts))} (a Map), tags ${JSON.stringify([...r._0.tags])}` : `refused: ${r._0}`}`)
}
