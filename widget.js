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
        result.innerHTML = `
          <div class="quote-card">
            <div class="quote-kicker">Presque</div>
            <div class="quote-title">Ces dates ne sont pas disponibles</div>
            <div class="quote-details">
              Essayez d'autres dates ou contactez-nous pour que nous vous proposions une alternative.
            </div>
          </div>
        `;
      } else if (data.reason === "min_stay_not_met") {
        result.innerHTML = `
          <div class="quote-card">
            <div class="quote-kicker">Séjour minimum</div>
            <div class="quote-title">${data.min_nights} nuits minimum pour ces dates</div>
            <div class="quote-details">
              Modifiez vos dates pour voir le tarif disponible.
            </div>
          </div>
`;
      } else {
        result.textContent = `Désolé, nous ne pouvons pas proposer de tarif pour ces dates. : ${data.reason}`;
      }

      return;
    }

    result.className = "result success";
    result.innerHTML = `
      <div class="quote-card">
        <div class="quote-kicker">Bonne nouvelle</div>
        <div class="quote-title">Ce séjour est disponible</div>

        <div class="quote-price">
          ${formatEuro(data.total_price)}
        </div>

        <div class="quote-details">
          ${data.nights} nuits pour ${data.guests} voyageur${Number(data.guests) > 1 ? "s" : ""}
          ${data.cleaning_fee ? `<br>dont forfait ménage : ${formatEuro(data.cleaning_fee)}` : ""}
        </div>

        <div class="quote-next">
          Complétez le formulaire ci-dessous pour recevoir une confirmation personnalisée.
        </div>
      </div>
    `;

    leadForm.classList.remove("hidden");
  } catch (err) {
    result.className = "result error";
    result.textContent = `Erreur : ${err.message}`;
  }
});