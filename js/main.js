(function () {
  "use strict";


  // One reusable component for future preview/admin pages; values never enter innerHTML.
  function fitProfileFavorites(card, favorites) {
    const target = card.querySelector('[data-profile="favorites"]');
    const values = (Array.isArray(favorites) ? favorites : []).map((value) => String(value || "").trim()).filter(Boolean);
    const joined = values.join(", ") || "—";
    target.textContent = joined;
    // Keep every interest in the accessible text; narrow cards ellipsize visually.
    target.title = joined;
  }

  function updateProfileCard(card, profile = {}) {
    card.toggleAttribute("data-personalized", !profile.isSample);
    const numericHeight = Number(profile.height);
    const values = {
      name: profile.name, birthYear: profile.birthYear, location: profile.location, mbti: profile.mbti,
      height: Number.isFinite(numericHeight) && numericHeight > 0 ? `${numericHeight}cm` : "",
    };
    Object.entries(values).forEach(([key, value]) => {
      const target = card.querySelector(`[data-profile="${key}"]`);
      target.textContent = String(value || "—");
      target.title = String(value || "");
    });
    const image = card.querySelector('[data-profile="photo"]');
    if (profile.photoUrl) {
      if (image.getAttribute("src") !== profile.photoUrl) image.src = profile.photoUrl;
    } else image.removeAttribute("src");
    image.hidden = !profile.photoUrl;
    card.querySelector("[data-profile-photo-placeholder]").hidden = Boolean(profile.photoUrl);
    fitProfileFavorites(card, profile.favorites || []);
    card.querySelector(".profile-card-art").alt = profile.isSample
      ? "프로필 카드 예시 사진과 장식"
      : "";
  }

  // Keep the original artwork byte-for-byte; overlay only personalized content.
  function renderProfileCard(profile = {}) {
    const template = document.createElement("template");
    template.innerHTML = `
      <article class="profile-card" aria-label="본인 확인용 프로필 카드">
        <img class="profile-card-art" src="assets/profile-card-original.png" width="1086" height="1448" alt="" />
        <div class="profile-card-overlay">
          <div class="member-photo"><img data-profile="photo" alt="내 프로필 사진" hidden /><span data-profile-photo-placeholder>사진을 등록해주세요</span></div>
          <span class="card-label" data-label="name">NAME</span>
          <span class="card-label" data-label="birthYear">YEAR OF BIRTH</span>
          <span class="card-label" data-label="favorites">FAVORITES</span>
          <span class="card-label" data-label="location">LOCATION</span>
          <span class="card-label" data-label="mbti">MBTI</span>
          <span class="card-label" data-label="height">HEIGHT</span>
          <span class="card-value" data-profile="name" aria-label="이름"></span>
          <span class="card-value" data-profile="birthYear" aria-label="출생연도"></span>
          <span class="card-value" data-profile="favorites" aria-label="관심사"></span>
          <span class="card-value" data-profile="location" aria-label="지역"></span>
          <span class="card-value" data-profile="mbti" aria-label="MBTI"></span>
          <span class="card-value" data-profile="height" aria-label="키"></span>
          <div class="card-decisions" role="group" aria-label="매칭 선택 버튼 미리보기">
            <button type="button" disabled title="본인 프로필 미리보기에서는 선택할 수 없습니다">만나볼게요</button>
            <button type="button" disabled title="본인 프로필 미리보기에서는 선택할 수 없습니다">패스할게요</button>
          </div>
        </div>
      </article>`;
    const card = template.content.firstElementChild;
    updateProfileCard(card, profile);
    return card;
  }
  // TODO: Match Proposal에서는 이름을 상대방에게 공개하지 않는 별도 mode를 구현한다.
  // 현재 컴포넌트는 본인 확인용 preview 전용이며 상대방 전송 기능은 없다.
  window.DaeseProfileCard = Object.freeze({ render: renderProfileCard, update: updateProfileCard });

  const form = document.querySelector("[data-membership-form]");
  if (!form) return;

  const currentYear = new Date().getFullYear();
  const birthYear = form.querySelector("[data-birth-year]");
  for (let age = 20; age <= 49; age += 1) {
    birthYear.add(new Option(`${currentYear - age}년`, String(currentYear - age)));
  }
  const height = form.querySelector("[data-height]");
  for (let value = 145; value <= 200; value += 1) {
    height.add(new Option(`${value}cm`, String(value)));
  }
  form.querySelectorAll("[data-age-select]").forEach((select) => {
    for (let age = 20; age <= 49; age += 1) select.add(new Option(`${age}세`, String(age)));
  });

  const regions = {
    daejeon: ["동구", "중구", "서구", "대덕구", "유성구"],
    sejong: ["아름동", "한솔동", "도담동", "종촌동", "고운동", "보람동", "새롬동", "대평동", "소담동", "다정동", "해밀동", "반곡동", "나성동", "어진동", "집현동"],
  };
  const city = form.elements.region_city;
  const detail = form.elements.region_detail;
  function updateRegionDetails() {
    const options = regions[city.value] || [];
    detail.replaceChildren(new Option(options.length ? "상세 지역 선택" : "먼저 지역을 선택해주세요", ""));
    options.forEach((value) => detail.add(new Option(value, value)));
    detail.disabled = options.length === 0;
    detail.value = "";
    clearError(detail);
  }
  form.querySelectorAll('[name="region_city"]').forEach((option) => option.addEventListener("change", updateRegionDetails));
  updateRegionDetails();

  const photo = form.elements.profile_photo;
  const preview = form.querySelector("[data-photo-preview]");
  const previewImage = preview.querySelector("img");
  const photoMessage = form.querySelector("[data-photo-message]");
  let previewUrl = "";

  const sampleProfile = { isSample: true, name: "김지연", birthYear: "2003", favorites: ["게임", "고양이"], location: "대전", mbti: "INTJ", height: 165, photoUrl: "" };
  const cardMount = document.querySelector("[data-profile-card-mount]");
  const previewPanel = document.querySelector("[data-profile-panel]");
  const previewDetails = document.querySelector("[data-preview-details]");
  const previewState = document.querySelector("[data-preview-state]");
  let profileCard;
  let currentProfile = sampleProfile;
  function updateMemberPreview() {
    if (!profileCard) return;
    const favorites = [1, 2, 3].map((n) => form.elements[`interest_${n}`].value.trim()).filter(Boolean);
    const values = {
      name: form.elements.name.value.trim(),
      birthYear: form.elements.birth_year.value,
      favorites,
      location: { daejeon: "대전", sejong: "세종" }[city.value] || "",
      mbti: form.elements.mbti.value,
      height: form.elements.height.value,
      photoUrl: previewUrl,
    };
    const hasValues = Object.entries(values).some(([key, value]) => key === "favorites" ? value.length : Boolean(value));
    currentProfile = hasValues ? values : sampleProfile;
    previewState.textContent = hasValues ? "소개 제안 시 전달되는 형식입니다" : "예시 프로필 · 입력하면 내 정보로 바뀝니다";
    updateProfileCard(profileCard, currentProfile);
  }
  if (cardMount && previewPanel && previewDetails && previewState) {
    profileCard = renderProfileCard(sampleProfile);
    cardMount.replaceChildren(profileCard);
    previewPanel.hidden = false;
    const desktop = window.matchMedia("(min-width: 1024px)");
    const setPreviewLayout = () => { previewDetails.open = desktop.matches; };
    setPreviewLayout();
    desktop.addEventListener("change", setPreviewLayout);
    previewDetails.addEventListener("toggle", () => {
      if (previewDetails.open) fitProfileFavorites(profileCard, currentProfile.favorites);
    });
    let previousWidth = 0;
    new ResizeObserver((entries) => {
      const width = entries[0].contentRect.width;
      if (width && width !== previousWidth) {
        previousWidth = width;
        fitProfileFavorites(profileCard, currentProfile.favorites);
      }
    }).observe(cardMount);
    updateMemberPreview();
    document.fonts.ready.then(() => fitProfileFavorites(profileCard, currentProfile.favorites));
  }

  // Crops stay in memory. The original File is kept for lossless re-framing.
  const cropDialog = document.querySelector("[data-crop-dialog]");
  const cropViewport = document.querySelector("[data-crop-viewport]");
  const cropImage = document.querySelector("[data-crop-image]");
  const cropZoom = document.querySelector("[data-crop-zoom]");
  const cropX = document.querySelector("[data-crop-x]");
  const cropY = document.querySelector("[data-crop-y]");
  const cropSave = document.querySelector("[data-crop-save]");
  const cropMessage = document.querySelector("[data-crop-message]");
  let originalFile = null;
  let croppedFile = null;
  let savedCrop = { zoom: 1, x: 50, y: 50 };
  let draftFile = null;
  let draftUrl = "";
  let cropState = { ...savedCrop };
  let loadVersion = 0;
  let savingCrop = false;
  let drag = null;

  function restoreFileInput() {
    const files = new DataTransfer();
    if (originalFile) files.items.add(originalFile);
    photo.files = files.files;
  }
  function clearPreview() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = "";
    originalFile = null;
    croppedFile = null;
    preview.hidden = true;
    previewImage.removeAttribute("src");
    form.querySelector("[data-upload-label]").textContent = "사진 선택하기";
    updateMemberPreview();
  }
  function photoError(message) {
    photoMessage.textContent = message;
    photo.setCustomValidity(originalFile ? "" : message);
    restoreFileInput();
  }
  function cropGeometry() {
    const width = cropViewport.clientWidth;
    const height = cropViewport.clientHeight;
    const scale = Math.max(width / cropImage.naturalWidth, height / cropImage.naturalHeight) * cropState.zoom;
    const imageWidth = cropImage.naturalWidth * scale;
    const imageHeight = cropImage.naturalHeight * scale;
    return { width, height, scale, imageWidth, imageHeight,
      left: (width - imageWidth) * cropState.x / 100,
      top: (height - imageHeight) * cropState.y / 100 };
  }
  function drawCrop() {
    if (!cropDialog.open || !cropImage.naturalWidth) return;
    const g = cropGeometry();
    Object.assign(cropImage.style, { width: `${g.imageWidth}px`, height: `${g.imageHeight}px`, left: `${g.left}px`, top: `${g.top}px` });
    cropZoom.value = cropState.zoom;
    cropX.value = cropState.x;
    cropY.value = cropState.y;
    cropX.disabled = g.imageWidth - g.width < 0.5;
    cropY.disabled = g.imageHeight - g.height < 0.5;
    document.querySelector("[data-crop-zoom-value]").textContent = `${Math.round(cropState.zoom * 100)}%`;
  }
  async function openCrop(file, initial = { zoom: 1, x: 50, y: 50 }) {
    const version = ++loadVersion;
    const url = URL.createObjectURL(file);
    photoMessage.textContent = "사진을 준비하고 있습니다.";
    restoreFileInput();
    try {
      const decoded = new Image();
      decoded.src = url;
      await decoded.decode();
      if (version !== loadVersion) { URL.revokeObjectURL(url); return; }
      draftFile = file;
      draftUrl = url;
      cropState = { ...initial };
      cropImage.src = url;
      await cropImage.decode();
      photoMessage.textContent = "";
      cropMessage.textContent = "";
      cropDialog.showModal();
      drawCrop();
    } catch {
      URL.revokeObjectURL(url);
      if (version !== loadVersion) return;
      draftUrl = "";
      draftFile = null;
      photoError("사진을 읽을 수 없습니다. 다른 사진을 선택해주세요.");
    }
  }
  function cancelCrop() {
    if (!savingCrop) cropDialog.close();
  }
  document.querySelectorAll("[data-crop-cancel]").forEach((button) => button.addEventListener("click", cancelCrop));
  cropDialog.addEventListener("cancel", (event) => { if (savingCrop) event.preventDefault(); });
  cropDialog.addEventListener("close", () => {
    if (draftUrl) URL.revokeObjectURL(draftUrl);
    draftUrl = "";
    draftFile = null;
    drag = null;
    cropImage.removeAttribute("src");
    restoreFileInput();
    photo.setCustomValidity("");
    photoMessage.textContent = originalFile ? "" : "사진 선택 후 구도를 적용해주세요.";
  });
  photo.addEventListener("change", () => {
    const file = photo.files[0];
    ++loadVersion;
    photo.setCustomValidity("");
    photoMessage.textContent = "";
    if (!file) { clearPreview(); return; }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      photoError("JPG, PNG 또는 WEBP 사진을 선택해주세요.");
      return;
    }
    void openCrop(file);
  });
  document.querySelector("[data-edit-photo]").addEventListener("click", () => {
    if (originalFile) void openCrop(originalFile, savedCrop);
  });
  [cropZoom, cropX, cropY].forEach((input) => input.addEventListener("input", () => {
    cropState = { zoom: Number(cropZoom.value), x: Number(cropX.value), y: Number(cropY.value) };
    drawCrop();
  }));
  document.querySelector("[data-crop-reset]").addEventListener("click", () => {
    cropState = { zoom: 1, x: 50, y: 50 };
    drawCrop();
  });
  const clamp = (value) => Math.max(0, Math.min(100, value));
  cropViewport.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || savingCrop || drag) return;
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
    cropViewport.setPointerCapture(event.pointerId);
  });
  cropViewport.addEventListener("pointermove", (event) => {
    if (!drag || drag.id !== event.pointerId) return;
    const g = cropGeometry();
    if (g.imageWidth - g.width > 0.5) cropState.x = clamp(cropState.x - (event.clientX - drag.x) / (g.imageWidth - g.width) * 100);
    if (g.imageHeight - g.height > 0.5) cropState.y = clamp(cropState.y - (event.clientY - drag.y) / (g.imageHeight - g.height) * 100);
    drag.x = event.clientX;
    drag.y = event.clientY;
    drawCrop();
  });
  cropViewport.addEventListener("lostpointercapture", () => { drag = null; });
  ["pointerup", "pointercancel"].forEach((type) => cropViewport.addEventListener(type, (event) => {
    if (cropViewport.hasPointerCapture(event.pointerId)) cropViewport.releasePointerCapture(event.pointerId);
    drag = null;
  }));
  new ResizeObserver(drawCrop).observe(cropViewport);
  cropSave.addEventListener("click", async () => {
    if (savingCrop || !draftFile) return;
    savingCrop = true;
    cropSave.disabled = true;
    cropMessage.textContent = "";
    try {
      const g = cropGeometry();
      const canvas = document.createElement("canvas");
      canvas.width = 1780;
      canvas.height = 1090;
      const context = canvas.getContext("2d");
      context.fillStyle = "#faf8f2";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(cropImage, -g.left / g.scale, -g.top / g.scale, g.width / g.scale, g.height / g.scale, 0, 0, canvas.width, canvas.height);
      // Capture the current state before the asynchronous encoding step.
      const appliedState = { ...cropState };
      const appliedOriginal = draftFile;
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
      if (!blob) throw new Error("Image encoding failed");
      const result = new File([blob], `${appliedOriginal.name.replace(/\.[^.]+$/, "")}-profile.jpg`, { type: "image/jpeg" });
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      originalFile = appliedOriginal;
      croppedFile = result;
      savedCrop = appliedState;
      previewUrl = URL.createObjectURL(result);
      previewImage.src = previewUrl;
      preview.hidden = false;
      form.querySelector("[data-photo-name]").textContent = originalFile.name;
      form.querySelector("[data-upload-label]").textContent = "사진 변경하기";
      clearError(photo);
      updateMemberPreview();
      cropDialog.close();
    } catch {
      cropMessage.textContent = "구도를 적용하지 못했습니다. 다시 시도해주세요.";
    } finally {
      savingCrop = false;
      cropSave.disabled = false;
    }
  });

  const consentState = form.querySelector("[data-consent-state]");
  function updateConsentState() {
    const excluded = [];
    if (!form.elements.privacy_optional_contact.checked &&
        (form.elements.instagram.value.trim() || form.elements.kakao_id.value.trim())) excluded.push("추가 연락수단");
    if (!form.elements.sensitive_religion_consent.checked && form.elements.religion.value) excluded.push("종교");
    consentState.textContent = excluded.length
      ? `${excluded.join(" · ")} 정보는 선택 동의 전까지 제출 대상에서 제외됩니다.`
      : "";
  }
  // Any future FormData submission must omit optional data without its separate consent.
  form.addEventListener("formdata", (event) => {
    if (croppedFile) event.formData.set("profile_photo", croppedFile);
    if (!form.elements.privacy_optional_contact.checked) {
      event.formData.delete("instagram");
      event.formData.delete("kakao_id");
    }
    if (!form.elements.sensitive_religion_consent.checked) event.formData.delete("religion");
  });
  // TODO: 실제 전송 연결 시 서버에서도 필수 동의와 선택정보 제외를 검증하고 동의 문서 버전·시각을 기록한다.
  // TODO: 실서비스 Match Proposal 단계에서 개인정보 제3자 제공 동의 UI 구현.
  updateConsentState();

  const status = form.querySelector("[data-form-status]");
  function clearError(field) {
    field.removeAttribute("aria-invalid");
    const errorId = `${field.id}-error`;
    document.getElementById(errorId)?.remove();
    const describedBy = (field.getAttribute("aria-describedby") || "").split(" ").filter((id) => id && id !== errorId);
    if (describedBy.length) field.setAttribute("aria-describedby", describedBy.join(" "));
    else field.removeAttribute("aria-describedby");
  }
  function showError(field, message) {
    clearError(field);
    field.setAttribute("aria-invalid", "true");
    const error = document.createElement("div");
    error.className = "field-error";
    error.id = `${field.id}-error`;
    error.textContent = message;
    const parent = field.closest(".field, .consent-item");
    parent.append(error);
    field.setAttribute("aria-describedby", [field.getAttribute("aria-describedby"), error.id].filter(Boolean).join(" "));
    status.className = "form-status is-error";
    status.textContent = "필수 항목과 입력 내용을 확인해주세요.";
    field.focus();
    (field.closest(".choice-field") || (field === photo ? field.closest(".photo-upload-control") : field)).scrollIntoView({ block: "center", behavior: "auto" });
  }
  function onEdit(event) {
    if (!event.target.matches("input, select, textarea")) return;
    clearError(event.target);
    if (event.target.type === "radio") {
      form.querySelectorAll('input[type="radio"]').forEach((option) => {
        if (option.name === event.target.name) clearError(option);
      });
    }
    if (event.target !== photo) event.target.setCustomValidity("");
    status.textContent = "";
    status.className = "form-status";
    updateConsentState();
    updateMemberPreview();
  }
  form.addEventListener("input", onEdit);
  form.addEventListener("change", onEdit);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    form.querySelectorAll('[aria-invalid="true"]').forEach(clearError);
    const phone = form.elements.phone;
    const digits = phone.value.replace(/[\s-]/g, "");
    phone.setCustomValidity(phone.value && !/^0\d{8,10}$/.test(digits) ? "전화번호를 확인해주세요. 예: 010-0000-0000" : "");
    const minimumAge = form.elements.preferred_age_min;
    const maximumAge = form.elements.preferred_age_max;
    minimumAge.setCustomValidity(minimumAge.value && maximumAge.value && Number(minimumAge.value) > Number(maximumAge.value)
      ? "희망 최소 나이는 최대 나이보다 클 수 없습니다." : "");
    form.querySelectorAll('input[type="text"][required], textarea[required]').forEach((field) => {
      field.setCustomValidity(field.value.trim() ? "" : "이 항목을 입력해주세요.");
    });

    if (!form.checkValidity()) {
      const invalid = Array.from(form.elements).find((field) => field.willValidate && !field.validity.valid);
      if (invalid) {
        const message = invalid.name === "privacy_required" ? "필수 개인정보 수집 및 이용에 동의해주세요."
          : invalid.validity.valueMissing ? "이 항목을 입력 또는 선택해주세요." : invalid.validationMessage;
        showError(invalid, message);
      }
      return;
    }

    // Prototype only: no request, localStorage, or personal-data logging.
    status.className = "form-status is-success";
    status.textContent = "입력 확인이 완료되었습니다. 현재는 프로토타입이며 신청 정보가 전송·저장되지 않았습니다.";
    status.focus();
  });
})();
