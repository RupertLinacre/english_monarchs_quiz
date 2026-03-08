import fs from 'node:fs/promises'
import path from 'node:path'

const sourcePath = path.resolve('src/data.ts')
const outputDir = path.resolve('public/portraits')
const manifestPath = path.join(outputDir, 'manifest.json')

const source = await fs.readFile(sourcePath, 'utf8')
const monarchSection = source.split('export const monarchs: Monarch[] = [')[1] ?? ''
const blocks = monarchSection.split('\n  },')
const entries = blocks
  .map((block) => {
    const id = block.match(/id: '([^']+)'/)?.[1]
    const wikipediaTitle = block.match(/wikipediaTitle: '([^']+)'/)?.[1]
    return id && wikipediaTitle ? { id, wikipediaTitle } : null
  })
  .filter((entry) => entry !== null)

await fs.mkdir(outputDir, { recursive: true })
await fs.rm(outputDir, { recursive: true, force: true })
await fs.mkdir(outputDir, { recursive: true })

const manifest = {}

for (const entry of entries) {
  const response = await fetchWithRetry(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(entry.wikipediaTitle)}`, {
    headers: {
      'user-agent': 'monarchs-quiz-local-portraits/1.0',
      accept: 'application/json',
    },
  })

  if (!response.ok) {
    console.warn(`Skipping ${entry.id}: summary request failed (${response.status})`)
    continue
  }

  const summary = await response.json()
  const portraitUrl = summary.thumbnail?.source ?? summary.originalimage?.source

  if (!portraitUrl) {
    console.warn(`Skipping ${entry.id}: no portrait URL returned`)
    continue
  }

  const portraitResponse = await fetchWithRetry(portraitUrl, {
    headers: {
      'user-agent': 'monarchs-quiz-local-portraits/1.0',
    },
  })

  if (!portraitResponse.ok) {
    console.warn(`Skipping ${entry.id}: image request failed (${portraitResponse.status})`)
    continue
  }

  const url = new URL(portraitUrl)
  const extension = path.extname(url.pathname) || '.jpg'
  const fileName = `${entry.id}${extension}`
  const filePath = path.join(outputDir, fileName)
  const buffer = Buffer.from(await portraitResponse.arrayBuffer())

  await fs.writeFile(filePath, buffer)
  manifest[entry.id] = `/portraits/${fileName}`
  console.log(`Saved ${entry.id} -> ${fileName}`)
  await sleep(600)
}

await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n')
console.log(`Wrote manifest with ${Object.keys(manifest).length} portraits`)

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchWithRetry(url, options, attempts = 4) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const response = await fetch(url, options)

    if (response.status !== 429 || attempt === attempts) {
      return response
    }

    const retryDelay = 1500 * attempt
    console.warn(`Retrying after 429 for ${url} in ${retryDelay}ms`)
    await sleep(retryDelay)
  }

  throw new Error(`Failed to fetch ${url}`)
}
