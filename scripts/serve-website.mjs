import { createReadStream } from 'node:fs';
import { realpath, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, resolve, sep } from 'node:path';
import { Readable } from 'node:stream';
import { fileURLToPath } from 'node:url';
import { loadEnvFile } from 'node:process';
import { createIntakeHandler } from '../supabase/functions/_shared/intake.mjs';
import { createAdminHandler } from '../supabase/functions/_shared/admin.mjs';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
try { loadEnvFile(resolve(root, '.env.local')); } catch (error) { if (error.code !== 'ENOENT') throw new Error('Check .env.local syntax'); }
const port = Number(process.env.WEBSITE_PORT || 4174);
const env = { ...process.env, ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS || `http://localhost:${port}` };
const intake = createIntakeHandler(env, { local: true });
const admin = createAdminHandler(env);
const contentTypes = {
  '.css': 'text/css; charset=utf-8', '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.webp': 'image/webp', '.ttf': 'font/ttf', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ico': 'image/x-icon',
};
const pages = new Set(['index.html', 'apply.html', 'admin.html', 'pool.html', 'feedback.html', 'privacy.html']);
export function isPublicPath(pathname) {
  if (pathname.includes('\\') || pathname.split('/').some(part => part.startsWith('.') || part.includes(':'))) return false;
  const path = pathname.replace(/^\//, '');
  return pages.has(path) || /^(css|js|assets)\//.test(path) && Boolean(contentTypes[extname(path).toLowerCase()])
    && extname(path).toLowerCase() !== '.html';
}

export function createWebsiteServer() {
  return createServer(async (request, response) => {
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Referrer-Policy', 'no-referrer');
    response.setHeader('X-Frame-Options', 'SAMEORIGIN');
    if (![ `localhost:${port}`, `127.0.0.1:${port}` ].includes(request.headers.host || '')) {
      response.writeHead(403).end('Forbidden'); return;
    }
    try {
      const url = new URL(request.url || '/', `http://localhost:${port}`);
      const pathname = decodeURIComponent(url.pathname);
      if (['/api/applications', '/api/admin'].includes(pathname)) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 30000);
        try {
          const init = { method: request.method, headers: request.headers, signal: controller.signal };
          if (!['GET','HEAD'].includes(request.method)) { init.body = Readable.toWeb(request); init.duplex = 'half'; }
          const webRequest = new Request(url, init);
          const result = await (pathname === '/api/admin' ? admin(webRequest) : intake(webRequest, request.socket.remoteAddress));
          response.writeHead(result.status, Object.fromEntries(result.headers));
          response.end(Buffer.from(await result.arrayBuffer()));
        } finally { clearTimeout(timer); }
        return;
      }
      if (!['GET','HEAD'].includes(request.method)) { response.writeHead(405).end('Method Not Allowed'); return; }
      const publicPath = pathname === '/' ? '/index.html' : pathname;
      if (!isPublicPath(publicPath)) { response.writeHead(404).end('Not Found'); return; }
      const filePath = await realpath(resolve(root, publicPath.slice(1)));
      if (!filePath.startsWith(root + sep)) { response.writeHead(404).end('Not Found'); return; }
      const realRelative = '/' + filePath.slice(root.length + 1).split(sep).join('/');
      if (!isPublicPath(realRelative) || !(await stat(filePath)).isFile()) { response.writeHead(404).end('Not Found'); return; }
      response.setHeader('Content-Type', contentTypes[extname(filePath).toLowerCase()] || 'application/octet-stream');
      if (request.method === 'HEAD') { response.end(); return; }
      createReadStream(filePath).on('error', () => response.destroy()).pipe(response);
    } catch {
      if (!response.headersSent) response.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Request could not be processed');
    }
  });
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const server = createWebsiteServer();
  server.requestTimeout = 30000;
  server.headersTimeout = 10000;
  server.listen(port, '127.0.0.1', () => console.log(`대.세.는 소개팅 웹사이트: http://localhost:${port}`));
}
