import { readdir, readFile } from 'node:fs/promises'
import { join, relative } from 'node:path'

const sourceRoot = join(process.cwd(), 'src')
const files = []

async function collect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) await collect(path)
    else if (/\.(tsx?|jsx?)$/.test(entry.name)) files.push(path)
  }
}

await collect(sourceRoot)

const violations = []
const deprecatedFormEvent = /\b(?:React\.)?FormEvent(?:Handler)?\b/g
// Tailwind's fractional spacing scale is appropriate for small rhythm values,
// but non-standard large dimensions must stay explicit (for example
// w-[130px], not w-32.5) so visual measurements remain unambiguous.
const implicitLargeFraction = /\b(?:w|h|min-w|max-w|min-h|max-h|size)-(?:1[0-9]|[2-9][0-9]|[1-9][0-9]{2,})\.\d+\b/g

for (const file of files) {
  const source = await readFile(file, 'utf8')
  const displayPath = relative(process.cwd(), file)
  for (const match of source.matchAll(deprecatedFormEvent)) {
    violations.push(`${displayPath}: deprecated ${match[0]}`)
  }
  for (const match of source.matchAll(implicitLargeFraction)) {
    violations.push(`${displayPath}: use an explicit arbitrary dimension for ${match[0]}`)
  }
}

if (violations.length) {
  console.error('Client convention check failed:')
  for (const violation of violations) console.error(`- ${violation}`)
  process.exit(1)
}

console.log(`Client convention check passed (${files.length} source files).`)
