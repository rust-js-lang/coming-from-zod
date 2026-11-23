// zod and the Rust that rust-js compiled take and refuse the same bookings,
// in the words cases.json gives each. Where a rule about more than one field
// refuses one, both list every rule it breaks, the same, in the same order.
// rust/tests/native.rs holds native Rust to the same cases.
import { expect, test } from 'bun:test'
import cases from './cases.json'
import * as rust from './rust/src/lib.js'
import * as zod from './zod/booking.ts'

for (const { text, why, zod: issues, rust: refusal, confirmation } of cases) {
  test(why, () => {
    const parsed = zod.Booking.safeParse(JSON.parse(text))
    expect(parsed.success ? null : zod.issues(parsed.error)).toEqual(issues)
    const read = rust.parseBooking(text)
    expect(read.TAG === 'Ok' ? null : read._0).toEqual(refusal)
    // A refusal of the whole has no place in the text: it's every rule's.
    if (refusal !== null && issues !== null && !refusal.includes(' at line ')) expect(refusal).toBe(issues.join(' | '))
    if (!parsed.success || read.TAG !== 'Ok') return
    expect(read._0).toEqual(parsed.data)
    expect(rust.confirmation(read._0)).toBe(confirmation!)
    expect(zod.confirmation(parsed.data)).toBe(confirmation!)
  })
}
