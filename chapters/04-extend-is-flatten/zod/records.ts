import { z } from 'zod'

// What every record has.
export const Base = z.object({
  id: z.string(),
  createdAt: z.string(),
})

// `.extend` makes a new schema: Base's fields, and these.
export const User = Base.extend({
  name: z.string(),
  email: z.string(),
})

export const Post = Base.extend({
  title: z.string(),
  authorId: z.string(),
})

export type Base = z.infer<typeof Base>
export type User = z.infer<typeof User>
export type Post = z.infer<typeof Post>

// Takes anything with Base's fields: a User or a Post will do.
export function label(record: Base): string {
  return `${record.id}, created ${record.createdAt}`
}
