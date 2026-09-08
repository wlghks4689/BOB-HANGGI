(function () {
  "use strict";
  const key = "daese-admin-session";

  function clear() {
    sessionStorage.removeItem(key);
  }

  function save(accessToken, expiresIn) {
    sessionStorage.setItem(key, JSON.stringify({
      accessToken,
      expiresAt: Date.now() + Math.max(1, Number(expiresIn)) * 1000,
    }));
  }

  function load() {
    try {
      const session = JSON.parse(sessionStorage.getItem(key) || "null");
      if (typeof session?.accessToken !== "string" || !session.accessToken || !Number.isFinite(session.expiresAt) || session.expiresAt <= Date.now()) {
        clear(); return null;
      }
      return { accessToken: session.accessToken, expiresIn: Math.ceil((session.expiresAt - Date.now()) / 1000) };
    } catch { clear(); return null; }
  }

  window.DaeseAdminSession = Object.freeze({ clear, save, load });
})();
