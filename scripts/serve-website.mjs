import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { createServer } from 'node:http'
import { extname, join, normalize, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
const port = Number(process.env.WEBSITE_PORT || 4174)
const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
}

const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url || '/', 'http://localhost').pathname)
    const relativePath = pathname === '/' ? 'index.html' : normalize(pathname).replace(/^[/\\]+/, '')
    const filePath = resolve(join(root, relativePath))

    if (!filePath.startsWith(`${root}\\`) && filePath !== root) {
      response.writeHead(403).end('Forbidden')
      return
    }

    const fileStat = await stat(filePath)
    if (!fileStat.isFile()) throw new Error('Not a file')

    response.writeHead(200, {
      'Cache-Control': 'no-store',
      'Content-Type': contentTypes[extname(filePath).toLowerCase()] || 'application/octet-stream',
    })
    createReadStream(filePath).pipe(response)
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
    response.end('Not Found')
  }
})

server.listen(port, '127.0.0.1', () => {
  console.log(`잘되면 밥한끼 웹사이트: http://localhost:${port}`)
})
