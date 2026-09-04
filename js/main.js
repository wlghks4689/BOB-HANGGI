(function () {
  "use strict";

  const currentYear = new Date().getFullYear();
  document.querySelectorAll("[data-current-year]").forEach((element) => { element.textContent = String(currentYear); });

  const menuButton = document.querySelector("[data-menu-toggle]");
  const navigation = document.querySelector("[data-navigation]");
  function closeMenu() {
    if (!menuButton || !navigation) return;
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.querySelector(".sr-only").textContent = "메뉴 열기";
    navigation.classList.remove("is-open");
    document.body.classList.remove("menu-open");
  }
  if (menuButton && navigation) {
    menuButton.addEventListener("click", () => {
      const willOpen = menuButton.getAttribute("aria-expanded") !== "true";
      menuButton.setAttribute("aria-expanded", String(willOpen));
      menuButton.querySelector(".sr-only").textContent = willOpen ? "메뉴 닫기" : "메뉴 열기";
      navigation.classList.toggle("is-open", willOpen);
      document.body.classList.toggle("menu-open", willOpen);
    });
    navigation.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
    window.addEventListener("resize", () => { if (window.innerWidth >= 768) closeMenu(); });
  }

  const proposalMessage = document.querySelector("[data-proposal-message]");
  document.querySelectorAll("[data-proposal-answer]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!proposalMessage) return;
      proposalMessage.textContent = button.dataset.proposalAnswer === "accept"
        ? "선택이 전달되었습니다. 상대도 수락하면 운영자가 다음 절차를 안내합니다."
        : "선택이 전달되었습니다. 상대에게는 거절 여부나 사유가 공개되지 않습니다.";
    });
  });

  const birthYearSelect = document.querySelector("[data-birth-year]");
  if (birthYearSelect) for (let age = 20; age <= 49; age += 1) birthYearSelect.add(new Option(`${currentYear - age}년`, String(currentYear - age)));
  const heightSelect = document.querySelector("[data-height]");
  if (heightSelect) for (let height = 145; height <= 200; height += 1) heightSelect.add(new Option(`${height}cm`, String(height)));
  document.querySelectorAll("[data-age-select]").forEach((select) => {
    for (let age = 20; age <= 49; age += 1) select.add(new Option(`${age}세`, String(age)));
  });

  const regionOptions = {
    daejeon: ["동구", "중구", "서구", "대덕구", "유성구"],
    sejong: ["아름동", "한솔동", "도담동", "종촌동", "고운동", "보람동", "새롬동", "대평동", "소담동", "다정동", "해밀동", "반곡동", "나성동", "어진동", "집현동"],
  };
  const regionCity = document.querySelector("[data-region-city]");
  const regionDetail = document.querySelector("[data-region-detail]");
  function updateRegionDetails() {
    if (!regionCity || !regionDetail) return;
    const details = regionOptions[regionCity.value] || [];
    regionDetail.replaceChildren(new Option(details.length ? "상세지역 선택" : "먼저 시를 선택해주세요", ""));
    details.forEach((detail) => regionDetail.add(new Option(detail, detail)));
    regionDetail.disabled = details.length === 0;
    regionDetail.value = "";
  }
  if (regionCity) { regionCity.addEventListener("change", updateRegionDetails); updateRegionDetails(); }

  const photoInput = document.querySelector("[data-photo-input]");
  const photoPreview = document.querySelector("[data-photo-preview]");
  const photoName = document.querySelector("[data-photo-name]");
  const photoMessage = document.querySelector("[data-photo-message]");
  let previewUrl = "";
  if (photoInput && photoPreview && photoName && photoMessage) {
    photoInput.addEventListener("change", () => {
      const file = photoInput.files && photoInput.files[0];
      photoMessage.textContent = "";
      if (!file) { photoPreview.hidden = true; return; }
      if (!file.type.startsWith("image/")) { photoInput.value = ""; photoPreview.hidden = true; photoMessage.textContent = "이미지 파일만 선택할 수 있습니다."; return; }
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      previewUrl = URL.createObjectURL(file);
      photoPreview.querySelector("img").src = previewUrl;
      photoName.textContent = file.name;
      photoPreview.hidden = false;
    });
  }

  const loveQuestions = [
    { title: "연락 빈도와 안정감", question: "연인이 평소보다 답장이 늦고, 반나절 동안 별다른 설명이 없습니다. 당신은 어떻게 생각하나요?", answers: [["바쁜 일이 있다고 생각하고 먼저 연락이 올 때까지 기다린다.",5],["무슨 일이 있는지 가볍게 안부를 묻는다.",3],["기다리되, 나중에 연락 기준에 관해 대화한다.",7],["특별한 설명 없이 연락이 끊기는 것은 관계에 대한 배려가 부족하다고 느낀다.",1]] },
    { title: "갈등을 해결하는 시점", question: "말다툼 도중 두 사람 모두 감정이 격해졌습니다. 가장 선호하는 해결 방식은 무엇인가요?", answers: [["감정이 남아 있더라도 그 자리에서 끝까지 해결한다.",1],["잠시 멈추고 몇 시간 뒤 다시 이야기한다.",5],["하루 정도 각자 생각을 정리한 뒤 대화한다.",3],["자연스럽게 감정이 풀릴 때까지 기다리고 필요할 때만 다시 언급한다.",7]] },
    { title: "사과에서 가장 중요한 것", question: "연인이 약속을 잊어 당신이 크게 실망했습니다. 상대가 사과할 때 무엇을 가장 중요하게 보나요?", answers: [["진심으로 미안하다는 감정을 표현하는 것",1],["왜 그런 일이 생겼는지 솔직히 설명하는 것",3],["같은 일이 반복되지 않도록 해결책을 말하는 것",7],["말보다 이후 행동으로 달라진 모습을 보여주는 것",5]] },
    { title: "개인적인 사생활", question: "연인이 ‘서로 숨기는 게 없어야 한다’며 휴대폰 비밀번호를 공유하자고 제안합니다.", answers: [["연인이라면 휴대폰을 자유롭게 볼 수 있어야 한다.",1],["비밀번호는 공유할 수 있지만 허락 없이 보는 것은 안 된다.",3],["필요한 상황에서 보여줄 수는 있지만 비밀번호 공유는 원하지 않는다.",5],["연인 사이에도 휴대폰과 대화 내용은 각자의 사생활이라고 생각한다.",7]] },
    { title: "이성 친구와의 관계", question: "연인에게 오래전부터 친하게 지낸 이성 친구가 있고, 가끔 단둘이 만납니다.", answers: [["오래된 친구라면 단둘이 만나도 문제없다.",7],["미리 알려주고 만남을 숨기지 않는다면 괜찮다.",5],["연락은 괜찮지만 단둘이 만나는 것은 불편하다.",3],["연애를 시작했다면 이성 친구와 일정한 거리를 두어야 한다.",1]] },
    { title: "혼자만의 시간", question: "연인이 주말 하루는 누구도 만나지 않고 혼자 보내고 싶다고 말합니다.", answers: [["연인에게도 혼자만의 시간이 반드시 필요하다고 생각한다.",7],["대부분 존중하지만 중요한 일정이 있다면 조정해야 한다.",5],["이해는 하지만 주말에는 가능한 한 함께 시간을 보내고 싶다.",3],["연애 중에 혼자 있는 시간을 우선하면 거리감이 생긴다고 느낀다.",1]] },
    { title: "애정 표현 방식", question: "연인이 사랑한다는 말은 자주 하지 않지만, 필요한 일을 챙기고 약속을 지킵니다.", answers: [["행동으로 충분히 표현하고 있으므로 만족한다.",7],["행동이 중요하지만 가끔은 말로도 표현해주길 원한다.",5],["말과 행동이 비슷한 수준으로 있어야 사랑을 느낀다.",3],["직접적인 말과 감정 표현이 부족하면 사랑받는다는 확신이 들지 않는다.",1]] },
    { title: "SNS 공개 여부", question: "연인이 교제 사실이나 함께 찍은 사진을 SNS에 올리고 싶어 하지 않습니다.", answers: [["SNS와 실제 관계는 별개이므로 전혀 상관없다.",7],["사진은 없어도 연애 사실을 굳이 숨기지만 않으면 된다.",5],["특별한 날에는 함께한 흔적을 남겨주길 원한다.",3],["공개하지 않으려는 태도는 관계를 감추는 것처럼 느껴진다.",1]] },
    { title: "데이트 비용", question: "두 사람의 수입이 비슷한 상황이라면 데이트 비용을 어떻게 부담하는 것이 가장 좋다고 생각하나요?", answers: [["매번 정확하게 절반씩 부담한다.",7],["한 사람이 결제하면 다음에는 상대가 결제한다.",3],["비용보다 상황과 형편에 따라 자연스럽게 부담한다.",5],["데이트를 제안하거나 장소를 정한 사람이 더 많이 부담한다.",1]] },
    { title: "경제력 차이", question: "당신의 소득이 연인보다 상당히 높아졌습니다.", answers: [["상대가 부담할 수 있는 수준에 맞춰 데이트한다.",5],["더 많이 버는 사람이 자연스럽게 더 부담한다.",1],["기본 비용은 공평하게 부담하고 특별한 소비만 내가 낸다.",3],["소득과 무관하게 각자 사용한 비용은 각자 부담해야 한다.",7]] },
    { title: "소비와 저축", question: "연인은 여행과 취미에 적극적으로 돈을 쓰고, 당신은 미래를 위해 저축을 중요하게 생각합니다.", answers: [["각자의 돈이므로 서로의 소비 방식에 관여하지 않는다.",7],["개인 소비는 존중하되 공동 목표를 위한 금액만 합의한다.",5],["장기적인 관계라면 소비와 저축 기준을 어느 정도 맞춰야 한다.",3],["경제관념이 크게 다르면 장기적인 관계가 어렵다고 생각한다.",1]] },
    { title: "가족과 연인의 경계", question: "연인의 부모님이 두 사람의 데이트나 미래 계획에 자주 의견을 냅니다.", answers: [["가족의 의견도 중요하므로 함께 고려해야 한다.",1],["의견은 듣되 최종 결정은 두 사람이 내려야 한다.",5],["연인이 자신의 가족에게 명확하게 선을 그어주길 원한다.",3],["두 사람의 문제는 가족에게 자세히 공유하지 않아야 한다.",7]] },
    { title: "직업과 장거리 연애", question: "연인이 좋은 기회를 얻어 다른 지역이나 해외에서 2년간 일하게 됐습니다.", answers: [["서로의 성장을 위해 장거리 연애를 시도한다.",5],["구체적인 만남 일정과 미래 계획이 있다면 기다린다.",7],["내가 함께 이동할 가능성까지 진지하게 검토한다.",1],["관계의 미래가 불확실하다면 서로를 위해 헤어질 수도 있다.",3]] },
    { title: "일과 연애의 우선순위", question: "연인이 중요한 프로젝트 때문에 한 달 동안 데이트 횟수를 크게 줄여야 한다고 말합니다.", answers: [["중요한 시기라면 연락과 만남이 줄어도 전적으로 이해한다.",7],["상황은 이해하지만 짧게라도 정기적으로 만나는 시간이 필요하다.",5],["바쁘더라도 관계를 유지하려는 구체적인 노력을 보여줘야 한다.",3],["장기간 연애가 계속 후순위가 된다면 관계를 다시 생각한다.",1]] },
    { title: "동거와 생활 습관", question: "연인과 동거를 시작했는데 청소와 정리 기준이 크게 다릅니다.", answers: [["더 예민한 사람이 원하는 만큼 직접 관리한다.",1],["집안일을 항목별로 정확하게 나눈다.",7],["최소한의 공동 기준을 정하고 나머지는 각자 관리한다.",5],["비용을 함께 부담해 청소 서비스 같은 외부 도움을 이용한다.",3]] },
    { title: "힘든 시기의 위로", question: "연인이 직장에서 힘든 일을 겪은 뒤 계속 같은 이야기를 반복합니다.", answers: [["충분히 들어주고 감정적으로 공감한다.",1],["상대가 원하는 것이 공감인지 해결책인지 먼저 묻는다.",5],["현실적으로 문제를 해결할 수 있는 방법을 함께 찾는다.",7],["어느 정도 들어준 뒤 감정에 오래 머물지 않도록 다른 활동을 제안한다.",3]] },
    { title: "스킨십의 속도", question: "두 사람의 감정은 잘 맞지만 원하는 스킨십의 속도가 다릅니다.", answers: [["속도가 느린 사람이 편안해질 때까지 기다린다.",5],["서로 가능한 범위를 구체적으로 이야기하고 합의한다.",7],["자연스러운 분위기와 감정의 흐름에 맡긴다.",1],["속도와 욕구가 계속 맞지 않으면 관계의 궁합을 다시 생각한다.",3]] },
    { title: "과거 연애에 대한 공유", question: "연인이 이전 연애에 대해 어느 정도 알고 싶어 합니다.", answers: [["현재 관계에 영향을 주지 않는다면 굳이 말할 필요가 없다.",7],["이별 이유와 배운 점 정도만 공유한다.",3],["상대가 궁금해하는 내용에는 가능한 한 솔직하게 답한다.",5],["신뢰를 위해 과거의 중요한 관계는 자세히 공유해야 한다.",1]] },
    { title: "결혼에 대한 속도 차이", question: "교제한 지 1년이 되었고, 한 사람은 빠른 결혼을 원하지만 다른 사람은 아직 확신이 없습니다.", answers: [["결혼 확신이 생길 때까지 현재 관계를 유지한다.",1],["서로 결정할 수 있는 구체적인 기한을 정한다.",7],["결혼 전에 해결해야 할 조건과 불안을 하나씩 확인한다.",5],["결혼 시기에 대한 차이가 크다면 관계를 끝내는 것도 필요하다.",3]] },
    { title: "반복되는 갈등과 관계의 한계", question: "같은 문제로 여러 번 대화했지만 상황이 계속 반복됩니다.", answers: [["사랑이 남아 있다면 해결될 때까지 계속 노력한다.",1],["상대가 바뀌려는 행동을 보이는 동안은 기다린다.",5],["일정한 기간과 기준을 정하고 개선 여부를 판단한다.",7],["반복되는 문제가 나의 신뢰와 존중을 무너뜨렸다면 관계를 끝낸다.",3]] },
  ];

  const questionList = document.querySelector("[data-love-questions]");
  if (questionList) {
    loveQuestions.forEach((item, questionIndex) => {
      const article = document.createElement("article");
      article.className = "love-question";
      const number = String(questionIndex + 1).padStart(2, "0");
      const headingId = `love-question-${number}`;
      article.setAttribute("aria-labelledby", headingId);
      const choices = item.answers.map(([label, score], answerIndex) => `<label class="love-answer"><input type="radio" name="love_q${number}" value="${answerIndex + 1}" data-love-score="${score}" required /><span>${label}</span></label>`).join("");
      article.innerHTML = `<header><span>QUESTION ${number} / 20</span><b>${item.title}</b></header><h3 id="${headingId}">${item.question}</h3><div class="love-answer-list">${choices}</div>`;
      questionList.append(article);
    });
  }

  // TODO: 실제 서비스에서는 개발자 도구로 점수가 노출되지 않도록 Love Color 점수 매핑과 계산을 클라이언트에서 제거하고 서버에서 처리한다.
  const colorMap = {
    1: { name: "RED", hex: "#B45A64" }, 2: { name: "ORANGE", hex: "#B97B50" }, 3: { name: "YELLOW", hex: "#B49A55" },
    4: { name: "GREEN", hex: "#718776" }, 5: { name: "BLUE", hex: "#647D98" }, 6: { name: "INDIGO", hex: "#62677F" }, 7: { name: "VIOLET", hex: "#806F8C" },
  };
  function calculateLoveColor(form) {
    const answers = loveQuestions.map((_, index) => form.querySelector(`input[name="love_q${String(index + 1).padStart(2, "0")}"]:checked`));
    if (answers.some((answer) => !answer)) return null;
    const average = answers.reduce((sum, answer) => sum + Number(answer.dataset.loveScore), 0) / answers.length;
    return colorMap[Math.max(1, Math.min(7, Math.round(average)))];
  }

  const form = document.querySelector("[data-membership-form]");
  const formStatus = document.querySelector("[data-form-status]");
  const loveColorValue = document.querySelector("[data-love-color-value]");
  if (form && formStatus) {
    form.addEventListener("input", (event) => { if (event.target.matches("input, select, textarea")) event.target.removeAttribute("aria-invalid"); });
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      formStatus.className = "form-status";
      const minimumAge = Number(form.elements.preferred_age_min.value);
      const maximumAge = Number(form.elements.preferred_age_max.value);
      if (minimumAge && maximumAge && minimumAge > maximumAge) {
        form.elements.preferred_age_min.setAttribute("aria-invalid", "true");
        form.elements.preferred_age_max.setAttribute("aria-invalid", "true");
        form.elements.preferred_age_min.focus();
        formStatus.textContent = "희망 최소 나이는 최대 나이보다 클 수 없습니다.";
        formStatus.classList.add("is-error"); formStatus.focus(); return;
      }
      if (!form.checkValidity()) {
        const firstInvalid = form.querySelector(":invalid");
        if (firstInvalid) { firstInvalid.setAttribute("aria-invalid", "true"); firstInvalid.focus(); }
        formStatus.textContent = "입력하지 않은 필수 항목과 연애 컬러 질문을 확인해주세요.";
        formStatus.classList.add("is-error"); formStatus.focus(); return;
      }
      const color = calculateLoveColor(form);
      if (!color) { formStatus.textContent = "20개의 연애 컬러 질문에 모두 답해주세요."; formStatus.classList.add("is-error"); formStatus.focus(); return; }
      if (loveColorValue) loveColorValue.value = color.name.toLowerCase();
      formStatus.innerHTML = `<span class="result-label">YOUR LOVE COLOR</span><strong><i style="--result-color:${color.hex}"></i>${color.name}</strong><small>연애에 대한 답변을 기반으로 생성된 무지개색의 남녀만의 식별 컬러입니다.</small><em>프로토타입에서는 실제 정보가 전송되지 않습니다.</em>`;
      formStatus.classList.add("is-success", "love-color-result"); formStatus.focus();
    });
  }
})();
