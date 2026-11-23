import { z } from 'zod'

const sleeps = { single: 1, double: 2, suite: 4 } as const

export const Booking = z
  .object({
    checkIn: z.string(),
    checkOut: z.string(),
    guests: z.number().int(),
    room: z.enum(['single', 'double', 'suite']),
  })
  // Rules about more than one field: checked once every field is read, each
  // issue on its field.
  .superRefine((booking, ctx) => {
    const day = /^\d{4}-\d{2}-\d{2}$/
    if (!day.test(booking.checkIn)) ctx.addIssue({ code: 'custom', path: ['checkIn'], message: 'not a day' })
    if (!day.test(booking.checkOut)) ctx.addIssue({ code: 'custom', path: ['checkOut'], message: 'not a day' })
    // Days as `2026-12-01` write them sort as text does.
    if (booking.checkOut <= booking.checkIn) {
      ctx.addIssue({ code: 'custom', path: ['checkOut'], message: 'must be after check-in' })
    }
    if (booking.guests < 1) ctx.addIssue({ code: 'custom', path: ['guests'], message: 'at least one' })
    if (booking.guests > sleeps[booking.room]) {
      ctx.addIssue({ code: 'custom', path: ['guests'], message: `a ${booking.room} room sleeps ${sleeps[booking.room]}` })
    }
  })
export type Booking = z.infer<typeof Booking>

// What the confirmation says.
export function confirmation(booking: Booking): string {
  const room = booking.room[0]!.toUpperCase() + booking.room.slice(1)
  return `${booking.checkIn} → ${booking.checkOut}, ${booking.guests} in a ${room} room`
}

// Each issue as `path: message`.
export function issues(error: z.ZodError): string[] {
  return error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`)
}
