import { z } from 'zod'

// What a member may do, from least to most.
export const Role = z.enum(['viewer', 'editor', 'admin'])
export type Role = z.infer<typeof Role>

export const Member = z.object({
  name: z.string(),
  role: Role,
})
export type Member = z.infer<typeof Member>

// Every role, for a picker.
export function roles(): Role[] {
  return [...Role.options]
}

// Whether a role may change things.
export function canEdit(role: Role): boolean {
  return role === 'editor' || role === 'admin'
}

// Whether `role` is `min` or above it: by where each is in the list.
export function atLeast(role: Role, min: Role): boolean {
  return Role.options.indexOf(role) >= Role.options.indexOf(min)
}

// Each issue as `path: message`.
export function issues(error: z.ZodError): string[] {
  return error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`)
}
