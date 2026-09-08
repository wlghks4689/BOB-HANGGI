(function () {
  "use strict";
  const $ = selector => document.querySelector(selector);
  const endpoint = window.DaeseBackend?.adminEndpoint || "/api/admin";
  let token = "", loading = false, expiresTimer = null;
  const selected = { male: null, female: null };

  function notify(message, error = false) {
    $('[data-message]').textContent = message;
    $('[data-message]').classList.toggle('is-error', error);
  }
  function element(tag, text, className) {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  }
  function clearSession() {
    token = ""; clearTimeout(expiresTimer); selected.male = null; selected.female = null;
    $('[data-login]').hidden = false; $('[data-workspace]').hidden = true; $('[data-logout]').hidden = true;
    $('[data-men]').replaceChildren(); $('[data-women]').replaceChildren();
    if ($('[data-compare]').open) $('[data-compare]').close();
  }
  async function api(body) {
    const response = await fetch(endpoint, { method:'POST', headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},
      body:JSON.stringify(body),cache:'no-store',signal:AbortSignal.timeout(45000) });
    const result = await response.json();
    if (!response.ok) {
      if ([401,403].includes(response.status) && body.action !== 'login') clearSession();
      throw new Error(result.error || '처리 결과를 확인하지 못했습니다.');
    }
    return result;
  }
  async function run(action) {
    if (loading) return;
    loading = true;
    const controls = [...document.querySelectorAll('button')].filter(control => !control.disabled);
    controls.forEach(control => { control.disabled = true; });
    try { await action(); } catch (error) { notify(error.message || '연결을 확인해주세요.', true); }
    finally { loading = false; controls.forEach(control => { control.disabled = false; }); }
  }
  const city = value => ({daejeon:'대전',sejong:'세종'}[value] || value);
  const height = value => value === '195_plus' ? '195cm 이상' : `${value}cm`;

  function memberButton(member) {
    const button = element('button', undefined, 'pool-member'); button.type = 'button'; button.dataset.id = member.id;
    const marker = element('span', member.name.slice(0,1), 'pool-member-marker');
    const copy = element('span', undefined, 'pool-member-copy');
    copy.append(element('strong', member.name), element('small', `${member.birth_year}년 · ${height(member.height)} · ${member.mbti}`),
      element('small', `${city(member.region_city)} ${member.region_detail} · ${member.job_other || member.job_category}`));
    button.append(marker, copy);
    button.addEventListener('click', () => run(async () => {
      selected[member.gender] = member;
      document.querySelectorAll(`[data-id]`).forEach(node => node.setAttribute('aria-pressed', String(node.dataset.id === selected.male?.id || node.dataset.id === selected.female?.id)));
      notify(`${member.gender === 'male' ? '남성' : '여성'} 회원 ${member.name}님을 선택했습니다.`);
      if (selected.male && selected.female) await showComparison();
    }));
    button.setAttribute('aria-pressed','false');
    return button;
  }
  async function loadPool() {
    const result = await api({action:'pool-list'});
    const men = result.members.filter(member => member.gender === 'male');
    const women = result.members.filter(member => member.gender === 'female');
    $('[data-men-count]').textContent = men.length; $('[data-women-count]').textContent = women.length;
    const menTarget = $('[data-men]'), womenTarget = $('[data-women]'); menTarget.replaceChildren(); womenTarget.replaceChildren();
    men.forEach(member => menTarget.append(memberButton(member))); women.forEach(member => womenTarget.append(memberButton(member)));
    if (!men.length) menTarget.append(element('p','승인된 남성 회원이 없습니다.','pool-empty'));
    if (!women.length) womenTarget.append(element('p','승인된 여성 회원이 없습니다.','pool-empty'));
  }
  function profile(result) {
    const member = result.member, article = element('article',undefined,'pool-profile');
    if (result.photoUrl) { const image=element('img');image.src=result.photoUrl;image.alt=`${member.name} 프로필 사진`;image.referrerPolicy='no-referrer';article.append(image); }
    article.append(element('h3',member.name),element('p',`${member.birth_year}년 · ${height(member.height)} · ${member.mbti}`,'pool-profile-lead'));
    const fields=[['지역',`${city(member.region_city)} ${member.region_detail}`],['직업',member.job_other||member.job_category],['관심사',member.interests.join(', ')],
      ['흡연',{yes:'흡연',vape:'전자담배',none:'비흡연'}[member.smoking]],['음주',{none:'마시지 않음',monthly:'월 1~2회',weekly:'주 1~2회',often:'주 3회 이상'}[member.drinking]],
      ['반려동물',{none:'없음',dog:'강아지',cat:'고양이',other:'기타'}[member.pet]],['종교',result.sensitive?.religion||'수집하지 않음'],
      ['선호 나이',`${member.preferred_age_min}~${member.preferred_age_max}세`],['우선 조건',member.priority_condition],['있으면 좋은 조건',member.preferred_condition||'—']];
    const dl=element('dl');fields.forEach(([key,value])=>dl.append(element('dt',key),element('dd',value)));article.append(dl);return article;
  }
  async function showComparison() {
    const [man,woman]=await Promise.all([api({action:'pool-detail',id:selected.male.id}),api({action:'pool-detail',id:selected.female.id})]);
    $('[data-comparison]').replaceChildren(profile(man),profile(woman));
    $('[data-compare]').showModal();
  }

  $('[data-login]').addEventListener('submit', event => { event.preventDefault(); const form=event.currentTarget; run(async()=>{
    let session;try{session=await api({action:'login',email:form.elements.email.value.trim(),password:form.elements.password.value});}finally{form.elements.password.value='';}
    token=session.accessToken;expiresTimer=setTimeout(()=>{clearSession();notify('로그인이 만료되었습니다. 다시 로그인해주세요.');},Math.max(1,session.expiresIn-30)*1000);
    form.hidden=true;$('[data-workspace]').hidden=false;$('[data-logout]').hidden=false;await loadPool();notify('승인 회원 풀을 불러왔습니다.');
  }); });
  $('[data-logout]').addEventListener('click',()=>run(async()=>{try{await api({action:'logout'});}finally{clearSession();notify('로그아웃했습니다.');}}));
  $('[data-close]').addEventListener('click',()=> $('[data-compare]').close());
  $('[data-compare]').addEventListener('click',event=>{if(event.target===event.currentTarget)event.currentTarget.close();});
  window.addEventListener('pagehide',clearSession);
})();
