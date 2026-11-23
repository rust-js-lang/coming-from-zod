// bun chapters/13-one-check-two-places/compare.ts: each signup, answered by
// the native server over HTTP, by the same Rust as JavaScript, as a browser
// would run it, and by zod.
import cases from './cases.json'
import { respond } from './rust/src/lib.js'
import { post, startServer } from './server.ts'
import * as zod from './zod/signup.ts'

const server = await startServer()
try {
  for (const { body, why } of cases) {
    const [status, json] = await post(server.url, body)
    const [jsStatus, jsJson] = respond(body)
    const [zodStatus, zodJson] = zod.respond(body)
    console.log(`${body}   (${why})`)
    console.log(`  server (native Rust): ${status} ${json}`)
    console.log(`  browser (rust-js):    ${jsStatus} ${jsJson}`)
    console.log(`  zod:                  ${zodStatus} ${zodJson}`)
  }
} finally {
  server.stop()
}
