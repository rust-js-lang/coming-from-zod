import { z } from 'zod'

// One object per kind of shape, each with its own `type`. zod checks the
// `type` first, then only the fields that kind of shape has.
export const Shape = z.discriminatedUnion('type', [
  z.object({ type: z.literal('circle'), radius: z.number() }),
  z.object({ type: z.literal('square'), side: z.number() }),
  z.object({ type: z.literal('rectangle'), width: z.number(), height: z.number() }),
])

export type Shape = z.infer<typeof Shape>

export function area(shape: Shape): number {
  switch (shape.type) {
    case 'circle':
      return Math.PI * shape.radius * shape.radius
    case 'square':
      return shape.side * shape.side
    case 'rectangle':
      return shape.width * shape.height
  }
}
