const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

const form = document.getElementById("registerForm");
const submitBtn = document.getElementById("submitBtn");
const statusEl = document.getElementById("formStatus");

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB

// The extension becomes part of the storage object key, so it can't be
// trusted verbatim from the filename (e.g. "../../x" has no dot and would
// pass straight through). Only ever use a known-safe extension, falling
// back to the browser-reported MIME type, then to a generic default.
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

/* ---------- resume an interrupted registration ----------
   Files upload to storage one at a time before the final database insert.
   If someone closes the tab after a file finished uploading but before
   that last insert, the upload isn't lost — it's saved here so they don't
   have to re-upload or retype anything if they come back. */

const PROGRESS_KEY = "hw_registration_progress_v1";
const FILE_FIELD_NAMES = ["photo", "idDocumentFront", "idDocumentBack", "receipt"];
const resumedUploads = {}; // fieldName -> true while a saved upload (not a freshly picked file) covers it

function loadProgress() {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveProgress(patch) {
  try {
    const current = loadProgress() || { formFields: {}, uploads: {} };
    const next = {
      formFields: { ...current.formFields, ...(patch.formFields || {}) },
      uploads: { ...current.uploads, ...(patch.uploads || {}) },
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(next));
  } catch {
    // Private browsing / storage disabled / quota full — resume just won't
    // be available next time, but this submission still works fine.
  }
}

function clearProgress() {
  try { localStorage.removeItem(PROGRESS_KEY); } catch {}
}

function markFieldAsResumed(fieldName) {
  const container = form.querySelector(`.file-field[data-field="${fieldName}"]`);
  if (!container) return;
  const input = container.querySelector(".file-field-input");
  const dropzone = container.querySelector(".file-dropzone");
  const actions = container.querySelector(".file-field-actions");

  input.required = false;
  container.classList.add("has-file");
  if (actions) actions.hidden = false;

  const note = document.createElement("div");
  note.className = "file-preview file-resumed-note";
  note.innerHTML = `<div class="file-preview-doc"><span>${HW_I18N.t("resume.alreadyUploaded")}</span></div>`;
  dropzone.insertAdjacentElement("afterend", note);

  resumedUploads[fieldName] = true;

  // Picking a new file for this field overrides the resumed upload.
  input.addEventListener("change", function onNewFile() {
    if (input.files && input.files[0]) {
      resumedUploads[fieldName] = false;
      input.required = true;
      note.remove();
      input.removeEventListener("change", onNewFile);
    }
  });

  // Removing it should un-resume the field too — otherwise a stale path
  // would silently get reused on submit even though the person cleared it.
  const removeBtn = container.querySelector(".file-remove-btn");
  removeBtn.addEventListener("click", function onRemove() {
    resumedUploads[fieldName] = false;
    input.required = true;
    note.remove();
    const progress = loadProgress();
    if (progress && progress.uploads) {
      delete progress.uploads[fieldName];
      try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress)); } catch {}
    }
    removeBtn.removeEventListener("click", onRemove);
  });
}

function initResume() {
  const progress = loadProgress();
  const hasAnyUpload = !!(progress && FILE_FIELD_NAMES.some((f) => progress.uploads && progress.uploads[f]));
  if (!hasAnyUpload) return;

  const resumeBanner = document.getElementById("resumeBanner");
  const resumeContinueBtn = document.getElementById("resumeContinueBtn");
  const resumeStartOverBtn = document.getElementById("resumeStartOverBtn");
  resumeBanner.hidden = false;

  resumeContinueBtn.addEventListener("click", () => {
    const ff = progress.formFields || {};
    ["fullName", "phone", "email", "dob", "gender", "location"].forEach((name) => {
      if (ff[name] && form[name]) form[name].value = ff[name];
    });
    FILE_FIELD_NAMES.forEach((f) => {
      if (progress.uploads && progress.uploads[f]) markFieldAsResumed(f);
    });
    resumeBanner.hidden = true;
  });

  resumeStartOverBtn.addEventListener("click", () => {
    clearProgress();
    resumeBanner.hidden = true;
  });
}

/* ---------- file field previews (photo / ID front / ID back / receipt) ---------- */

function setupFileField(container) {
  const input = container.querySelector(".file-field-input");
  const dropzone = container.querySelector(".file-dropzone");
  const actions = container.querySelector(".file-field-actions");
  const changeBtn = container.querySelector(".file-change-btn");
  const removeBtn = container.querySelector(".file-remove-btn");

  let preview = null; // the .file-preview element, created on demand
  let objectUrl = null;

  function clearPreview() {
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
      objectUrl = null;
    }
    if (preview) {
      preview.remove();
      preview = null;
    }
  }

  function showFile(file) {
    clearPreview();

    preview = document.createElement("div");
    preview.className = "file-preview";

    if (file.type.startsWith("image/")) {
      objectUrl = URL.createObjectURL(file);
      const img = document.createElement("img");
      img.src = objectUrl;
      img.alt = "";
      preview.appendChild(img);
    } else {
      preview.innerHTML = `
        <div class="file-preview-doc">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>
          <span>${file.name}</span>
        </div>
      `;
    }

    dropzone.insertAdjacentElement("afterend", preview);
    container.classList.add("has-file");
    actions.hidden = false;
  }

  function reset() {
    clearPreview();
    container.classList.remove("has-file");
    actions.hidden = true;
    input.value = "";
  }

  function openPicker() { input.click(); }

  dropzone.addEventListener("click", openPicker);
  dropzone.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openPicker();
    }
  });
  changeBtn.addEventListener("click", openPicker);
  removeBtn.addEventListener("click", reset);

  input.addEventListener("change", () => {
    const file = input.files && input.files[0];
    if (file) showFile(file);
    else reset();
  });
}

function initLastRegistrationBanner() {
  const saved = loadLastRegistrationLink();
  if (!saved) return;
  const banner = document.getElementById("lastRegistrationBanner");
  const link = document.getElementById("lastRegistrationLink");
  link.href = saved.link;
  banner.hidden = false;
}

document.querySelectorAll(".file-field").forEach(setupFileField);
initResume();
initLastRegistrationBanner();

/* ---------- fingerprint verify button ----------
   Purely a client-side confirmation gesture — this is not a real biometric
   check (the web platform has no API for reading an actual fingerprint
   sensor outside WebAuthn, which is a different, credential-based flow).
   Modeled on how an actual fingerprint sensor behaves: it requires a
   deliberate, sustained press rather than a single tap, with a ring that
   fills in as the "scan" progresses. Releasing early cancels it. It
   doesn't currently gate submission.

   Pointer capture is used so the hold survives small finger movement on
   touchscreens — without it, a slight drag during the press fires
   pointerleave and silently cancels the scan, which is the "press and
   hold isn't working" bug on mobile. */

const FINGERPRINT_HOLD_MS = 1200;

function playFingerprintTone(verified) {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    const notes = verified ? [660, 880] : [440];
    let t = ctx.currentTime;
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.18, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.18);
      t += 0.14;
    });
    setTimeout(() => ctx.close(), (notes.length * 140) + 200);
  } catch {
    // Web Audio unavailable (very old browser / blocked autoplay policy
    // before any user gesture) — the visual state change still gives feedback.
  }
}

(function setupFingerprintButton() {
  const btn = document.getElementById("fingerprintBtn");
  if (!btn) return;
  const statusEl2 = document.getElementById("fingerprintStatus");

  let holdStart = null;
  let holdRAF = null;
  let activePointerId = null;

  function setProgress(pct) {
    btn.style.setProperty("--p", String(pct));
  }

  function updateStatusText() {
    if (!statusEl2) return;
    statusEl2.textContent = HW_I18N.t(btn.classList.contains("is-verified") ? "form.fingerprintVerified" : "form.fingerprintHint");
  }

  function step() {
    const elapsed = performance.now() - holdStart;
    const pct = Math.min(100, (elapsed / FINGERPRINT_HOLD_MS) * 100);
    setProgress(pct);
    if (pct >= 100) {
      finishHold();
      return;
    }
    holdRAF = requestAnimationFrame(step);
  }

  function beginHold(pointerId) {
    if (holdStart !== null) return; // already in progress
    holdStart = performance.now();
    activePointerId = pointerId != null ? pointerId : null;
    if (activePointerId != null && btn.setPointerCapture) {
      try { btn.setPointerCapture(activePointerId); } catch {}
    }
    holdRAF = requestAnimationFrame(step);
  }

  function cancelHold() {
    if (holdRAF) cancelAnimationFrame(holdRAF);
    holdRAF = null;
    holdStart = null;
    if (activePointerId != null && btn.releasePointerCapture) {
      try { btn.releasePointerCapture(activePointerId); } catch {}
    }
    activePointerId = null;
    setProgress(0);
  }

  function finishHold() {
    const verified = !btn.classList.contains("is-verified");
    cancelHold();
    btn.classList.toggle("is-verified", verified);
    btn.setAttribute("aria-pressed", verified ? "true" : "false");
    updateStatusText();
    playFingerprintTone(verified);
  }

  // Pointer events cover mouse, touch, and pen in one set of handlers.
  // Capturing the pointer on press keeps the hold alive even if the
  // finger drifts a little, which is what real sensors tolerate too.
  btn.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    beginHold(e.pointerId);
  });
  btn.addEventListener("pointerup", (e) => {
    if (holdStart !== null && (activePointerId == null || e.pointerId === activePointerId)) cancelHold();
  });
  btn.addEventListener("pointercancel", (e) => {
    if (holdStart !== null && (activePointerId == null || e.pointerId === activePointerId)) cancelHold();
  });
  // Intentionally NOT cancelling on pointerleave: with pointer capture
  // active, "leave" can still fire on some browsers even though the
  // press is still valid, which is what made the hold feel broken.

  // Keyboard equivalent: hold Enter/Space instead of a single press.
  btn.addEventListener("keydown", (e) => {
    if ((e.key === "Enter" || e.key === " ") && !e.repeat) {
      e.preventDefault();
      beginHold(null);
    }
  });
  btn.addEventListener("keyup", (e) => {
    if ((e.key === "Enter" || e.key === " ") && holdStart !== null) cancelHold();
  });

  // Safety net: if the window loses the pointer entirely (e.g. an alert
  // or app switch interrupts mid-press), don't leave the ring stuck.
  window.addEventListener("blur", () => { if (holdStart !== null) cancelHold(); });

  document.addEventListener("hw:langchange", updateStatusText);
})();

/* ---------- live payment details ---------- */

(async function loadPaymentDetails() {
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/get-settings`, {
      headers: { apikey: SUPABASE_ANON_KEY },
    });
    if (!res.ok) throw new Error("Request failed");
    const data = await res.json();

    document.getElementById("paymentBankName").textContent = data.payment_bank_name || "—";
    document.getElementById("paymentAccountName").textContent = data.payment_account_name || "—";
    document.getElementById("paymentAccountNumber").textContent = data.payment_account_number || "—";
  } catch (err) {
    console.error(err);
    document.getElementById("paymentBankName").textContent = HW_I18N.t("payment.unavailable");
    document.getElementById("paymentAccountName").textContent = "—";
    document.getElementById("paymentAccountNumber").textContent = "—";
  }
})();

function setStatus(message, type) {
  statusEl.textContent = message;
  statusEl.className = "form-status" + (type ? " " + type : "");
}

const LAST_REGISTRATION_KEY = "hw_last_registration_v1";

function saveLastRegistrationLink(token, link) {
  try {
    localStorage.setItem(LAST_REGISTRATION_KEY, JSON.stringify({ token, link, savedAt: new Date().toISOString() }));
  } catch {
    // Storage unavailable — they'll need their copied/emailed link instead.
  }
}

function loadLastRegistrationLink() {
  try {
    const raw = localStorage.getItem(LAST_REGISTRATION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function showConfirmation(token) {
  const link = `${location.origin}${location.pathname.replace(/register\.html$/, "")}confirm.html?token=${token}`;
  saveLastRegistrationLink(token, link);

  form.hidden = true;
  const panel = document.getElementById("confirmPanel");
  const linkInput = document.getElementById("confirmLink");
  const copyBtn = document.getElementById("copyLinkBtn");
  const copyStatus = document.getElementById("copyStatus");

  linkInput.value = link;
  document.getElementById("viewConfirmBtn").href = link;
  panel.hidden = false;

  copyBtn.onclick = async () => {
    try {
      await navigator.clipboard.writeText(link);
      copyStatus.textContent = HW_I18N.t("confirm.copied");
    } catch {
      linkInput.select();
      copyStatus.textContent = HW_I18N.t("confirm.copyManual");
    }
  };
}

async function uploadFile(file, folder) {
  const ext = safeUploadExtension(file);
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabaseClient.storage
    .from("registrations")
    .upload(path, file, { upsert: false });
  if (error) throw error;
  return path;
}

async function getOrUploadPath(fieldName, folder) {
  const file = form[fieldName].files[0];

  if (!file) {
    // No newly picked file — this only reaches here when the field was
    // marked as resumed, so a path already exists from a previous attempt.
    const progress = loadProgress();
    return progress && progress.uploads && progress.uploads[fieldName];
  }

  if (file.size > MAX_FILE_BYTES) {
    throw Object.assign(new Error("file too large"), { code: "FILE_TOO_LARGE" });
  }

  const path = await uploadFile(file, folder);
  saveProgress({ uploads: { [fieldName]: path } });
  return path;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  setStatus("", null);

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const data = Object.fromEntries(new FormData(form).entries());

  // Save the typed fields now, before any upload starts, so this attempt
  // is resumable too if it gets interrupted partway through.
  saveProgress({
    formFields: {
      fullName: data.fullName, phone: data.phone, email: data.email,
      dob: data.dob, gender: data.gender, location: data.location,
    },
  });

  submitBtn.disabled = true;
  submitBtn.textContent = HW_I18N.t("form.uploading");

  try {
    const photoPath = await getOrUploadPath("photo", "photos");
    const idFrontPath = await getOrUploadPath("idDocumentFront", "id-documents");
    const idBackPath = await getOrUploadPath("idDocumentBack", "id-documents");
    const receiptPath = await getOrUploadPath("receipt", "receipts");

    submitBtn.textContent = HW_I18N.t("form.submitting");

    // Generated here (not read back from the database) so the confirmation
    // link can be shown immediately without needing a select policy that
    // would let the public read registrations back.
    const confirmToken = crypto.randomUUID();

    const { error } = await supabaseClient.from("registration").insert([{
      full_name: data.fullName,
      phone: data.phone,
      email: data.email || null,
      date_of_birth: data.dob,
      gender: data.gender || null,
      location: data.location,
      photo_path: photoPath,
      id_document_front_path: idFrontPath,
      id_document_back_path: idBackPath,
      receipt_path: receiptPath,
      confirm_token: confirmToken,
    }]);

    if (error) throw error;

    clearProgress();
    showConfirmation(confirmToken);
    form.reset();
  } catch (err) {
    console.error(err);
    if (err && err.code === "FILE_TOO_LARGE") {
      setStatus(HW_I18N.t("status.fileTooLarge"), "error");
    } else if (err && err.code === "23505") {
      // Postgres unique_violation — this phone number already has a registration.
      setStatus(HW_I18N.t("status.duplicatePhone"), "error");
    } else {
      setStatus(HW_I18N.t("status.submitError"), "error");
    }
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = HW_I18N.t("form.submit");
  }
});
