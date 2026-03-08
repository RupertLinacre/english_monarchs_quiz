import http from 'node:http'
import fs from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'

const root = path.resolve('dist')
const port = 4173

const contentTypeMap = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.json', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.webp', 'image/webp'],
])

const server = http.createServer(async (request, response) => {
  try {
    const requestPath = new URL(request.url ?? '/', `http://${request.headers.host}`).pathname
    const safePath = requestPath === '/' ? '/index.html' : requestPath
    const filePath = path.join(root, safePath)
    const contents = await fs.readFile(filePath)
    response.writeHead(200, {
      'content-type': contentTypeMap.get(path.extname(filePath)) ?? 'application/octet-stream',
    })
    response.end(contents)
  } catch {
    try {
      const indexFile = await fs.readFile(path.join(root, 'index.html'))
      response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
      response.end(indexFile)
    } catch {
      response.writeHead(404)
      response.end('Not found')
    }
  }
})

await new Promise((resolve) => server.listen(port, '127.0.0.1', resolve))

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1600, height: 1200 } })

try {
  await page.goto(`http://127.0.0.1:${port}`, { waitUntil: 'networkidle' })
  await fs.mkdir(path.resolve('tmp/playwright'), { recursive: true })
  await page.locator('.reign-segment--ghost').nth(12).hover()
  await page.screenshot({ path: path.resolve('tmp/playwright/reign-tooltip.png'), fullPage: true })
  await page.click('#reveal-all')
  await page.waitForTimeout(1200)

  await page.screenshot({ path: path.resolve('tmp/playwright/full-world.png'), fullPage: true })
  await page.locator('.monarch-card[title^="Edward III"]').click()
  await page.waitForTimeout(300)
  await page.screenshot({ path: path.resolve('tmp/playwright/monarch-info-panel.png'), fullPage: true })

  await page.reload({ waitUntil: 'networkidle' })
  await page.fill('#answer-input', 'edward iv')
  await page.waitForTimeout(1000)
  await page.click('#reveal-all')
  await page.waitForTimeout(1200)
  await page.screenshot({ path: path.resolve('tmp/playwright/region-1471.png'), fullPage: true })

  const cardSummary = await page.$$eval('.monarch-card', (cards) =>
    cards.map((card) => {
      const rect = card.getBoundingClientRect()
      const name = card.querySelector('strong')?.textContent?.trim() ?? card.getAttribute('title') ?? ''
      return { name, x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) }
    }),
  )

  console.log(JSON.stringify(cardSummary, null, 2))
} finally {
  await browser.close()
  await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())))
}
