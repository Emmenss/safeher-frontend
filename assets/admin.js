// Remplacer par l’URL réelle du backend PythonAnywhere avant le déploiement final.
const API_BASE = "https://judeems.pythonanywhere.com";

const $ = (s) => document.querySelector(s);
const notice = $("#notice");
const loginPanel = $("#login-panel");
const dashboard = $("#dashboard");
const loginForm = $("#login-form");
let registrations = [];

function message(text, kind="error") {
  notice.textContent = text;
  notice.className = `alert ${kind}`;
}
function token() { return sessionStorage.getItem("safeher_admin_token") || ""; }
function clearToken() { sessionStorage.removeItem("safeher_admin_token"); }
function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
function showLoggedIn(yes) {
  loginPanel.classList.toggle("hidden", yes);
  dashboard.classList.toggle("hidden", !yes);
}
async function api(path, options={}) {
  const headers = {...(options.headers || {})};
  if (options.body) headers["Content-Type"] = "application/json";
  if (token()) headers.Authorization = `Bearer ${token()}`;
  const res = await fetch(`${API_BASE}${path}`, {...options, headers});
  const data = res.headers.get("content-type")?.includes("application/json") ? await res.json() : null;
  if (!res.ok) {
    if (res.status === 401) { clearToken(); showLoggedIn(false); }
    throw new Error(data?.error || `Erreur serveur (${res.status})`);
  }
  return {res, data};
}
loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = $("#login-button");
  button.disabled = true;
  const fd = new FormData(loginForm);
  try {
    const {data} = await api("/api/admin/login", {method:"POST", body:JSON.stringify({username:fd.get("username"), password:fd.get("password")})});
    sessionStorage.setItem("safeher_admin_token", data.token);
    loginForm.reset();
    showLoggedIn(true);
    message("Connexion réussie.", "success");
    await loadRegistrations();
  } catch (e) { message(e.message); }
  finally { button.disabled = false; }
});
function drawRows() {
  const q = $("#search").value.trim().toLocaleLowerCase("fr");
  const rows = registrations.filter(r => [r.first_name,r.region,r.city,r.profile,r.phone].join(" ").toLocaleLowerCase("fr").includes(q));
  $("#registrations").innerHTML = rows.length ? rows.map(r => `<tr>
    <td>${escapeHTML(r.id)}</td><td>${escapeHTML(r.first_name)}</td><td>${escapeHTML(r.region)}</td><td>${escapeHTML(r.city)}</td>
    <td>${escapeHTML(r.profile)}</td><td>${escapeHTML(r.phone || "—")}</td><td>${r.wants_followup ? "Oui" : "Non"}</td><td>${escapeHTML(r.created_at)}</td></tr>`).join("") : '<tr><td colspan="8" class="empty">Aucune inscription ne correspond à cette recherche.</td></tr>';
  $("#result-count").textContent = `${rows.length} résultat(s) affiché(s) sur ${registrations.length} inscription(s).`;
}
async function loadRegistrations() {
  try {
    const {data} = await api("/api/admin/registrations");
    registrations = data.registrations || [];
    $("#metric-total").textContent = data.total ?? registrations.length;
    $("#metric-followup").textContent = registrations.filter(r => r.wants_followup).length;
    $("#metric-phone").textContent = registrations.filter(r => r.phone).length;
    drawRows();
    message("Données actualisées.", "success");
  } catch(e) { message(e.message); }
}
$("#search").addEventListener("input", drawRows);
$("#refresh").addEventListener("click", loadRegistrations);
$("#logout").addEventListener("click", () => {
  clearToken(); registrations = []; showLoggedIn(false);
  $("#registrations").innerHTML = ""; message("Vous êtes déconnecté·e.", "success");
});
$("#export").addEventListener("click", async () => {
  try {
    const {res} = await api("/api/admin/export.csv");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "safeher-inscriptions.csv"; a.click();
    URL.revokeObjectURL(url);
  } catch(e) { message(e.message); }
});
if (token()) { showLoggedIn(true); loadRegistrations(); } else { showLoggedIn(false); }
