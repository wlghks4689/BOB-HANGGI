// Public configuration only. For static hosting set this to the deployed
// https://<project-ref>.supabase.co/functions/v1/submit-application URL.
// Keep every secret out of this file.
const daeseLocalHost = ["localhost", "127.0.0.1"].includes(window.location.hostname);
window.DaeseBackend = Object.freeze({
  endpoint: daeseLocalHost
    ? "/api/applications"
    : "https://mfezbzrseuikeltzdtwe.supabase.co/functions/v1/submit-application",
  adminEndpoint: daeseLocalHost
    ? "/api/admin"
    : "https://mfezbzrseuikeltzdtwe.supabase.co/functions/v1/admin-applications",
});
