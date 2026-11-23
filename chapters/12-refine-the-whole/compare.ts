// bun chapters/12-refine-the-whole/compare.ts: each case, and what zod and
// Rust make of it.
import cases from './cases.json'
import * as rust from './rust/src/lib.js'
import * as zod from './zod/booking.ts'

for (const { text, why } of cases) {
  const z = zod.Booking.safeParse(JSON.parse(text))
  const r = rust.parseBooking(text)
  console.log(`${text}   (${why})`)
  console.log(`  zod:  ${z.success ? zod.confirmation(z.data) : `refused: ${zod.issues(z.error).join(' | ')}`}`)
  console.log(`  rust: ${r.TAG === 'Ok' ? rust.confirmation(r._0) : `refused: ${r._0}`}`)
}
