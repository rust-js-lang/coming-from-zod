// Applies each of patches/*.patch to the rust-js submodule, once: a patch
// already applied is left as it is. PATCHES.md says why each exists and
// which upstream issue it waits for. With none, it does nothing.
import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const root = join(import.meta.dir, '..')
const dir = join(root, 'patches')
const patches = existsSync(dir) ? readdirSync(dir).filter((name) => name.endsWith('.patch')).sort() : []

function git(...args: string[]): boolean {
  return Bun.spawnSync(['git', '-C', join(root, 'rust-js'), ...args], { stderr: 'pipe' }).exitCode === 0
}

for (const name of patches) {
  const patch = join(dir, name)
  if (git('apply', '--reverse', '--check', patch)) continue
  if (!git('apply', patch)) throw new Error(`patches/${name} doesn't apply to rust-js: has the submodule moved?`)
  console.log(`applied patches/${name}`)
}
