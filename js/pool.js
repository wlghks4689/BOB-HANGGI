(function () {
  "use strict";
  const $ = selector => document.querySelector(selector);
  const endpoint = window.DaeseBackend?.adminEndpoint || "/api/admin";
  const sessionStore = window.DaeseAdminSession;
  let token = "", loading = false, expiresTimer = null;
  const selected = { male: null, female: null };
  const mockMembers = [
    {id:'M001',name:'김도윤',age:31,gender:'male',region_city:'daejeon',region_detail:'서구',job_category:'IT 개발자',height:'181',mbti:'INTJ',smoking:'X',drinking:'가끔',interests:['운동','커피','여행'],matching_status:'matching_available',mock:true,photoPosition:'0% 0%'},
    {id:'M002',name:'박준호',age:29,gender:'male',region_city:'sejong',region_detail:'고운동',job_category:'마케터',height:'176',mbti:'ENFP',smoking:'X',drinking:'주 1~2회',interests:['맛집','영화','전시'],matching_status:'matching_progress',mock:true,photoPosition:'33.333% 0%'},
    {id:'M003',name:'이현우',age:34,gender:'male',region_city:'daejeon',region_detail:'중구',job_category:'회계사',height:'183',mbti:'ISTJ',smoking:'X',drinking:'거의 안 함',interests:['골프','독서','여행'],matching_status:'dormant',mock:true,photoPosition:'66.666% 0%'},
    {id:'M004',name:'최민석',age:28,gender:'male',region_city:'daejeon',region_detail:'동구',job_category:'디자이너',height:'178',mbti:'ISFP',smoking:'O',drinking:'주 2회',interests:['사진','음악','패션'],matching_status:'matching_available',mock:true,photoPosition:'100% 0%'},
    {id:'W001',name:'한서윤',age:29,gender:'female',region_city:'daejeon',region_detail:'서구',job_category:'약사',height:'165',mbti:'INFJ',smoking:'X',drinking:'가끔',interests:['여행','카페','독서'],matching_status:'matching_available',mock:true,photoPosition:'0% 100%'},
    {id:'W002',name:'정유진',age:27,gender:'female',region_city:'sejong',region_detail:'보람동',job_category:'브랜드 디자이너',height:'168',mbti:'ENFP',smoking:'X',drinking:'주 1회',interests:['전시','맛집','사진'],matching_status:'matching_progress',mock:true,photoPosition:'33.333% 100%'},
    {id:'W003',name:'김하린',age:32,gender:'female',region_city:'daejeon',region_detail:'동구',job_category:'변호사',height:'163',mbti:'ENTJ',smoking:'X',drinking:'거의 안 함',interests:['운동','와인','독서'],matching_status:'dormant',mock:true,photoPosition:'66.666% 100%'},
    {id:'W004',name:'오지민',age:28,gender:'female',region_city:'daejeon',region_detail:'대덕구',job_category:'간호사',height:'166',mbti:'ISFJ',smoking:'X',drinking:'가끔',interests:['영화','산책','반려동물'],matching_status:'matching_available',mock:true,photoPosition:'100% 100%'},
  ].map((member,index)=>({...member,pet:['none','dog','cat','none'][index%4],religion:['무교','기독교','무교','불교'][index%4],
    preferred_age_relation:['any','same','younger','older'][index%4],preferred_age_min:member.age-3,preferred_age_max:member.age+3,
    priority_condition:['대화가 잘 통하는 분','생활 패턴이 비슷한 분','신뢰감 있고 배려하는 분','취미를 함께 즐길 수 있는 분'][index%4],
    preferred_condition:['주말에 함께 외출하는 분','새로운 장소를 좋아하는 분','꾸준히 운동하는 분','서로의 일을 존중하는 분'][index%4]}));
  const memberStatuses = {
    matching_available:{icon:'🟢',label:'매칭 가능'},matching_progress:{icon:'🟡',label:'소개 진행 중'},dormant:{icon:'⚪',label:'휴면'},
  };
  const photoObserver = 'IntersectionObserver' in window ? new IntersectionObserver(entries=>entries.forEach(entry=>{
    if(!entry.isIntersecting)return;photoObserver.unobserve(entry.target);const id=entry.target.dataset.photoId;
    api({action:'pool-photo',id}).then(result=>{if(!result.photoUrl)return;const image=element('img');image.className='pool-member-photo';image.src=result.photoUrl;
      image.alt=entry.target.getAttribute('aria-label');image.referrerPolicy='no-referrer';entry.target.replaceWith(image);}).catch(()=>{});
  }),{rootMargin:'160px'}) : null;

  function notify(message, error = false) {
    $('[data-message]').textContent = message;
    $('[data-message]').classList.toggle('is-error', error);
    $('[data-message]').hidden = !message;
  }
  function element(tag, text, className) {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  }
  function clearSession() {
    token = ""; sessionStore.clear(); clearTimeout(expiresTimer); selected.male = null; selected.female = null;
    $('[data-login]').hidden = false; $('[data-workspace]').hidden = true; $('[data-logout]').hidden = true;
    $('[data-admin-nav]').hidden = true;
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
  const age = member => member.age ? `${member.age}세` : `${new Date().getFullYear() - member.birth_year}세`;

  function mockPhoto(member, className) {
    const photo=element('span',undefined,className);photo.style.backgroundPosition=member.photoPosition;
    photo.setAttribute('role','img');photo.setAttribute('aria-label',`${member.name} 가상 프로필 사진`);return photo;
  }

  function memberButton(member) {
    member.matching_status ||= 'matching_available';
    const wrap=element('article',undefined,'pool-member-wrap');
    const button = element('button', undefined, 'pool-member'); button.type = 'button'; button.dataset.id = member.id;
    const marker = member.mock ? mockPhoto(member,'pool-member-photo') : element('span', member.name.slice(0,1), 'pool-member-marker');
    if(!member.mock){marker.dataset.photoId=member.id;marker.setAttribute('aria-label',`${member.name} 프로필 사진`);photoObserver?.observe(marker);}
    const copy = element('span', undefined, 'pool-member-copy');
    const name=element('strong',member.name);
    const state=memberStatuses[member.matching_status];name.append(element('b',`${state.icon} ${state.label}`,`pool-status ${member.matching_status}`));
    copy.append(name, element('small', `${age(member)} · ${city(member.region_city)} ${member.region_detail} · ${member.job_other || member.job_category} · ${height(member.height)}`));
    button.append(marker, copy);
    button.addEventListener('click', () => run(async () => {
      selected[member.gender] = selected[member.gender]?.id === member.id ? null : member;
      updateSelection();
      if (selected.male && selected.female) await showComparison();
    }));
    button.setAttribute('aria-pressed','false');
    const detailButton=element('button','상세보기','pool-detail-button');detailButton.type='button';detailButton.hidden=true;
    detailButton.addEventListener('click',()=>run(()=>showSingle(member)));
    wrap.append(button,detailButton);return wrap;
  }

  function updateSelection() {
    document.querySelectorAll('[data-id]').forEach(node=>{
      const active=node.dataset.id===selected.male?.id||node.dataset.id===selected.female?.id;
      node.setAttribute('aria-pressed',String(active));node.closest('.pool-member-wrap').querySelector('.pool-detail-button').hidden=!active;
    });
  }
  async function loadPool() {
    const result = await api({action:'pool-list'});
    const members = location.hostname === 'localhost' || location.hostname === '127.0.0.1' ? [...mockMembers,...result.members] : result.members;
    const men = members.filter(member => member.gender === 'male');
    const women = members.filter(member => member.gender === 'female');
    $('[data-men-count]').textContent = men.length; $('[data-women-count]').textContent = women.length;
    const menTarget = $('[data-men]'), womenTarget = $('[data-women]'); menTarget.replaceChildren(); womenTarget.replaceChildren();
    men.forEach(member => menTarget.append(memberButton(member))); women.forEach(member => womenTarget.append(memberButton(member)));
    if (!men.length) menTarget.append(element('p','승인된 남성 회원이 없습니다.','pool-empty'));
    if (!women.length) womenTarget.append(element('p','승인된 여성 회원이 없습니다.','pool-empty'));
  }
  function profile(result) {
    const member = result.member, article = element('article',undefined,'pool-profile');
    if(member.mock)article.append(mockPhoto(member,'pool-profile-mock-photo'));
    else if (result.photoUrl) { const image=element('img');image.src=result.photoUrl;image.alt=`${member.name} 프로필 사진`;image.referrerPolicy='no-referrer';article.append(image); }
    const state=memberStatuses[member.matching_status||'matching_available'];
    const heading=element('h3',member.name);heading.append(element('span',`${state.icon} ${state.label}`,'pool-profile-status'));
    article.append(heading,element('p',`${age(member)} · ${height(member.height)} · ${member.mbti}`,'pool-profile-lead'));
    const fields=[['지역',`${city(member.region_city)} ${member.region_detail}`],['직업',member.job_other||member.job_category],['관심사',member.interests.join(', ')],
      ['흡연',member.mock?member.smoking:{yes:'흡연',vape:'전자담배',none:'비흡연'}[member.smoking]],['음주',member.mock?member.drinking:{none:'마시지 않음',monthly:'월 1~2회',weekly:'주 1~2회',often:'주 3회 이상'}[member.drinking]]];
    fields.push(['반려동물',{none:'없음',dog:'강아지',cat:'고양이',other:'기타'}[member.pet]||'미입력'],['종교',result.sensitive?.religion||member.religion||'수집하지 않음'],
      ['선호 나이 관계',{older:'연상',younger:'연하',same:'동갑',any:'상관없음'}[member.preferred_age_relation]||'미입력'],
      ['희망 나이',member.preferred_age_min&&member.preferred_age_max?`${member.preferred_age_min}~${member.preferred_age_max}세`:'미입력'],
      ['가장 우선하는 조건',member.priority_condition||'미입력'],['있으면 좋은 조건',member.preferred_condition||'미입력'],
      ['연락처',result.contact?.phone?`${result.contact.phone}${result.contact.phone_verified?' · 인증됨':' · 미인증'}`:member.mock?'010-xxxx-xxxx':'미입력']);
    const dl=element('dl');fields.forEach(([key,value])=>dl.append(element('dt',key),element('dd',value)));article.append(dl);return article;
  }
  const memberDetail=member=>member.mock?Promise.resolve({member,sensitive:null,contact:null,photoUrl:null}):api({action:'pool-detail',id:member.id});
  async function showSingle(member){const result=await memberDetail(member);$('[data-dialog-kicker]').textContent='MEMBER PROFILE';$('[data-dialog-title]').textContent='회원 상세';
    $('[data-comparison]').classList.add('is-single');$('[data-comparison]').replaceChildren(profile(result));$('[data-compare]').showModal();}
  async function showComparison() {
    const [man,woman]=await Promise.all([memberDetail(selected.male),memberDetail(selected.female)]);
    $('[data-dialog-kicker]').textContent='PROFILE COMPARISON';$('[data-dialog-title]').textContent='선택 회원 비교';
    $('[data-comparison]').classList.remove('is-single');$('[data-comparison]').replaceChildren(profile(man),profile(woman));
    $('[data-compare]').showModal();
  }

  $('[data-login]').addEventListener('submit', event => { event.preventDefault(); const form=event.currentTarget; run(async()=>{
    let session;try{session=await api({action:'login',email:form.elements.email.value.trim(),password:form.elements.password.value});}finally{form.elements.password.value='';}
    token=session.accessToken;sessionStore.save(session.accessToken,session.expiresIn);expiresTimer=setTimeout(()=>{clearSession();notify('로그인이 만료되었습니다. 다시 로그인해주세요.');},Math.max(1,session.expiresIn-30)*1000);
    form.hidden=true;$('[data-workspace]').hidden=false;$('[data-logout]').hidden=false;$('[data-admin-nav]').hidden=false;await loadPool();notify('');
  }); });
  $('[data-logout]').addEventListener('click',()=>run(async()=>{try{await api({action:'logout'});}finally{clearSession();notify('로그아웃했습니다.');}}));
  $('[data-close]').addEventListener('click',()=> $('[data-compare]').close());
  $('[data-compare]').addEventListener('click',event=>{if(event.target===event.currentTarget)event.currentTarget.close();});
  const savedSession=sessionStore.load();
  if(savedSession){token=savedSession.accessToken;expiresTimer=setTimeout(()=>{clearSession();notify('로그인이 만료되었습니다. 다시 로그인해주세요.');},Math.max(1,savedSession.expiresIn-30)*1000);
    $('[data-login]').hidden=true;$('[data-workspace]').hidden=false;$('[data-logout]').hidden=false;$('[data-admin-nav]').hidden=false;
    run(async()=>{await loadPool();notify('');});}
})();
