import { z } from 'zod'

// A shop's stock: how many of each item, and the shop's tags.
export const Stock = z.object({
  counts: z.record(z.string(), z.number().int().min(0)),
  tags: z.array(z.string()).transform((tags) => new Set(tags)),
})
export type Stock = z.infer<typeof Stock>

// How many items in all.
export function total(stock: Stock): number {
  return Object.values(stock.counts).reduce((sum, count) => sum + count, 0)
}

// The items there are fewer than `below` of, by name.
export function low(stock: Stock, below: number): string[] {
  return Object.entries(stock.counts)
    .filter(([, count]) => count < below)
    .map(([item]) => item)
    .sort()
}

// How many there are of `item`: none if the shop doesn't stock it.
export function count(stock: Stock, item: string): number {
  return Object.hasOwn(stock.counts, item) ? stock.counts[item]! : 0
}

// Whether the shop has the tag.
export function tagged(stock: Stock, tag: string): boolean {
  return stock.tags.has(tag)
}

// Each issue as `path: message`.
export function issues(error: z.ZodError): string[] {
  return error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`)
}
