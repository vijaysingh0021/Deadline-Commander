import { build } from 'esbuild'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const outputDir = await mkdtemp(path.join(tmpdir(), 'deadline-commander-smoke-'))
const outputFile = path.join(outputDir, 'smoke.mjs')

try {
  await build({
    entryPoints: [path.resolve('scripts/smoke.ts')],
    outfile: outputFile,
    bundle: true,
    platform: 'node',
    format: 'esm',
    alias: { '@': path.resolve('src') },
    define: { 'import.meta.env': '{}' },
  })
  await import(pathToFileURL(outputFile).href)
} finally {
  await rm(outputDir, { recursive: true, force: true })
}
