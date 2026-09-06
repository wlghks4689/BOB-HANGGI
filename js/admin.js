(function () {
  "use strict";
  const $ = (selector) => document.querySelector(selector);
  const endpoint = window.DaeseBackend?.adminEndpoint || "/api/admin";
  const labels = { submitted: "접수", reviewing: "검토 중", approved: "승인", rejected: "미승인", pending: "미검토" };
  let token = "", offset = 0, current = null, generation = 0, expiresTimer = null, loading = false;
  function notify(message, error = false) { $('[data-message]').textContent = message; $('[data-message]').classList.toggle('is-error', error); }
  function clearSession() {
    token = ""; current = null; generation++; clearTimeout(expiresTimer);
    $('[data-login]').hidden = false; $('[data-workspace]').hidden = true; $('[data-logout]').hidden = true;
    $('[data-list]').replaceChildren(); $('[data-detail]').replaceChildren(); $('[data-login]').reset();
    $('[data-delete-dialog]').close(); $('#delete-confirm').value = "";
  }
  async function api(body) {
    const response = await fetch(endpoint, { method: "POST", headers: {
      "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }, body: JSON.stringify(body), cache: "no-store", signal: AbortSignal.timeout(45000) });
    const result = await response.json();
    if (!response.ok) {
      if ([401,403].includes(response.status) && body.action !== "login") clearSession();
      throw new Error(result.error || "처리 결과를 확인하지 못했습니다. 새로고침 후 확인해주세요.");
    }
    return result;
  }
  async function run(action) {
    if (loading) return;
    loading = true;
    const controls = Array.from(document.querySelectorAll('button, select')).filter(control => !control.disabled);
    controls.forEach(control => { control.disabled = true; });
    try { await action(); } catch (error) { notify(error.message || "연결을 확인해주세요.", true); }
    finally { loading = false; controls.forEach(control => { control.disabled = false; });
      $('[data-prev]').disabled = offset === 0; $('[data-next]').disabled = $('[data-list]').childElementCount < 25 || !token;
    }
  }
  function element(tag, text, className) { const node = document.createElement(tag); if (text !== undefined) node.textContent = text; if (className) node.className = className; return node; }
  const date = (value) => value ? new Date(value).toLocaleString('ko-KR') : "—";
  async function loadList() {
    const revision = generation;
    const result = await api({ action: "list", status: $('[data-filter]').value, offset });
    if (revision !== generation) return;
    const list = $('[data-list]'); list.replaceChildren();
    for (const application of result.applications) {
      const button = element('button'); button.type = "button";
      button.append(element('strong', application.name), element('small', `${application.birth_year}년 · ${{ daejeon: '대전', sejong: '세종' }[application.region_city]} · ${labels[application.status]}`), element('small', date(application.created_at)));
      button.addEventListener('click', () => run(async () => { await loadDetail(application.id); notify('신청서를 불러왔습니다.'); }));
      list.append(button);
    }
    if (!result.applications.length) list.append(element('p', '해당 신청서가 없습니다.'));
    $('[data-page]').textContent = `${offset / 25 + 1}페이지`;
    $('[data-next]').disabled = result.applications.length < 25;
  }
  function selectField(form, label, name, options, value) {
    const input = element('select'); input.name = name; input.id = `review-${name}`;
    for (const option of options) { const node = element('option', labels[option]); node.value = option; input.append(node); }
    input.value = value;
    const title = element('label', label); title.htmlFor = input.id; form.append(title, input);
  }
  async function loadDetail(id) {
    const revision = generation;
    const result = await api({ action: "detail", id });
    if (revision !== generation) return;
    current = result.application;
    const a = current, target = $('[data-detail]'); target.replaceChildren();
    target.append(element('h2', a.name), element('p', `접수번호: ${a.id}`));
    if (result.photoUrl) {
      const image = element('img'); image.alt = '신청자가 제출한 프로필 사진'; image.referrerPolicy = 'no-referrer'; image.src = result.photoUrl;
      image.addEventListener('error', () => { image.remove(); notify('사진 링크가 만료되었거나 불러오지 못했습니다. 신청서를 다시 선택해주세요.', true); });
      target.append(image);
    } else target.append(element('p', '사진을 불러오지 못했습니다. 사진 확인 전에는 승인하지 마세요.', 'admin-help'));
    target.append(element('p', '사진은 정면 얼굴이 선명한지 직접 확인해주세요.', 'admin-help'));
    const fields = [
      ['접수 시각', date(a.created_at)], ['상태', labels[a.status]], ['출생연도', a.birth_year],
      ['성별', a.gender === 'male' ? '남자' : '여자'], ['지역', `${{ daejeon: '대전', sejong: '세종' }[a.region_city]} ${a.region_detail}`],
      ['직업', a.job_other || a.job_category], ['키', a.height === '195_plus' ? '195cm이상' : `${a.height}cm`], ['MBTI', a.mbti],
      ['관심사', a.interests.join(', ')], ['흡연', { yes:'흡연', vape:'전자담배', none:'비흡연' }[a.smoking]],
      ['음주', { none:'마시지 않음', monthly:'월 1~2회', weekly:'주 1~2회', often:'주 3회 이상' }[a.drinking]],
      ['반려동물', { none:'없음', dog:'강아지', cat:'고양이', other:'기타' }[a.pet]],
      ['선호 나이 관계', { older:'연상', younger:'연하', same:'동갑', any:'상관없음' }[a.preferred_age_relation]],
      ['희망 나이', `${a.preferred_age_min}~${a.preferred_age_max}세`], ['우선 조건', a.priority_condition], ['있으면 좋은 조건', a.preferred_condition || '—'],
      ['연락처', `${result.contact?.phone || '—'} (본인 인증 안 됨)`], ['종교', result.sensitive?.religion || '수집하지 않음'],
      ['필수 동의', result.consent?.required_consent ? '동의' : '확인 필요'], ['종교 수집 동의', result.consent?.religion_consent ? '동의' : '미동의'],
      ['동의 문서 버전', result.consent?.document_version], ['동의 시각', date(result.consent?.consented_at)],
    ];
    const dl = element('dl'); for (const [key, value] of fields) dl.append(element('dt', key), element('dd', String(value ?? '—'))); target.append(dl);
    const form = element('form');
    selectField(form, '사진 검토', 'photoReview', ['pending','approved','rejected'], a.photo_review);
    selectField(form, '신청 상태', 'status', ['submitted','reviewing','approved','rejected'], a.status);
    const label = element('label', '관리자 메모'); label.htmlFor = 'review-note';
    const note = element('textarea'); note.name = 'note'; note.id = 'review-note'; note.maxLength = 3000; note.rows = 4; note.value = a.admin_note;
    const actions = element('div', undefined, 'admin-actions');
    const save = element('button', '검토 내용 저장'); save.type = 'submit';
    const remove = element('button', '신청서 삭제', 'danger'); remove.type = 'button';
    remove.addEventListener('click', () => { if (!current || loading) return; $('[data-delete-id]').textContent = current.id; $('#delete-confirm').value = ''; $('[data-delete-dialog]').showModal(); });
    actions.append(save, remove); form.append(label, note, actions);
    form.addEventListener('submit', event => { event.preventDefault(); const data = new FormData(form);
      run(async () => { await api({ action:'review', id:a.id, updatedAt:a.updated_at, status:data.get('status'), photoReview:data.get('photoReview'), note:data.get('note') });
        await loadDetail(a.id); await loadList(); notify('검토 내용을 저장했습니다.'); });
    });
    target.append(form); target.focus();
  }
  $('[data-login]').addEventListener('submit', event => {
    event.preventDefault();
    const form = event.currentTarget;
    run(async () => {
      let session;
      try { session = await api({ action:'login', email:form.elements.email.value.trim(), password:form.elements.password.value }); }
      finally { form.elements.password.value = ''; }
      token = session.accessToken; generation++; offset = 0;
      expiresTimer = setTimeout(() => { clearSession(); notify('로그인이 만료되었습니다. 다시 로그인해주세요.'); }, Math.max(1, session.expiresIn - 30) * 1000);
      form.hidden = true; $('[data-workspace]').hidden = false; $('[data-logout]').hidden = false;
      await loadList(); notify('관리자로 로그인했습니다.');
    });
  });
  $('[data-logout]').addEventListener('click', () => run(async () => { try { await api({ action:'logout' }); } finally { clearSession(); notify('로그아웃했습니다.'); } }));
  $('[data-refresh]').addEventListener('click', () => run(loadList));
  $('[data-filter]').addEventListener('change', () => run(async () => { offset = 0; await loadList(); }));
  $('[data-prev]').addEventListener('click', () => run(async () => { offset = Math.max(0, offset - 25); await loadList(); }));
  $('[data-next]').addEventListener('click', () => run(async () => { offset += 25; await loadList(); }));
  $('[data-cleanup]').addEventListener('click', () => run(async () => { const result = await api({ action:'cleanup' }); notify(`삭제 대기 사진 ${result.removed}건을 정리했습니다.`); }));
  $('[data-delete-cancel]').addEventListener('click', () => $('[data-delete-dialog]').close());
  $('[data-delete-confirm]').addEventListener('click', () => run(async () => {
    if (!current) return;
    if ($('#delete-confirm').value !== current.id) throw new Error('접수번호가 일치하지 않습니다.');
    const result = await api({ action:'delete', id:current.id, confirmId:$('#delete-confirm').value });
    $('[data-delete-dialog]').close(); current = null; $('[data-detail]').replaceChildren(element('p', '신청서가 삭제되었습니다.'));
    await loadList();
    notify(result.photosPending ? '신청 정보는 삭제했습니다. 사진 삭제는 대기 중입니다. 사진 삭제 재시도 버튼을 눌러주세요.' : '신청 정보와 사진 삭제 처리를 완료했습니다.');
  }));
  window.addEventListener('pagehide', clearSession);
})();
