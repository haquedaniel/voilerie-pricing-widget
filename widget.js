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

let lastQuote = null;

const leadBtn = document.getElementById("leadBtn");
const leadResult = document.getElementById("leadResult");

const params = new URLSearchParams(window.location.search);
const initialPropertyId = params.get("property_id");

const propertySelect = document.getElementById("propertyId");

if (initialPropertyId && propertySelect) {
  propertySelect.value = initialPropertyId;

  // Optional: hide selector when the page is for a fixed apartment
  propertySelect.closest("label").style.display = "none";
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
    const accommodationOnly =
      data.total_price - (data.cleaning_fee || 0);

    const taxeDeSejourPerNight = Math.min(
      accommodationOnly * 0.05 / data.nights / data.guests,
      5.05
    );

    const taxeDeSejour =
      taxeDeSejourPerNight * data.nights * data.guests;

    const estimatedTotal =
      data.total_price + taxeDeSejour;

    result.className = "result success";
    result.innerHTML = `
      <div class="quote-card">
        <div class="quote-kicker">Bonne nouvelle</div>

        <div class="quote-title">
          Ce séjour est disponible
        </div>

        <div class="quote-price">
          ${formatEuro(estimatedTotal)}
        </div>

        <div class="quote-details">
          ${data.nights} nuits pour ${data.guests} voyageur${Number(data.guests) > 1 ? "s" : ""}
        </div>

        <div class="quote-breakdown">
          <div>
            Hébergement
            <strong>${formatEuro(accommodationOnly)}</strong>
          </div>

          ${
            data.cleaning_fee
              ? `
          <div>
            Forfait ménage
            <strong>${formatEuro(data.cleaning_fee)}</strong>
          </div>
          `
              : ""
          }

          <div>
            Taxe de séjour estimée
            <strong>${formatEuro(taxeDeSejour)}</strong>
          </div>
        </div>

        <div class="quote-next">
          Complétez le formulaire ci-dessous pour recevoir une confirmation personnalisée.
        </div>
      </div>
    `;
    leadForm.classList.remove("hidden");

    lastQuote = {
      property_id: data.property_id,
      check_in: data.check_in,
      check_out: data.check_out,
      nights: data.nights,
      guests: data.guests,
      currency: data.currency,
      accommodation_total: accommodationOnly,
      cleaning_fee: data.cleaning_fee || 0,
      taxe_de_sejour: taxeDeSejour,
      quoted_total: estimatedTotal,
    };
  } catch (err) {
    result.className = "result error";
    result.textContent = `Erreur : ${err.message}`;
  }
});

leadBtn.addEventListener("click", async () => {
  leadResult.textContent = "";

  const gdprConsent = document.getElementById("gdprConsent").checked;

  if (!gdprConsent) {
    leadResult.textContent = "Merci d’accepter l’utilisation de vos données pour envoyer la demande.";
    return;
  }

  if (!lastQuote) {
    leadResult.textContent = "Merci de vérifier les disponibilités avant d’envoyer une demande.";
    return;
  }

  const payload = {
    ...lastQuote,
    name: document.getElementById("leadName").value.trim(),
    email: document.getElementById("leadEmail").value.trim(),
    phone: document.getElementById("leadPhone").value.trim(),
    message: document.getElementById("leadMessage").value.trim(),
    gdpr_consent: gdprConsent,
    source_url: window.location.href,
  };

  if (!payload.name || !payload.email) {
    leadResult.textContent = "Merci d’indiquer votre nom et votre email.";
    return;
  }

  leadBtn.disabled = true;
  leadBtn.textContent = "Envoi en cours...";

  try {
    const response = await fetch("https://api.leclosdelavoilerie.com/lead", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!data.ok) {
      throw new Error(data.error || "Erreur inconnue");
    }

    leadResult.className = "result success";
    leadResult.innerHTML = `
      <strong>Merci, votre demande a bien été envoyée.</strong><br>
      Nous revenons vers vous rapidement avec une confirmation et les prochaines étapes.<br>
      <small>Les dates ne sont pas bloquées automatiquement tant que la réservation n’est pas confirmée.</small>
    `;

    leadBtn.textContent = "Demande envoyée";
  } catch (err) {
    leadBtn.disabled = false;
    leadBtn.textContent = "Envoyer la demande";
    leadResult.className = "result error";
    leadResult.textContent = `Erreur : ${err.message}`;
  }
});