// bun chapters/01-the-flip/compare.ts: each case, and what zod and Rust say of it.
import cases from './cases.json'
import { parseUser as rust } from './rust/src/lib.js'
import { parseUser as zod } from './zod/user.ts'

function zodSays(text: string): string {
  try {
    return `ok ${JSON.stringify(zod(text))}`
  } catch (error) {
    return `refused: ${(error as Error).message.replace(/\s+/g, ' ')}`
  }
}

function rustSays(text: string): string {
  const result = rust(text)
  return result.TAG === 'Ok' ? `ok ${JSON.stringify(result._0)}` : `refused: ${result._0}`
}

for (const { text, why } of cases) {
  console.log(`${text}   (${why})`)
  console.log(`  zod:  ${zodSays(text)}`)
  console.log(`  rust: ${rustSays(text)}`)
}
