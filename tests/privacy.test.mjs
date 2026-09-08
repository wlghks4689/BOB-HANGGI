import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { CONSENT_VERSION } from '../supabase/functions/_shared/validation.mjs';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const active = ['privacy.html','apply.html','docs/consent-2026-09-07-v1.md','docs/SUPABASE_SETUP.md'];

test('active notices retain four distinct policy clocks without a temporary contact address', async () => {
  for (const file of active) {
    const text=await read(file);
    assert.match(text,/(?:신청 접수 후|신청은 원칙적으로 접수 후) 최대 48시간 이내 심사/,file);
    assert.match(text,/접수일로부터 30일을 초과하여 보관하지/,file);
    assert.match(text,/(?:미승인 신청자: 심사 결과 안내 후 48시간 이내 개인정보와 프로필 사진|미승인 신청자의 개인정보와 프로필 사진은 심사 결과 안내 후 48시간 이내)/,file);
    assert.match(text,/(?:승인 회원: 서비스 이용 종료 또는 개인정보 삭제 요청 후 48시간 이내 개인정보와 프로필 사진|승인 회원의 개인정보와 프로필 사진은 서비스 이용 종료 또는 개인정보 삭제 요청 후 48시간 이내)/,file);
    assert.ok(!text.includes('mailto:'),file);
    assert.ok(!/@gmail\.com/.test(text),file);
    if (!['apply.html','privacy.html'].includes(file)) assert.match(text,/자동 파기.*(?:구현|5분)/,file);
  }
});
test('public policy has eight user-focused sections and no internal implementation report', async () => {
  const html=await read('privacy.html');
  const ids=[...html.matchAll(/<section id="([^"]+)">/g)].map(match=>match[1]);
  assert.deepEqual(ids,['purposes','collection','retention','sharing','providers','protection','rights','version']);
  for (const id of ids) assert.ok(html.includes(`href="#${id}"`),id);
  assert.ok(!/<(?:script|input|form)\b/i.test(html));
  assert.equal([...html.matchAll(/<table>/g)].length,2);
  assert.match(html,/시행일: 실제 서비스 접수 개방일 \(미확정\)/);
  for (const item of ['Supabase','Cloudflare Turnstile','Vercel','별도의 동의를 받은 후','접속 및 이용기록']) assert.ok(html.includes(item),item);
  for (const internal of ['HMAC','RLS','Edge Function','Storage API','cleanup queue','DB 트랜잭션','fingerprint','upload job','자동 파기는','미구현','통합 검증']) assert.ok(!html.includes(internal),internal);
  assert.ok(!html.includes('향후 상대방에게 공개될 수 있는 정보'));
});
test('internal operations document retains removed implementation and release-blocker details', async () => {
  const operations=await read('docs/PRIVACY_OPERATIONS.md');
  for (const item of ['현재 개인정보 데이터 흐름','daese_applications','민감정보 종교 처리 방식','관리자 인증 구조','RLS 및 권한 구조','서버 Secret 관리 원칙','HMAC 기반 요청 제한 구조','request ID, fingerprint 및 intake job 구조','프로필 사진 Storage 및 임시 URL 구조','관리자 삭제 흐름','사진 삭제 실패 및 재시도','자동 보유기간 파기 상태','개인정보 사고 대응 기본 체크리스트','외부 서비스 계약·국외이전 검토 TODO','RETENTION_AUTOMATION_VERIFIED=true']) assert.ok(operations.includes(item),item);
  assert.match(operations,/5분 Cron/);
  assert.match(operations,/미처리 신청: 접수일로부터 30일/);
  assert.match(operations,/미승인 신청자: 심사 결과를 실제로 안내한 시각부터 48시간/);
  assert.match(operations,/승인 회원: 서비스 이용 종료 또는 확인된 삭제 요청 시각부터 48시간/);
});
test('landing navigation and application consent keep clear policy links', async () => {
  const index=await read('index.html');
  const landingLinks=[...index.matchAll(/<a\b[^>]*href="privacy\.html"[^>]*>/g)];
  assert.equal(landingLinks.length,1);
  assert.ok(!landingLinks[0][0].includes('target='));
  assert.match(index,/<nav class="landing-nav"[^>]*>[\s\S]*Introduce[\s\S]*>Privacy<\/a>[\s\S]*<\/nav>/);
  assert.ok(!index.includes('landing-footer'));
  assert.match(index,/<img src="assets\/landing-original\.png" width="941" height="1672" fetchpriority="high"/);
  assert.match(index,/<a class="poster-apply" href="apply\.html" aria-label="소개 신청하기"><\/a>/);

  const applyHtml=await read('apply.html'), applyLinks=[...applyHtml.matchAll(/<a\b[^>]*href="privacy\.html"[^>]*>/g)];
  assert.equal(applyLinks.length,2);
  for (const [link] of applyLinks) { assert.match(link,/target="_blank"/);assert.match(link,/rel="noopener"/); }
  const consentBlock=applyHtml.match(/<fieldset class="form-section" id="privacy">([\s\S]*?)<\/fieldset>/)[1];
  assert.equal([...consentBlock.matchAll(/type="checkbox"/g)].length,2);
  assert.match(consentBlock,/sensitive_religion_consent[^>]*type="checkbox" \/>/);
  assert.ok(!consentBlock.includes('동의 문서 버전:'));
  assert.match(consentBlock,/매칭 제안 시 공개되는 정보 \/ 비공개 정보/);
  assert.match(consentBlock,/<dt>공개 정보<\/dt>/);
  assert.match(consentBlock,/<dt>비공개 정보<\/dt>/);
  assert.ok(!consentBlock.match(/<dt>비공개 정보<\/dt><dd>[^<]*관리자 메모/));
  assert.ok(!consentBlock.includes('현재 상대방에게 프로필을 자동 제공하지 않습니다.'));
  assert.match(await read('index.html'),/TODO: 도메인 문의 주소를 개설한 뒤 링크를 연결한다/);
  assert.match(await read('index.html'),/<span class="introduce-contact-link">문의하기<\/span>/);
});
test('profile preview starts folded on desktop and mobile', async () => {
  const html=await read('apply.html'), script=await read('js/main.js');
  assert.match(html,/<details class="profile-preview-details" data-preview-details>/);
  assert.ok(!html.match(/<details class="profile-preview-details" data-preview-details open/));
  assert.match(script,/previewDetails\.open = false/);
  assert.ok(!script.includes('matchMedia("(min-width: 1024px)")'));
});
test('browser, notice, server and new SQL consent versions agree without rewriting old history', async () => {
  for (const file of ['privacy.html','js/main.js','.env.example','docs/consent-2026-09-07-v1.md','supabase/migrations/202609070003_privacy_policy_v1.sql']) {
    assert.ok((await read(file)).includes(CONSENT_VERSION),file);
  }
  assert.match(await read('js/main.js'),/data\.set\("consent_version", CONSENT_VERSION\)/);
  assert.ok((await read('.env.example')).includes('APPLICATIONS_ENABLED=false'));
  for (const file of ['docs/consent-2026-09-07-draft.md','docs/consent-2026-09-07.md','supabase/migrations/202609070001_application_intake.sql','supabase/migrations/202609070002_finalize_consent.sql']) {
    assert.ok(!(await read(file)).includes(CONSENT_VERSION),file);
  }
});
