import { z } from 'zod'

export const Signup = z.object({
  // Trimmed and lower-case, then checked.
  email: z.string().trim().toLowerCase().pipe(z.email()),
  // A number, or text that is one: `z.coerce` turns "42" into 42.
  age: z.coerce.number().int().min(13),
  // "rust, zod,,js" → ["rust", "zod", "js"].
  tags: z.string().transform((text) => text.split(',').map((tag) => tag.trim()).filter((tag) => tag !== '')),
})

// What the form sends, and what you get out: two types.
export type SignupInput = z.input<typeof Signup>
export type Signup = z.output<typeof Signup>

// What the welcome email says.
export function welcome(signup: Signup): string {
  return `${signup.email} (${signup.age}), tagged ${signup.tags.join(' + ')}`
}

// Each issue as `path: message`.
export function issues(error: z.ZodError): string[] {
  return error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`)
}
