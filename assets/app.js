// Remplace cette URL par l'adresse de ton API PythonAnywhere après déploiement.
const API_BASE = "https://judeems.pythonanywhere.com";
const form = document.querySelector("#signup-form");
const message = document.querySelector("#message");
const submitBtn = document.querySelector("#submit-btn");

function showMessage(text, kind = "error") {
  message.textContent = text;
  message.className = `alert ${kind}`;
}
async function loadStats() {
  try {
    const res = await fetch(`${API_BASE}/api/stats`);
    if (!res.ok) throw new Error("API indisponible");
    const data = await res.json();
    document.querySelector("#total").textContent = data.total;
    document.querySelector("#footer-status").textContent = "Serveur connecté";
  } catch {
    document.querySelector("#total").textContent = "—";
    document.querySelector("#footer-status").textContent = "Compteur indisponible pour le moment";
  }
}
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  submitBtn.disabled = true;
  submitBtn.textContent = "Envoi en cours…";
  const f = new FormData(form);
  const payload = {
    first_name: f.get("first_name").trim(),
    region: f.get("region"),
    city: f.get("city").trim(),
    profile: f.get("profile"),
    phone: f.get("phone").trim(),
    wants_followup: f.get("wants_followup") === "yes",
    consent: f.get("consent") === "yes",
    website: f.get("website").trim()
  };
  try {
    const res = await fetch(`${API_BASE}/api/register`, {
      method: "POST", headers: {"Content-Type": "application/json"},
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "L’inscription n’a pas pu être enregistrée.");
    form.reset();
    showMessage("Merci ! Votre inscription a bien été enregistrée.", "success");
    await loadStats();
  } catch (err) {
    showMessage(`${err.message} Vérifiez la connexion puis réessayez.`);
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = 'Envoyer mon inscription <span>→</span>';
  }
});
loadStats();