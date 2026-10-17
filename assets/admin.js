// SAFEHER - Tableau de bord admin en MODE DÉMONSTRATION
// Données fictives uniquement. Aucune connexion, aucun appel serveur.

const DEMO_COUNT = 120;   // minimum 120 inscriptions
const PAGE_SIZE = 20;     // 20 lignes par page

const CITIES = {
  "Extrême-Nord": ["Maroua", "Kousséri", "Mokolo", "Yagoua", "Kaélé", "Mora"],
  "Nord": ["Garoua", "Guider", "Poli", "Figuil", "Tcholliré"],
  "Adamaoua": ["Ngaoundéré", "Meiganga", "Tibati", "Banyo"],
  "Littoral": ["Douala", "Nkongsamba", "Édéa"],
  "Centre": ["Yaoundé", "Mbalmayo", "Obala"],
  "Est": ["Bertoua", "Batouri", "Abong-Mbang"]
};
const REGION_WEIGHTS = [
  ["Extrême-Nord", 36], ["Nord", 26], ["Adamaoua", 16],
  ["Littoral", 10], ["Centre", 8], ["Est", 4]
];
const PROFILES = [
  ["Personne intéressée", 55], ["Témoin / proche", 22],
  ["Professionnel(le) / association", 15], ["Autre", 8]
];

// Noms réalistes par zone (combinaison prénom + nom, toujours unique)
const NAMES_NORTH = {
  first: ["Amina", "Fatou", "Aïcha", "Hawa", "Rakiatou", "Mariam", "Djamila", "Zeinabou",
    "Salamatou", "Aminatou", "Hadjara", "Safiétou", "Halima", "Ramatou", "Bintou", "Kadidja",
    "Hadidja", "Mairamou", "Asta", "Hamsatou", "Fadimatou", "Naïmatou", "Rabi", "Pauline",
    "Esther", "Léa", "Sarah", "Lydie", "Djénéba", "Zouleiha"],
  last: ["Abba", "Adamou", "Aliou", "Bouba", "Djibril", "Hamidou", "Ibrahim", "Malloum",
    "Mohamadou", "Saidou", "Souleymanou", "Oumarou", "Bello", "Issa", "Moussa", "Yaya",
    "Mbaïdjol", "Zra", "Dakolé", "Mazra", "Gonondo", "Kaldapa", "Wadjiri", "Hamadjoda"]
};
const NAMES_SOUTH = {
  first: ["Grace", "Marie", "Nadège", "Estelle", "Clarisse", "Joëlle", "Brigitte", "Chantal",
    "Sandrine", "Laure", "Prisca", "Mireille", "Solange", "Carine", "Ruth", "Christelle",
    "Honorine", "Diane", "Larissa", "Viviane", "Pélagie", "Ornella", "Flore", "Yvette"],
  last: ["Mballa", "Ngono", "Atangana", "Essomba", "Mbarga", "Nkoulou", "Ekobo", "Nguemo",
    "Fotso", "Kamga", "Biyong", "Onana", "Ewane", "Mbonjo", "Eboa", "Manga", "Ndongo",
    "Bekolo", "Abega", "Mvondo", "Etoundi", "Owona", "Bilong", "Nkodo"]
};
const NORTH_REGIONS = new Set(["Extrême-Nord", "Nord", "Adamaoua"]);

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

const usedNames = new Set();
function uniqueName(region) {
  const pool = NORTH_REGIONS.has(region) ? NAMES_NORTH : NAMES_SOUTH;
  for (let i = 0; i < 1000; i++) {
    const name = `${pick(pool.first)} ${pick(pool.last)}`;
    if (!usedNames.has(name)) { usedNames.add(name); return name; }
  }
  throw new Error("Pas assez de noms pour garantir l'unicité");
}

function buildDemoData() {
  const step = (END - START) / DEMO_COUNT;
  const rows = [];
  for (let i = 0; i < DEMO_COUNT; i++) {
    const region = pickWeighted(REGION_WEIGHTS);
    const hasPhone = rand() < 0.55;
    const ts = new Date(START + i * step + Math.floor(rand() * step * 0.8));
    rows.push({
      id: i + 1,
      first_name: uniqueName(region),
      region,
      city: pick(CITIES[region]),
      profile: pickWeighted(PROFILES),
      phone: hasPhone ? `+237 600 ${pad2(Math.floor(rand() * 100))} ${pad2(Math.floor(rand() * 100))}` : "",
      wants_followup: rand() < 0.6,
      created_at: ts.toISOString().slice(0, 16).replace("T", " "),
      _ts: ts.getTime()
    });
  }
  return rows.reverse(); // plus récentes en premier
}

const $ = (s) => document.querySelector(s);
const registrations = buildDemoData();
let currentPage = 1;

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

// ----- Barre de pagination (créée par le script sous le tableau) -----
const pager = document.createElement("div");
pager.style.cssText = "display:flex;align-items:center;justify-content:center;gap:14px;margin:16px 0;flex-wrap:wrap";
pager.innerHTML = `
  <button id="prev-page" class="secondary" type="button" style="width:auto;margin:0">← Précédent</button>
  <span id="page-info" class="small-note" style="margin:0"></span>
  <button id="next-page" type="button" style="width:auto;margin:0">Suivant →</button>`;
document.querySelector(".table-wrap").insertAdjacentElement("afterend", pager);

function filteredRows() {
  const q = $("#search").value.trim().toLocaleLowerCase("fr");
  return registrations.filter(r =>
    [r.first_name, r.region, r.city, r.profile, r.phone].join(" ").toLocaleLowerCase("fr").includes(q)
  );
}

function drawRows() {
  const rows = filteredRows();
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  if (currentPage > pages) currentPage = pages;
  const startIdx = (currentPage - 1) * PAGE_SIZE;
  const pageRows = rows.slice(startIdx, startIdx + PAGE_SIZE);

  $("#registrations").innerHTML = pageRows.length
    ? pageRows.map(r => `<tr>
        <td>${escapeHTML(r.id)}</td><td>${escapeHTML(r.first_name)}</td><td>${escapeHTML(r.region)}</td>
        <td>${escapeHTML(r.city)}</td><td>${escapeHTML(r.profile)}</td><td>${escapeHTML(r.phone || "—")}</td>
        <td>${r.wants_followup ? "Oui" : "Non"}</td><td>${escapeHTML(r.created_at)}</td></tr>`).join("")
    : '<tr><td colspan="8" class="empty">Aucune inscription ne correspond à cette recherche.</td></tr>';

  const from = rows.length ? startIdx + 1 : 0;
  const to = startIdx + pageRows.length;
  $("#result-count").textContent = `Affichage de ${from} à ${to} sur ${rows.length} résultat(s) (${registrations.length} inscriptions au total).`;
  $("#page-info").textContent = `Page ${currentPage} / ${pages}`;
  $("#prev-page").disabled = currentPage <= 1;
  $("#next-page").disabled = currentPage >= pages;
}

function goTo(page) {
  currentPage = page;
  drawRows();
  document.querySelector(".table-wrap").scrollIntoView({ behavior: "smooth", block: "start" });
}

function updateMetrics() {
  $("#metric-total").textContent = registrations.length;
  $("#metric-followup").textContent = registrations.filter(r => r.wants_followup).length;
  $("#metric-phone").textContent = registrations.filter(r => r.phone).length;
}

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

function csvCell(value) {
  let text = value == null ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = "'" + text;
  return '"' + text.replace(/"/g, '""') + '"';
}

function exportCSV() {
  const header = ["id", "nom", "region", "ville", "profil", "telephone", "recontact", "date"];
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

$("#search").addEventListener("input", () => { currentPage = 1; drawRows(); });
$("#prev-page").addEventListener("click", () => goTo(currentPage - 1));
$("#next-page").addEventListener("click", () => goTo(currentPage + 1));
$("#refresh").addEventListener("click", () => {
  drawRows();
  notice.textContent = "Données actualisées (démonstration).";
});
$("#export").addEventListener("click", exportCSV);
$("#logout").addEventListener("click", () => { window.location.href = "/"; });