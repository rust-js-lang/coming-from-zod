import { z } from 'zod'

export const Customer = z.object({
  name: z.string(),
  email: z.string(),
})

// A quantity is a whole number, 0 or more: what a Rust `u32` holds.
export const Item = z.object({
  sku: z.string(),
  qty: z.number().int().min(0).max(4294967295),
})

export const Order = z.object({
  customer: Customer,
  items: z.array(Item),
})

export type Order = z.infer<typeof Order>

// Each issue as `path: message`, its path's parts joined by dots, as
// `items.1.qty`.
export function issues(error: z.ZodError): string[] {
  return error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`)
}
