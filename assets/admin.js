// SAFEHER - Tableau de bord admin en MODE DÉMONSTRATION
// Données fictives uniquement. Aucune connexion, aucun appel serveur.

const DEMO_COUNT = 120;

const CITIES = {
  "Adamaoua": ["Ngaoundéré", "Meiganga", "Tibati"],
  "Centre": ["Yaoundé", "Mbalmayo", "Obala", "Bafia"],
  "Est": ["Bertoua", "Batouri", "Abong-Mbang"],
  "Extrême-Nord": ["Maroua", "Kousséri", "Mokolo", "Yagoua"],
  "Littoral": ["Douala", "Nkongsamba", "Édéa", "Loum"],
  "Nord": ["Garoua", "Guider", "Poli"],
  "Nord-Ouest": ["Bamenda", "Kumbo", "Wum"],
  "Ouest": ["Bafoussam", "Dschang", "Foumban", "Mbouda"],
  "Sud": ["Ebolowa", "Kribi", "Sangmélima"],
  "Sud-Ouest": ["Buea", "Limbe", "Kumba", "Mamfe"]
};
const REGION_WEIGHTS = [
  ["Littoral", 20], ["Centre", 20], ["Extrême-Nord", 14], ["Ouest", 12], ["Nord-Ouest", 9],
  ["Sud-Ouest", 9], ["Nord", 6], ["Adamaoua", 4], ["Est", 3], ["Sud", 3]
];
const PROFILES = [
  ["Personne intéressée", 55], ["Témoin / proche", 22],
  ["Professionnel(le) / association", 15], ["Autre", 8]
];
const NAMES = ["Amina", "Grace", "Fatou", "Marie", "Nadège", "Aïcha", "Estelle", "Clarisse", "Joëlle",
  "Brigitte", "Chantal", "Sandrine", "Laure", "Prisca", "Mireille", "Hawa", "Rakiatou", "Solange",
  "Carine", "Ghislaine", "Danielle", "Flore", "Yvette", "Armelle", "Nicole", "Rose", "Pélagie",
  "Esther", "Judith", "Larissa", "Ornella", "Syntiche", "Bernadette", "Mariam", "Viviane",
  "Alice", "Christelle", "Honorine", "Diane", "Ruth"];
const PSEUDOS = ["Pseudo_K", "Anonyme_237", "Lumière", "Étoile", "Colibri", "Papillon", "Soleil_D",
  "Amie_X", "Discrète", "Espoir"];

const START = Date.UTC(2026, 8, 15, 7, 0);   // 15 sept. 2026
const END = Date.UTC(2026, 9, 17, 20, 0);    // 17 oct. 2026
const WEEK = 7 * 24 * 3600 * 1000;

function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(2026);

function pickWeighted(list) {
  const total = list.reduce((s, x) => s + x[1], 0);
  let r = rand() * total;
  for (const [value, weight] of list) { r -= weight; if (r < 0) return value; }
  return list[0][0];
}
function pick(list) { return list[Math.floor(rand() * list.length)]; }
const pad2 = (n) => String(n).padStart(2, "0");

function buildDemoData() {
  const step = (END - START) / DEMO_COUNT;
  const rows = [];
  for (let i = 0; i < DEMO_COUNT; i++) {
    const region = pickWeighted(REGION_WEIGHTS);
    const name = rand() < 0.12 ? pick(PSEUDOS) : pick(NAMES);
    const hasPhone = rand() < 0.55;
    const ts = new Date(START + i * step + Math.floor(rand() * step * 0.8));
    rows.push({
      id: i + 1,
      first_name: name,
      region,
      city: pick(CITIES[region]),
      profile: pickWeighted(PROFILES),
      phone: hasPhone ? `+237 600 ${pad2(Math.floor(rand() * 100))} ${pad2(Math.floor(rand() * 100))}` : "",
      wants_followup: rand() < 0.6,
      created_at: ts.toISOString().slice(0, 16).replace("T", " "),
      _ts: ts.getTime()
    });
  }
  return rows.reverse();
}

const $ = (s) => document.querySelector(s);
const registrations = buildDemoData();

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

function drawRows() {
  const q = $("#search").value.trim().toLocaleLowerCase("fr");
  const rows = registrations.filter(r =>
    [r.first_name, r.region, r.city, r.profile, r.phone].join(" ").toLocaleLowerCase("fr").includes(q)
  );
  $("#registrations").innerHTML = rows.length
    ? rows.map(r => `<tr>
        <td>${escapeHTML(r.id)}</td><td>${escapeHTML(r.first_name)}</td><td>${escapeHTML(r.region)}</td>
        <td>${escapeHTML(r.city)}</td><td>${escapeHTML(r.profile)}</td><td>${escapeHTML(r.phone || "—")}</td>
        <td>${r.wants_followup ? "Oui" : "Non"}</td><td>${escapeHTML(r.created_at)}</td></tr>`).join("")
    : '<tr><td colspan="8" class="empty">Aucune inscription ne correspond à cette recherche.</td></tr>';
  $("#result-count").textContent = `${rows.length} résultat(s) affiché(s) sur ${registrations.length} inscription(s).`;
}

function updateMetrics() {
  $("#metric-total").textContent = registrations.length;
  $("#metric-followup").textContent = registrations.filter(r => r.wants_followup).length;
  $("#metric-phone").textContent = registrations.filter(r => r.phone).length;
}

// ----- Graphiques en barres (CSS pur, sans bibliothèque) -----
function countBy(keyFn) {
  const map = new Map();
  registrations.forEach(r => { const k = keyFn(r); map.set(k, (map.get(k) || 0) + 1); });
  return [...map.entries()];
}

function renderBars(containerId, entries) {
  const max = Math.max(...entries.map(e => e[1]), 1);
  $(containerId).innerHTML = entries.map(([label, n]) => `
    <div style="margin:0 0 11px">
      <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px">
        <span>${escapeHTML(label)}</span><strong style="color:var(--green)">${n}</strong>
      </div>
      <div style="background:var(--mint);border-radius:6px;height:9px;overflow:hidden">
        <div style="width:${Math.round(n / max * 100)}%;height:100%;background:var(--green);border-radius:6px"></div>
      </div>
    </div>`).join("");
}

function renderCharts() {
  renderBars("#chart-region", countBy(r => r.region).sort((a, b) => b[1] - a[1]));
  renderBars("#chart-profile", countBy(r => r.profile).sort((a, b) => b[1] - a[1]));

  const fmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", timeZone: "UTC" });
  const weeks = Math.ceil((END - START) / WEEK);
  const buckets = Array.from({ length: weeks }, (_, i) => [`Sem. du ${fmt.format(new Date(START + i * WEEK))}`, 0]);
  registrations.forEach(r => {
    const i = Math.min(weeks - 1, Math.floor((r._ts - START) / WEEK));
    buckets[i][1]++;
  });
  renderBars("#chart-week", buckets);
}

// ----- Export CSV -----
function csvCell(value) {
  let text = value == null ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = "'" + text;
  return '"' + text.replace(/"/g, '""') + '"';
}

function exportCSV() {
  const header = ["id", "prenom_pseudonyme", "region", "ville", "profil", "telephone", "recontact", "date"];
  const lines = [header.join(",")].concat(registrations.map(r => [
    r.id, r.first_name, r.region, r.city, r.profile, r.phone,
    r.wants_followup ? "oui" : "non", r.created_at
  ].map(csvCell).join(",")));
  const blob = new Blob(["\ufeff" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "safeher-inscriptions-demo.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// ----- Démarrage -----
const notice = $("#notice");
notice.textContent = "Mode démonstration : les données affichées sont fictives.";
notice.className = "alert success";

updateMetrics();
renderCharts();
drawRows();

$("#search").addEventListener("input", drawRows);
$("#refresh").addEventListener("click", () => {
  drawRows();
  notice.textContent = "Données actualisées (démonstration).";
});
$("#export").addEventListener("click", exportCSV);
$("#logout").addEventListener("click", () => { window.location.href = "/"; });