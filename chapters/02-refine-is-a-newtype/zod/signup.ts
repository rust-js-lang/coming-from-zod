import { z } from 'zod'

// Each rule is a refinement of a string. `abort` stops at the first one that
// fails, as the Rust does. `.brand` marks the type, so a plain string isn't
// taken where an Email is, in TypeScript's eyes.
export const Email = z
  .string()
  .refine((text) => text.includes('@'), { message: 'an email has an @', abort: true })
  .refine(
    (text) => {
      const at = text.indexOf('@')
      const user = text.slice(0, at)
      const domain = text.slice(at + 1)
      return user !== '' && domain !== '' && !domain.includes('@')
    },
    { message: 'an email has one @, with text on each side', abort: true },
  )
  .refine((text) => !text.includes(' '), { message: 'an email has no spaces', abort: true })
  .brand<'Email'>()

export const Name = z
  .string()
  .refine((text) => text.trim() !== '', { message: "a name isn't blank", abort: true })
  .brand<'Name'>()

export const Signup = z.object({ name: Name, email: Email })

export type Email = z.infer<typeof Email>
export type Name = z.infer<typeof Name>
export type Signup = z.infer<typeof Signup>

export function welcome(name: Name, email: Email): string {
  return `Welcome, ${name}! We'll write to ${email}.`
}
