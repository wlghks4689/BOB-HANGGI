(function () {
  "use strict";

  const dialog = document.querySelector("#introduce-dialog");
  const trigger = document.querySelector(".introduce-trigger");
  const closeButton = dialog?.querySelector(".introduce-close");
  if (!dialog || !trigger || !closeButton) return;

  trigger.addEventListener("click", () => dialog.showModal());
  closeButton.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener("close", () => trigger.focus());
})();
