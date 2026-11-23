import { z } from 'zod'

// A user, as it's kept.
export const User = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  admin: z.boolean(),
})
export type User = z.infer<typeof User>

// What a client sends to make a user: no id, which the server gives.
// `.strict()` refuses a key the schema doesn't have.
export const NewUser = User.omit({ id: true }).extend({ admin: z.boolean().default(false) }).strict()
export type NewUser = z.infer<typeof NewUser>

// What a client sends to change a user: each field optional, no id.
export const UserPatch = User.omit({ id: true }).partial().strict()
export type UserPatch = z.infer<typeof UserPatch>

// What other users see.
export const PublicUser = User.pick({ id: true, name: true })

export function create(id: string, user: NewUser): User {
  return { id, ...user }
}

export function apply(user: User, patch: UserPatch): User {
  return { ...user, ...patch }
}

export function publicJson(user: User): string {
  return JSON.stringify(PublicUser.parse(user))
}

// Each issue as `path: message`.
export function issues(error: z.ZodError): string[] {
  return error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`)
}
