import { z } from 'zod'

// An order's id: a branded number, which only `Order.parse` makes.
export const OrderId = z.number().int().min(0).brand<'OrderId'>()
export const Status = z.enum(['open', 'shipped'])
export const Item = z.object({ sku: z.string(), qty: z.number().int().min(0) })
export const Order = z.object({ id: OrderId, status: Status, items: z.array(Item), note: z.string().nullish() })

export type Item = z.infer<typeof Item>
export type Order = z.infer<typeof Order>

// How many things are in an order.
export function count(order: Order): number {
  return order.items.reduce((sum, item) => sum + item.qty, 0)
}

// Each issue as `path: message`.
export function issues(error: z.ZodError): string[] {
  return error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`)
}
