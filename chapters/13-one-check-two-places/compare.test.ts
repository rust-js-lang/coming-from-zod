// One check, in two places: the native server, asked over HTTP, and the
// JavaScript rust-js writes of the same crate, as the browser runs it, give
// each signup the same status and the same JSON, the native answer
// cases.json records. zod's server gives each the same status, and for a
// rule of the signup's, the same words. rust/tests/native.rs holds native
// Rust to the same cases without a server.
import { afterAll, beforeAll, expect, test } from 'bun:test'
import cases from './cases.json'
import * as rust from './rust/src/lib.js'
import { post, startServer } from './server.ts'
import * as zod from './zod/signup.ts'

let server: Awaited<ReturnType<typeof startServer>>
beforeAll(async () => {
  server = await startServer()
}, 300_000)
afterAll(() => server?.stop())

for (const { body, why, status, rust: answer, zodStatus, zod: zodAnswer } of cases) {
  test(why, async () => {
    expect(await post(server.url, body)).toEqual([status, answer])
    expect(rust.respond(body)).toEqual([status, answer])
    expect(zod.respond(body)).toEqual([zodStatus, zodAnswer])
    expect(zodStatus).toBe(status)
    // Taken, the signups are the same; refused by a rule of the whole, the
    // words are too.
    if (status === 201 || !answer.includes(' at line ')) expect(zodAnswer).toBe(answer)
  })
}
