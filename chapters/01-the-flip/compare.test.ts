// zod and the Rust that rust-js compiled take and refuse the same JSON, and
// the compiled Rust refuses it in native serde_json's words
// (rust/tests/native.rs holds native Rust to the same cases.json).
import { expect, test } from 'bun:test'
import cases from './cases.json'
import { parseUser as rust } from './rust/src/lib.js'
import { User } from './zod/user.ts'

for (const { text, why, rust: refusal } of cases) {
  test(why, () => {
    const zod = User.safeParse(JSON.parse(text))
    const compiled = rust(text)
    expect(zod.success).toBe(refusal === null)
    if (refusal === null) {
      expect(compiled).toEqual({ TAG: 'Ok', _0: zod.data })
    } else {
      expect(compiled).toEqual({ TAG: 'Err', _0: refusal })
    }
  })
}
