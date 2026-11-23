import { z } from 'zod'

// An id: a number, or text.
export const Id = z.union([z.number().int().min(0), z.string()])
export type Id = z.infer<typeof Id>

// How to reach someone: an email, or a phone.
export const Email = z.object({ email: z.string() })
export const Phone = z.object({ phone: z.string(), ext: z.string().nullish() })
export const Contact = z.union([Email, Phone])
export type Contact = z.infer<typeof Contact>

export const Person = z.object({ id: Id, contact: Contact })
export type Person = z.infer<typeof Person>

// An id as a label shows it: `#42`, or the text itself.
export function idLabel(id: Id): string {
  return typeof id === 'number' ? `#${id}` : id
}

// How to reach someone, in words.
export function reach(contact: Contact): string {
  if ('email' in contact) return `write to ${contact.email}`
  return contact.ext ? `call ${contact.phone}, ext. ${contact.ext}` : `call ${contact.phone}`
}

// Each issue as `path: message`.
export function issues(error: z.ZodError): string[] {
  return error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`)
}
