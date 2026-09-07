import test from 'node:test';
import assert from 'node:assert/strict';
import { request as httpRequest } from 'node:http';
import { createWebsiteServer, isPublicPath } from '../scripts/serve-website.mjs';
import { CONSENT_VERSION } from '../supabase/functions/_shared/validation.mjs';

test('public files allowlist rejects environment, Git, server, SQL, traversal and backup files', () => {
  for (const path of ['/.env.local','/.git/config','/package.json','/scripts/serve-website.mjs','/supabase/migrations/x.sql','/js/../.env','/assets/.secret.js','/js/x.js.map','/js/x.js:secret','/js\\main.js']) assert.equal(isPublicPath(path),false,path);
  for (const path of ['/index.html','/apply.html','/privacy.html','/css/privacy.css','/admin.html','/js/main.js','/assets/fonts/NanumGothic-Regular.ttf']) assert.equal(isPublicPath(path),true,path);
});
test('HTTP serves website, blocks private source and rejects foreign Host', async t => {
  const server=createWebsiteServer(); await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(()=>new Promise(resolve=>server.close(resolve)));
  const port=server.address().port;
  const read=(path,host='localhost:4174')=>new Promise((resolve,reject)=>{
    const request=httpRequest({hostname:'127.0.0.1',port,path,headers:{Host:host}},response=>{
      let body='';response.on('data',chunk=>{body+=chunk;});response.on('end',()=>resolve({status:response.statusCode,body,headers:response.headers}));
    });request.on('error',reject);request.end();
  });
  const page=await read('/');assert.equal(page.status,200);assert.match(page.body,/대\.세\.는 소개팅/);
  assert.equal((await read('/admin.html')).status,200);
  const privacy=await read('/privacy.html');assert.equal(privacy.status,200);assert.match(privacy.body,/<title>개인정보처리방침 \| 대\.세\.는 소개팅<\/title>/);
  assert.equal((await read('/css/privacy.css')).status,200);
  for (const path of ['/.env.local','/.git/config','/supabase/functions/_shared/supabase.mjs','/package-lock.json','/%2eenv.local','/assets/%2e%2e/.env.local']) assert.equal((await read(path)).status,404,path);
  assert.equal((await read('/','attacker.invalid')).status,403);
  const config=await read('/api/applications');assert.equal(config.status,200);assert.equal(JSON.parse(config.body).consentVersion,CONSENT_VERSION);
});
