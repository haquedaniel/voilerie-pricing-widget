const API_BASE = "https://api.leclosdelavoilerie.com";

const quoteBtn = document.getElementById("quoteBtn");
const result = document.getElementById("result");
const leadForm = document.getElementById("leadForm");

function formatEuro(value) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

quoteBtn.addEventListener("click", async () => {
  result.className = "result";
  result.textContent = "Recherche en cours...";

  const propertyId = document.getElementById("propertyId").value;
  const checkIn = document.getElementById("checkIn").value;
  const checkOut = document.getElementById("checkOut").value;
  const guests = document.getElementById("guests").value;

  const url =
    `${API_BASE}/quote?property_id=${encodeURIComponent(propertyId)}` +
    `&check_in=${encodeURIComponent(checkIn)}` +
    `&check_out=${encodeURIComponent(checkOut)}` +
    `&guests=${encodeURIComponent(guests)}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!data.ok) {
      throw new Error(data.error || "Erreur inconnue");
    }

    if (!data.available) {
      result.className = "result error";
      leadForm.classList.add("hidden");
      if (data.reason === "occupied") {
        result.textContent = "Désolé, ces dates ne sont pas disponibles.";
      } else if (data.reason === "min_stay_not_met") {
        result.textContent = `Séjour minimum : ${data.min_nights} nuits.`;
      } else {
        result.textContent = `Désolé, nous ne pouvons pas proposer de tarif pour ces dates. : ${data.reason}`;
      }

      return;
    }

    result.className = "result success";
    result.innerHTML = `
      <strong>Disponible</strong><br>
      ${data.nights} nuits — ${formatEuro(data.total_price)}<br>
      <small>Dont ménage : ${formatEuro(data.cleaning_fee || 0)}</small>
    `;
    leadForm.classList.remove("hidden");
  } catch (err) {
    result.className = "result error";
    result.textContent = `Erreur : ${err.message}`;
  }
});