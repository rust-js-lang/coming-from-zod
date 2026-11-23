// The native server, built by Cargo and started on a free port, for a test
// or compare.ts to ask over HTTP: the same Rust the browser runs as JS.
import { join } from 'node:path'

const root = join(import.meta.dir, '../..')

export async function startServer(): Promise<{ url: string; stop: () => void }> {
  const built = Bun.spawnSync(['cargo', 'build', '-q', '-p', 'chapter-13-one-check-two-places', '--example', 'server'], { cwd: root })
  if (built.exitCode !== 0) throw new Error(built.stderr.toString())
  const server = Bun.spawn([join(root, 'target/debug/examples/server')], { stdout: 'pipe' })
  const reader = server.stdout.getReader()
  let said = ''
  while (!said.includes('\n')) {
    const { value, done } = await reader.read()
    if (done) throw new Error('the server stopped before it said where it listens')
    said += new TextDecoder().decode(value)
  }
  const address = said.trim().replace('listening on ', '')
  return { url: `http://${address}/signup`, stop: () => server.kill() }
}

// A signup's body POSTed to it: its status and its JSON.
export async function post(url: string, body: string): Promise<[number, string]> {
  const response = await fetch(url, { method: 'POST', body, headers: { 'content-type': 'application/json' } })
  return [response.status, await response.text()]
}
