// bun chapters/14-typescript-callers/compare.ts: what the readers take and
// refuse, then what each side does with values TypeScript built itself.
import cases from './cases.json'
import * as rust from './rust/src/lib.js'
import * as zod from './zod/order.ts'

for (const { text, why } of cases) {
  const z = zod.Order.safeParse(JSON.parse(text))
  const r = rust.parseOrder(text)
  console.log(`${text}   (${why})`)
  console.log(`  zod:  ${z.success ? `taken, ${zod.count(z.data)} things` : `refused: ${zod.issues(z.error).join(' | ')}`}`)
  console.log(`  rust: ${r.TAG === 'Ok' ? rust.label(r._0) : `refused: ${r._0}`}`)
}

const read = rust.parseOrder(cases[0]!.text)
if (read.TAG !== 'Ok') throw new Error(read._0)
const order = read._0
const zodOrder = zod.Order.parse(JSON.parse(cases[0]!.text))
console.log('\nValues TypeScript built, past the readers:')
console.log(`  rust.double(-1)                       ${rust.double(-1)}`)
console.log(`  rust.double(3.5)                      ${rust.double(3.5)}`)
console.log(`  rust.count(+ an item of qty -5)       ${rust.count(rust.withItem(order, { sku: 'C3', qty: -5 }))}`)
console.log(`  zod's count(+ an item of qty -5)      ${zod.count({ ...zodOrder, items: [...zodOrder.items, { sku: 'C3', qty: -5 }] })}`)
