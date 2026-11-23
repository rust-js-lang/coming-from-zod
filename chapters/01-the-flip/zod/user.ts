import { z } from 'zod'

// You write the check. TypeScript reads the type off it.
export const User = z.object({
  name: z.string(),
  age: z.uint32(),
})

export type User = z.infer<typeof User>

export function parseUser(text: string): User {
  return User.parse(JSON.parse(text))
}
