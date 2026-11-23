// A thread `n` comments deep, as cases.json's deep ones are made:
//   bun chapters/15-recursion-and-where-zod-wins/deep.ts 64
export function deep(n: number): string {
  let thread = `{"author":"a${n}","text":"."}`
  for (let i = n - 1; i >= 1; i--) thread = `{"author":"a${i % 3}","text":".","replies":[${thread}]}`
  return thread
}

if (import.meta.main) console.log(deep(Number(process.argv[2] ?? 64)))
