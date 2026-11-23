import { z } from 'zod'

// A comment, and its replies, each a comment. A schema can't name itself
// before it exists, so zod reads `replies` through a getter, when it's
// asked for.
export const Comment = z.object({
  author: z.string(),
  text: z.string(),
  get replies() {
    return z.array(Comment).default([])
  },
})
export type Comment = z.infer<typeof Comment>

export function count(comment: Comment): number {
  return 1 + comment.replies.reduce((sum, reply) => sum + count(reply), 0)
}

export function depth(comment: Comment): number {
  return 1 + Math.max(0, ...comment.replies.map(depth))
}

export function authors(comment: Comment): string[] {
  return [...new Set([comment.author, ...comment.replies.flatMap(authors)])].sort()
}

// Each issue as `path: message`.
export function issues(error: z.ZodError): string[] {
  return error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`)
}
