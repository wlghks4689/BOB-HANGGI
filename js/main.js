(function () {
  "use strict";

  const currentYear = new Date().getFullYear();
  document.querySelectorAll("[data-current-year]").forEach((element) => {
    element.textContent = String(currentYear);
  });

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
    window.addEventListener("resize", () => {
      if (window.innerWidth >= 768) closeMenu();
    });
  }

  const proposalMessage = document.querySelector("[data-proposal-message]");
  document.querySelectorAll("[data-proposal-answer]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!proposalMessage) return;
      const accepted = button.dataset.proposalAnswer === "accept";
      proposalMessage.textContent = accepted
        ? "선택이 전달되었습니다. 상대도 수락하면 운영자가 다음 절차를 안내합니다."
        : "선택이 전달되었습니다. 상대에게는 거절 여부나 사유가 공개되지 않습니다.";
    });
  });

  const birthYearSelect = document.querySelector("[data-birth-year]");
  if (birthYearSelect) {
    for (let age = 20; age <= 49; age += 1) {
      const year = currentYear - age;
      birthYearSelect.add(new Option(`${year}년`, String(year)));
    }
  }

  const heightSelect = document.querySelector("[data-height]");
  if (heightSelect) {
    for (let height = 145; height <= 200; height += 1) {
      heightSelect.add(new Option(`${height}cm`, String(height)));
    }
  }

  document.querySelectorAll("[data-age-select]").forEach((select) => {
    for (let age = 20; age <= 49; age += 1) {
      select.add(new Option(`${age}세`, String(age)));
    }
  });

  const photoInput = document.querySelector("[data-photo-input]");
  const photoPreview = document.querySelector("[data-photo-preview]");
  const photoName = document.querySelector("[data-photo-name]");
  const photoMessage = document.querySelector("[data-photo-message]");
  let previewUrl = "";

  if (photoInput && photoPreview && photoName && photoMessage) {
    photoInput.addEventListener("change", () => {
      const file = photoInput.files && photoInput.files[0];
      photoMessage.textContent = "";

      if (!file) {
        photoPreview.hidden = true;
        return;
      }

      if (!file.type.startsWith("image/")) {
        photoInput.value = "";
        photoPreview.hidden = true;
        photoMessage.textContent = "이미지 파일만 선택할 수 있습니다.";
        return;
      }

      if (previewUrl) URL.revokeObjectURL(previewUrl);
      previewUrl = URL.createObjectURL(file);
      photoPreview.querySelector("img").src = previewUrl;
      photoName.textContent = file.name;
      photoPreview.hidden = false;
    });
  }

  const longDistance = document.querySelector("[data-long-distance]");
  const longDistanceField = document.querySelector("[data-long-distance-field]");
  const longDistanceRange = document.querySelector("#long_distance_range");

  function updateLongDistanceField() {
    if (!longDistance || !longDistanceField || !longDistanceRange) return;
    const enabled = longDistance.value === "yes";
    longDistanceField.hidden = !enabled;
    longDistanceRange.disabled = !enabled;
    longDistanceRange.required = enabled;
    if (!enabled) longDistanceRange.value = "";
  }

  if (longDistance) {
    longDistance.addEventListener("change", updateLongDistanceField);
    updateLongDistanceField();
  }

  const form = document.querySelector("[data-membership-form]");
  const formStatus = document.querySelector("[data-form-status]");

  if (form && formStatus) {
    form.addEventListener("input", (event) => {
      const field = event.target;
      if (field.matches("input, select, textarea")) field.removeAttribute("aria-invalid");
    });

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
        formStatus.classList.add("is-error");
        formStatus.focus();
        return;
      }

      if (!form.checkValidity()) {
        const firstInvalid = form.querySelector(":invalid");
        if (firstInvalid) {
          firstInvalid.setAttribute("aria-invalid", "true");
          firstInvalid.focus();
        }
        formStatus.textContent = "입력하지 않은 필수 항목을 확인해주세요.";
        formStatus.classList.add("is-error");
        formStatus.focus();
        return;
      }

      formStatus.textContent = "프로토타입 신청이 완료되었습니다. 실제 정보는 전송되지 않았습니다.";
      formStatus.classList.add("is-success");
      formStatus.focus();
    });
  }
})();
