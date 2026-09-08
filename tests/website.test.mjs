import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { request as httpRequest } from 'node:http';
import { createWebsiteServer, isPublicPath } from '../scripts/serve-website.mjs';
import { CONSENT_VERSION } from '../supabase/functions/_shared/validation.mjs';

test('public files allowlist rejects environment, Git, server, SQL, traversal and backup files', () => {
  for (const path of ['/.env.local','/.git/config','/package.json','/scripts/serve-website.mjs','/supabase/migrations/x.sql','/js/../.env','/assets/.secret.js','/js/x.js.map','/js/x.js:secret','/js\\main.js']) assert.equal(isPublicPath(path),false,path);
  for (const path of ['/index.html','/apply.html','/privacy.html','/css/privacy.css','/admin.html','/pool.html','/js/pool.js','/css/pool.css','/js/main.js','/assets/fonts/NanumGothic-Regular.ttf']) assert.equal(isPublicPath(path),true,path);
});

test('browser configuration uses local APIs only on localhost', async () => {
  const config = await readFile(new URL('../js/backend-config.js', import.meta.url), 'utf8');
  assert.match(config, /\["localhost", "127\.0\.0\.1"\]\.includes\(window\.location\.hostname\)/);
  assert.match(config, /\? "\/api\/applications"/);
  assert.match(config, /\? "\/api\/admin"/);
  assert.match(config, /https:\/\/mfezbzrseuikeltzdtwe\.supabase\.co\/functions\/v1\/submit-application/);
  assert.match(config, /https:\/\/mfezbzrseuikeltzdtwe\.supabase\.co\/functions\/v1\/admin-applications/);
});
test('admin review uses one application status and omits redundant consent metadata', async () => {
  const admin = await readFile(new URL('../js/admin.js', import.meta.url), 'utf8');
  const page = await readFile(new URL('../admin.html', import.meta.url), 'utf8');
  assert.doesNotMatch(admin, /selectField\(form, '사진 검토'/);
  assert.doesNotMatch(admin, /reviewing|검토 중/);
  assert.doesNotMatch(page, /reviewing|검토 중/);
  assert.doesNotMatch(admin, /'필수 동의'/);
  assert.doesNotMatch(admin, /'동의 문서 버전'/);
  assert.doesNotMatch(admin, /'동의 시각'/);
  assert.doesNotMatch(admin, /photoReview:data\.get/);
  assert.match(admin, /사진 확인 불가, 연락처 인증 안 됨/);
});
test('member pool keeps a balanced gender board and comparison dialog without contact fields', async () => {
  const [page,adminPage,script,adminScript,sessionScript,style]=await Promise.all([
    readFile(new URL('../pool.html',import.meta.url),'utf8'),readFile(new URL('../admin.html',import.meta.url),'utf8'),readFile(new URL('../js/pool.js',import.meta.url),'utf8'),
    readFile(new URL('../js/admin.js',import.meta.url),'utf8'),readFile(new URL('../js/admin-session.js',import.meta.url),'utf8'),readFile(new URL('../css/pool.css',import.meta.url),'utf8'),
  ]);
  assert.match(page,/data-men/);assert.match(page,/data-women/);assert.match(page,/<dialog[^>]+data-compare/);
  for(const html of [page,adminPage]){assert.match(html,/>신청 관리</);assert.match(html,/>회원 관리</);assert.match(html,/data-admin-nav/);}
  assert.match(script,/action:'pool-list'/);assert.match(script,/action:'pool-detail'/);assert.match(script,/selected\.male && selected\.female/);
  assert.doesNotMatch(script,/admin_note|consent/);
  assert.match(script,/location\.hostname === 'localhost'/);assert.match(script,/M001/);assert.match(script,/W004/);assert.match(script,/member\.mock\?Promise\.resolve/);
  for(const status of ['matching_available','matching_progress','dormant'])assert.match(script,new RegExp(status));
  assert.match(script,/selected\[member\.gender\]\?\.id === member\.id \? null : member/);assert.doesNotMatch(script,/✓ 선택됨/);assert.match(script,/상세보기/);
  assert.match(sessionScript,/sessionStorage/);assert.match(script,/sessionStore\.load/);assert.match(adminScript,/sessionStore\.load/);
  assert.doesNotMatch(script,/pagehide/);assert.doesNotMatch(adminScript,/pagehide/);
  assert.match(style,/grid-template-columns:1fr 1fr/);assert.match(style,/@media\(max-width:760px\)/);
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
