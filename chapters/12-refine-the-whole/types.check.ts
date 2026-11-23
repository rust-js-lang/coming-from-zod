// What TypeScript sees of a booking, checked by `tsc` (bun run types).
import * as rust from './rust/src/lib.js'
import * as zod from './zod/booking.ts'

// The two are one type, both ways. Neither type says the rules hold: those
// are checked as it's read, by zod's `.superRefine` and Rust's `try_from`.
const booking: rust.Booking = { checkIn: '2026-12-01', checkOut: '2026-12-04', guests: 2, room: 'double' }
export const asZod: zod.Booking = booking
export const fromZod: rust.Booking = asZod
export const said: string = rust.confirmation(fromZod)
