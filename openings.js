const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

const grid = document.getElementById("openingsGrid");
const statusEl = document.getElementById("openingsStatus");
const openingsGate = document.getElementById("openingsGate");
const openingsGateMessage = document.getElementById("openingsGateMessage");
const openingsContent = document.getElementById("openingsContent");

let allOpenings = [];
const expandedOpeningIds = new Set();
const receiptUploadedIds = new Set(); // openings this session has already uploaded a receipt for
let applicantToken = null; // set once the access-gate token is verified

function render() {
  const filtered = allOpenings;

  if (filtered.length === 0) {
    grid.innerHTML = "";
    statusEl.textContent = HW_I18N.t("openings.empty");
    statusEl.className = "form-status";
    return;
  }

  statusEl.textContent = "";
  grid.innerHTML = filtered
    .map((o) => {
      const expanded = expandedOpeningIds.has(o.id);
      return `
    <div class="opening-card${expanded ? " expanded" : ""}" data-id="${o.id}">
      ${o.image_url
        ? `<img class="opening-image" src="${escapeHtml(o.image_url)}" alt="${escapeHtml(o.title)}">`
        : `<div class="opening-image opening-image-placeholder"></div>`}
      <div class="opening-card-body">
        <h3 class="opening-title">${escapeHtml(o.title)}</h3>
        <div class="opening-detail">
          ${o.description ? `<p class="opening-desc">${escapeHtml(o.description)}</p>` : ""}
        </div>
        <div class="opening-actions">
          <button type="button" class="opening-toggle" data-id="${o.id}">${escapeHtml(HW_I18N.t(expanded ? "openings.hideDetails" : "openings.viewDetails"))}</button>
        </div>
        <div class="opening-receipt">
          <input type="file" accept="image/*,application/pdf" class="opening-receipt-input" data-id="${o.id}" id="receiptInput-${o.id}" hidden>
          ${receiptUploadedIds.has(o.id)
            ? `<span class="field-hint success">${escapeHtml(HW_I18N.t("openings.receiptUploaded"))}</span>`
            : `<label class="btn btn-ghost btn-sm opening-receipt-btn" for="receiptInput-${o.id}">${escapeHtml(HW_I18N.t("openings.uploadReceipt"))}</label>`}
          <span class="field-hint opening-receipt-status" data-status-for="${o.id}"></span>
        </div>
      </div>
    </div>
  `;
    })
    .join("");

  // Re-translate any freshly injected data-i18n elements (e.g. the "View details" toggle).
  grid.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = HW_I18N.t(el.getAttribute("data-i18n"));
  });
}

grid.addEventListener("click", (e) => {
  if (!e.target.classList.contains("opening-toggle")) return;
  const id = e.target.dataset.id;
  if (expandedOpeningIds.has(id)) expandedOpeningIds.delete(id);
  else expandedOpeningIds.add(id);
  render();
});

const MAX_RECEIPT_BYTES = 5 * 1024 * 1024; // 5MB

// Same reasoning as script.js: never trust the raw filename extension for
// a storage object key, since it isn't guaranteed to be a safe path segment.
const SAFE_UPLOAD_EXTENSIONS = new Set(["jpg", "jpeg", "png", "gif", "webp", "heic", "heif", "pdf"]);
const MIME_TO_EXTENSION = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
  "application/pdf": "pdf",
};

function safeUploadExtension(file) {
  const raw = (file.name.split(".").pop() || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  if (SAFE_UPLOAD_EXTENSIONS.has(raw)) return raw;
  return MIME_TO_EXTENSION[file.type] || "bin";
}

/* ---------- resume an interrupted receipt upload ----------
   Same idea as the registration form: if the file finishes uploading to
   storage but the tab closes before the job_application_receipts row gets
   inserted, the path isn't lost — save it, and quietly finish that insert
   next time this page loads for the same applicant. */

const RECEIPT_PROGRESS_KEY = "hw_receipt_progress_v1";

function loadReceiptProgress() {
  try {
    const raw = localStorage.getItem(RECEIPT_PROGRESS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveReceiptPath(openingId, confirmToken, path) {
  try {
    const all = loadReceiptProgress();
    all[openingId] = { confirmToken, path, savedAt: new Date().toISOString() };
    localStorage.setItem(RECEIPT_PROGRESS_KEY, JSON.stringify(all));
  } catch {
    // Storage unavailable — the upload itself still succeeded, only the
    // auto-resume-on-reload safety net won't be available.
  }
}

function clearReceiptPath(openingId) {
  try {
    const all = loadReceiptProgress();
    delete all[openingId];
    localStorage.setItem(RECEIPT_PROGRESS_KEY, JSON.stringify(all));
  } catch {}
}

async function finishReceiptInsert(openingId, confirmToken, path) {
  const { error } = await supabaseClient.from("job_application_receipts").insert([{
    opening_id: openingId,
    confirm_token: confirmToken,
    receipt_path: path,
  }]);
  if (error) throw error;
  clearReceiptPath(openingId);
  receiptUploadedIds.add(openingId);
}

async function resumeUnfinishedReceipts() {
  const all = loadReceiptProgress();
  for (const [openingId, entry] of Object.entries(all)) {
    if (!entry || entry.confirmToken !== applicantToken) continue; // not this applicant
    try {
      await finishReceiptInsert(openingId, entry.confirmToken, entry.path);
    } catch (err) {
      console.error("Couldn't finish a previously uploaded receipt:", err);
      // Leave it saved — it'll try again next time this page loads.
    }
  }
  render();
}

async function uploadJobApplicationReceipt(file) {
  const ext = safeUploadExtension(file);
  const path = `job-applications/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabaseClient.storage
    .from("registrations")
    .upload(path, file, { upsert: false });
  if (error) throw error;
  return path;
}

grid.addEventListener("change", async (e) => {
  if (!e.target.classList.contains("opening-receipt-input")) return;
  const input = e.target;
  const openingId = input.dataset.id;
  const file = input.files && input.files[0];
  if (!file) return;

  const statusEl2 = grid.querySelector(`.opening-receipt-status[data-status-for="${openingId}"]`);

  if (!applicantToken) {
    if (statusEl2) { statusEl2.textContent = HW_I18N.t("openings.receiptVerifyError"); statusEl2.className = "field-hint opening-receipt-status error"; }
    return;
  }
  if (file.size > MAX_RECEIPT_BYTES) {
    if (statusEl2) { statusEl2.textContent = HW_I18N.t("openings.receiptTooLarge"); statusEl2.className = "field-hint opening-receipt-status error"; }
    return;
  }

  if (statusEl2) { statusEl2.textContent = HW_I18N.t("openings.receiptUploading"); statusEl2.className = "field-hint opening-receipt-status"; }

  try {
    const receiptPath = await uploadJobApplicationReceipt(file);
    saveReceiptPath(openingId, applicantToken, receiptPath);

    await finishReceiptInsert(openingId, applicantToken, receiptPath);
    render();
  } catch (err) {
    console.error(err);
    if (statusEl2) { statusEl2.textContent = HW_I18N.t("openings.receiptUploadError"); statusEl2.className = "field-hint opening-receipt-status error"; }
  }
});

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value === null || value === undefined ? "" : String(value);
  return div.innerHTML;
}

async function loadOpenings() {
  statusEl.textContent = HW_I18N.t("openings.loading");
  statusEl.className = "form-status";

  try {
    const { data, error } = await supabaseClient
      .from("job_openings")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) throw error;

    allOpenings = data || [];
    render();
  } catch (err) {
    console.error(err);
    statusEl.textContent = HW_I18N.t("openings.loadError");
    statusEl.className = "form-status error";
  }
}

document.addEventListener("hw:langchange", () => {
  if (lastGateKey) showGate(lastGateKey); // re-translate the gate message if it's showing
  render();
});

/* ---------- access gate ----------
   This page is only meant to be reached via an approved applicant's link
   (confirm.html appends ?token=... when it shows the "View available
   jobs" button). It re-checks the token against get-confirmation here
   rather than trusting the URL, so an unapproved or made-up token can't
   see the listings just by guessing the page exists.

   Note: this only hides the page's UI. The job_openings table itself is
   still readable by the public anon key (same as openings always was),
   so this isn't a hard security boundary — it's a flow gate, consistent
   with how confirm.html itself works (public page, token is the
   capability). Don't put anything sensitive in job listings relying on
   this check alone. */

let lastGateKey = null;

function showGate(messageKey) {
  lastGateKey = messageKey;
  openingsGateMessage.textContent = HW_I18N.t(messageKey);
  openingsGate.hidden = false;
  openingsContent.hidden = true;
}

async function checkAccessAndLoad() {
  const token = new URLSearchParams(location.search).get("token");

  if (!token) {
    showGate("openings.gateMissingToken");
    return;
  }

  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/get-confirmation?token=${encodeURIComponent(token)}`, {
      headers: { apikey: SUPABASE_ANON_KEY },
    });

    if (res.status === 404) {
      showGate("openings.gateInvalid");
      return;
    }
    if (!res.ok) throw new Error("Request failed: " + res.status);

    const data = await res.json();
    if (!data.approved) {
      showGate("openings.gateNotApproved");
      return;
    }

    lastGateKey = null;
    applicantToken = token;
    openingsGate.hidden = true;
    openingsContent.hidden = false;
    await loadOpenings();
    resumeUnfinishedReceipts();
  } catch (err) {
    console.error(err);
    showGate("openings.gateInvalid");
  }
}

checkAccessAndLoad();
