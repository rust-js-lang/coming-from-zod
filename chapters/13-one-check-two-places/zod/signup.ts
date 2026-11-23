import { z } from 'zod'

// The signup check, shared by a TypeScript server and the browser.
export const Signup = z.object({
  name: z.string().trim().min(1, 'required'),
  email: z.string().refine((email) => /^[^@]+@[^@]*\.[^@]*$/.test(email), 'not an email address'),
  age: z.number().int().min(13, 'must be 13 or older'),
})
export type Signup = z.infer<typeof Signup>

// The server's answer to a signup's body: 201 and the signup, or 422 and why.
export function respond(body: string): [number, string] {
  let json: unknown
  try {
    json = JSON.parse(body)
  } catch (error) {
    return [422, JSON.stringify({ error: (error as Error).message })]
  }
  const parsed = Signup.safeParse(json)
  if (parsed.success) return [201, JSON.stringify(parsed.data)]
  return [422, JSON.stringify({ error: parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(' | ') })]
}
