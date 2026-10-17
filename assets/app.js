// SAFEHER - Page d'accueil en MODE DÉMONSTRATION
// Aucun appel serveur : le compteur est fixe et le formulaire est simulé.

const DEMO_TOTAL = 120;
let total = DEMO_TOTAL;

const form = document.querySelector("#signup-form");
const message = document.querySelector("#message");
const submitBtn = document.querySelector("#submit-btn");

function showMessage(text, kind = "error") {
  message.textContent = text;
  message.className = `alert ${kind}`;
}
function showTotal() {
  document.querySelector("#total").textContent = total;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  submitBtn.disabled = true;
  submitBtn.textContent = "Envoi en cours…";
  await new Promise(r => setTimeout(r, 700)); // simulation d'envoi
  form.reset();
  total += 1;
  showTotal();
  showMessage("Merci ! Votre inscription a bien été enregistrée.", "success");
  submitBtn.disabled = false;
  submitBtn.innerHTML = 'Envoyer mon inscription <span>→</span>';
});

showTotal();
document.querySelector("#footer-status").textContent = "Version de démonstration";