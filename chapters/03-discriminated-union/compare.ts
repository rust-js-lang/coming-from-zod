// bun chapters/03-discriminated-union/compare.ts: each case, and what zod and Rust say of it.
import cases from './cases.json'
import { area as rustArea, parseShape } from './rust/src/lib.js'
import { Shape, area as zodArea } from './zod/shape.ts'

for (const { text, why } of cases) {
  const zod = Shape.safeParse(JSON.parse(text))
  const rust = parseShape(text)
  console.log(`${text}   (${why})`)
  console.log(`  zod:  ${zod.success ? `${JSON.stringify(zod.data)}, area ${zodArea(zod.data)}` : `refused: ${zod.error.issues.map((issue) => issue.message).join(' | ')}`}`)
  console.log(`  rust: ${rust.TAG === 'Ok' ? `${JSON.stringify(rust._0)}, area ${rustArea(rust._0)}` : `refused: ${rust._0}`}`)
}
