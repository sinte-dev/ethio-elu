const card = document.getElementById("confirmCard");

const STATUS_KEYS = {
  new: "status.new",
  contacted: "status.contacted",
  placed: "status.placed",
  rejected: "status.rejected",
};

let lastErrorMessageKey = null;
let lastData = null;

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value === null || value === undefined ? "" : String(value);
  return div.innerHTML;
}

function formatDate(iso) {
  const locale = HW_I18N.getLang() === "am" ? "am-ET" : undefined;
  return new Date(iso).toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" });
}

function statusLabel(status) {
  return HW_I18N.t(STATUS_KEYS[status] || status);
}

function showError(messageKey) {
  lastErrorMessageKey = messageKey;
  lastData = null;
  card.innerHTML = `<p class="confirm-error">${escapeHtml(HW_I18N.t(messageKey))}</p>`;
}

function render() {
  if (lastErrorMessageKey) {
    card.innerHTML = `<p class="confirm-error">${escapeHtml(HW_I18N.t(lastErrorMessageKey))}</p>`;
    return;
  }
  if (!lastData) return;

  const data = lastData;

  if (!data.approved) {
    card.innerHTML = `
      <p class="confirm-kicker">${escapeHtml(HW_I18N.t("confirmPage.receivedKicker"))}</p>
      <div class="confirm-check confirm-check-pending">&#8635;</div>
      <h1 class="confirm-headline">${escapeHtml(HW_I18N.t("confirmPage.underReview"))}</h1>
      <h2 class="confirm-name">${escapeHtml(data.full_name)}</h2>
      <p class="confirm-meta">${escapeHtml(HW_I18N.t("confirmPage.submittedOn"))} ${formatDate(data.created_at)}</p>
      <p class="confirm-disclaimer">${escapeHtml(HW_I18N.t("confirmPage.reviewingNote"))}</p>
    `;
    return;
  }

  card.innerHTML = `
    <p class="confirm-kicker">${escapeHtml(HW_I18N.t("confirmPage.confirmedKicker"))}</p>
    ${data.photo_url
      ? `<img class="confirm-photo" src="${data.photo_url}" alt="">`
      : `<div class="confirm-check">&#10003;</div>`}
    <h1 class="confirm-headline">${escapeHtml(HW_I18N.t("confirmPage.youreRegistered"))}</h1>
    <h2 class="confirm-name">${escapeHtml(data.full_name)}</h2>
    <span class="confirm-status-badge status-${escapeHtml(data.status)}">${escapeHtml(statusLabel(data.status))}</span>
    <p class="confirm-meta">${escapeHtml(HW_I18N.t("confirmPage.registeredOn"))} ${formatDate(data.created_at)}</p>
    <p class="confirm-disclaimer">${escapeHtml(HW_I18N.t("confirmPage.disclaimerConfirmed"))}</p>
    <a class="btn btn-primary confirm-jobs-cta" href="openings.html?token=${encodeURIComponent(new URLSearchParams(location.search).get("token"))}" target="_blank" rel="noopener">${escapeHtml(HW_I18N.t("confirmPage.viewJobsCta"))}</a>
  `;
}

document.addEventListener("hw:langchange", render);

async function loadConfirmation() {
  const token = new URLSearchParams(location.search).get("token");

  if (!token) {
    showError("confirmPage.missingCode");
    return;
  }

  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/get-confirmation?token=${encodeURIComponent(token)}`, {
      headers: { apikey: SUPABASE_ANON_KEY },
    });

    if (res.status === 404) {
      showError("confirmPage.notFound");
      return;
    }
    if (!res.ok) throw new Error("Request failed: " + res.status);

    lastData = await res.json();
    lastErrorMessageKey = null;
    render();
  } catch (err) {
    console.error(err);
    showError("confirmPage.loadError");
  }
}

loadConfirmation();