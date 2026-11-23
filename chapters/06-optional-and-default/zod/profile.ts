import { z } from 'zod'

export const Profile = z.object({
  // Always there.
  name: z.string(),
  // May be left out, or null: `.nullish()`, which is `.optional()` and
  // `.nullable()` at once. `.optional()` alone refuses null.
  nickname: z.string().nullish(),
  // Must be there, but may be null.
  bio: z.string().nullable(),
  // 'light' when it's left out.
  theme: z.string().default('light'),
  // false when it's left out.
  newsletter: z.boolean().default(false),
})

export type Profile = z.infer<typeof Profile>

// The greeting a page shows: the nickname if there is one, else the name.
export function greeting(profile: Profile): string {
  return `Hi, ${profile.nickname ?? profile.name}! (${profile.theme} theme)`
}

// Each issue as `path: message`.
export function issues(error: z.ZodError): string[] {
  return error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`)
}
