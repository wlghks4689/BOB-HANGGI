import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { CONSENT_VERSION } from '../supabase/functions/_shared/validation.mjs';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const active = ['privacy.html','apply.html','docs/consent-2026-09-07-v1.md','docs/SUPABASE_SETUP.md'];

test('active notices retain four distinct policy clocks and the confirmed contact', async () => {
  for (const file of active) {
    const text=await read(file);
    assert.match(text,/신청 접수 후 최대 48시간 이내 심사/,file);
    assert.match(text,/접수일로부터 30일을 초과하여 보관하지/,file);
    assert.match(text,/심사 결과 안내 후 48시간 이내 개인정보와 프로필 사진/,file);
    assert.match(text,/서비스 이용 종료 또는 개인정보 삭제 요청 후 48시간 이내 개인정보와 프로필 사진/,file);
    assert.ok(text.includes('mailto:wlghks1778@gmail.com'),file);
    assert.ok(!text.includes('wlghks4689@gmail.com'),file);
    assert.match(text,/자동 파기.*(?:미구현|아직 구현되지|구현 및 검증 후)/,file);
  }
});
test('policy has twelve sections, valid contents anchors and no blanket consent or tracking script', async () => {
  const html=await read('privacy.html');
  const ids=[...html.matchAll(/<section id="([^"]+)">/g)].map(match=>match[1]);
  assert.equal(ids.length,12);assert.equal(new Set(ids).size,12);
  for (const id of ids) assert.ok(html.includes(`href="#${id}"`),id);
  assert.ok(!/<(?:script|input|form)\b/i.test(html));
  assert.match(html,/시행 예정일: 실제 접수 개방일 \(미확정\)/);
  for (const item of ['Supabase','Cloudflare Turnstile','Vercel','관리자 메모','희망 최소·최대 나이','별도의 제3자 제공 동의','자동 파기는 미구현']) assert.ok(html.includes(item),item);
});
test('policy links consistently open a separate tab without replacing an unfinished application', async () => {
  for (const [file,count] of [['index.html',1],['apply.html',2]]) {
    const html=await read(file), links=[...html.matchAll(/<a\b[^>]*href="privacy\.html"[^>]*>/g)];
    assert.equal(links.length,count,file);
    for (const [link] of links) { assert.match(link,/target="_blank"/);assert.match(link,/rel="noopener"/); }
  }
  const apply=await read('apply.html');
  const consentBlock=apply.match(/<fieldset class="form-section" id="privacy">([\s\S]*?)<\/fieldset>/)[1];
  assert.equal([...consentBlock.matchAll(/type="checkbox"/g)].length,2);
  assert.match(consentBlock,/sensitive_religion_consent[^>]*type="checkbox" \/>/);
  assert.match(await read('index.html'),/href="mailto:wlghks1778@gmail\.com">문의하기<\/a>/);
});
test('browser, notice, server and new SQL consent versions agree without rewriting old history', async () => {
  for (const file of ['privacy.html','apply.html','js/main.js','.env.example','docs/consent-2026-09-07-v1.md','supabase/migrations/202609070003_privacy_policy_v1.sql']) {
    assert.ok((await read(file)).includes(CONSENT_VERSION),file);
  }
  assert.ok((await read('.env.example')).includes('APPLICATIONS_ENABLED=false'));
  for (const file of ['docs/consent-2026-09-07-draft.md','docs/consent-2026-09-07.md','supabase/migrations/202609070001_application_intake.sql','supabase/migrations/202609070002_finalize_consent.sql']) {
    assert.ok(!(await read(file)).includes(CONSENT_VERSION),file);
  }
});
