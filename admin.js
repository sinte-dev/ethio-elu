const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Supabase Auth is email-based under the hood, but staff only ever see a
// plain username. Accounts must be created in Supabase with the email
// "<username>@STAFF_LOGIN_DOMAIN" — see SETUP-CONFIRMATION.md / the admin
// login instructions for exact steps. Change this if you want a different
// internal domain; it never needs to be a real, deliverable address.
const STAFF_LOGIN_DOMAIN = "staff.horizonworkforce.internal";

function usernameToLoginEmail(username) {
  return `${username.trim().toLowerCase()}@${STAFF_LOGIN_DOMAIN}`;
}

function loginEmailToUsername(email) {
  return String(email || "").split("@")[0];
}

// 3–32 chars, letters/numbers/dot/underscore/hyphen — kept intentionally
// simple since it just becomes the local part of an internal email address.
const USERNAME_RE = /^[a-z0-9._-]{3,32}$/i;

const loginSection = document.getElementById("loginSection");
const dashboardSection = document.getElementById("dashboardSection");
const signOutBtn = document.getElementById("signOutBtn");

const loginForm = document.getElementById("loginForm");
const loginBtn = document.getElementById("loginBtn");
const loginStatus = document.getElementById("loginStatus");

const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const refreshBtn = document.getElementById("refreshBtn");
const dashStatus = document.getElementById("dashStatus");
const summaryRow = document.getElementById("summaryRow");
const regTableBody = document.getElementById("regTableBody");

const modalOverlay = document.getElementById("modalOverlay");
const modalCloseBtn = document.getElementById("modalCloseBtn");
const modalBody = document.getElementById("modalBody");

const currentUsernameLabel = document.getElementById("currentUsernameLabel");
const accountForm = document.getElementById("accountForm");
const currentPasswordInput = document.getElementById("currentPasswordInput");
const newUsernameInput = document.getElementById("newUsernameInput");
const newPasswordInput = document.getElementById("newPasswordInput");
const confirmNewPasswordInput = document.getElementById("confirmNewPasswordInput");
const saveAccountBtn = document.getElementById("saveAccountBtn");
const accountStatus = document.getElementById("accountStatus");

const openingForm = document.getElementById("openingForm");
const openingIdInput = document.getElementById("openingIdInput");
const openingTitleInput = document.getElementById("openingTitleInput");
const openingDescriptionInput = document.getElementById("openingDescriptionInput");
const openingImageInput = document.getElementById("openingImageInput");
const openingImagePreviewWrap = document.getElementById("openingImagePreviewWrap");
const openingImagePreview = document.getElementById("openingImagePreview");
const openingActiveInput = document.getElementById("openingActiveInput");
const saveOpeningBtn = document.getElementById("saveOpeningBtn");
const cancelEditOpeningBtn = document.getElementById("cancelEditOpeningBtn");
const openingFormStatus = document.getElementById("openingFormStatus");
const openingsAdminList = document.getElementById("openingsAdminList");

const jobReceiptsAdminList = document.getElementById("jobReceiptsAdminList");

let currentOpenings = [];
let editingOpeningImageUrl = null; // the saved image_url of the row being edited, kept unless a new file is chosen
const MAX_OPENING_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

// Same reasoning as the public upload flows: never trust the raw filename
// extension for a storage object key.
const SAFE_UPLOAD_EXTENSIONS = new Set(["jpg", "jpeg", "png", "gif", "webp", "heic", "heif"]);
const MIME_TO_EXTENSION = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
};

function safeUploadExtension(file) {
  const raw = (file.name.split(".").pop() || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  if (SAFE_UPLOAD_EXTENSIONS.has(raw)) return raw;
  return MIME_TO_EXTENSION[file.type] || "jpg";
}

const MAX_BENEFIT_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

const settingsForm = document.getElementById("settingsForm");
const whatsappNumberInput = document.getElementById("whatsappNumberInput");
const paymentBankNameInput = document.getElementById("paymentBankNameInput");
const paymentAccountNameInput = document.getElementById("paymentAccountNameInput");
const paymentAccountNumberInput = document.getElementById("paymentAccountNumberInput");
const saveSettingsBtn = document.getElementById("saveSettingsBtn");
const settingsStatus = document.getElementById("settingsStatus");

let currentRows = [];
let searchDebounce = null;

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value === null || value === undefined ? "" : String(value);
  return div.innerHTML;
}

function setDashStatus(message, type) {
  dashStatus.textContent = message || "";
  dashStatus.className = "form-status" + (type ? " " + type : "");
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

// Same link shape register.html/script.js hands the applicant after they
// submit: confirm.html on this same site, with their confirm_token. Built
// here (not stored) so it always reflects the current domain/path.
function confirmationLinkFor(row) {
  if (!row || !row.confirm_token) return null;
  return `${location.origin}${location.pathname.replace(/admin\.html$/, "")}confirm.html?token=${row.confirm_token}`;
}

async function copyTextToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error("Clipboard write failed:", err);
    return false;
  }
}

/* ---------- auth ---------- */

async function refreshAuthUI() {
  const { data } = await supabaseClient.auth.getSession();
  if (data.session) {
    loginSection.hidden = true;
    dashboardSection.hidden = false;
    signOutBtn.hidden = false;
    currentUsernameLabel.textContent = loginEmailToUsername(data.session.user.email);
    loadRegistrations();
    loadSettings();
    loadJobOpenings();
    loadJobApplicationReceipts();
  } else {
    loginSection.hidden = false;
    dashboardSection.hidden = true;
    signOutBtn.hidden = true;
  }
}

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginStatus.textContent = "";
  loginStatus.className = "form-status";

  const username = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  loginBtn.disabled = true;
  loginBtn.textContent = "Signing in…";

  const { error } = await supabaseClient.auth.signInWithPassword({
    email: usernameToLoginEmail(username),
    password,
  });

  loginBtn.disabled = false;
  loginBtn.textContent = "Sign in";

  if (error) {
    loginStatus.textContent = "Couldn't sign in — check your username and password.";
    loginStatus.className = "form-status error";
    return;
  }

  loginForm.reset();
  refreshAuthUI();
});

signOutBtn.addEventListener("click", async () => {
  await supabaseClient.auth.signOut();
  refreshAuthUI();
});

/* ---------- data loading ---------- */

async function loadRegistrations() {
  setDashStatus("Loading…", null);
  regTableBody.innerHTML = "";

  let query = supabaseClient
    .from("registration")
    .select("*")
    .order("created_at", { ascending: false });

  if (statusFilter.value === "pending") {
    query = query.eq("approved", false).neq("status", "rejected");
  } else if (statusFilter.value === "approved") {
    query = query.eq("approved", true);
  } else if (statusFilter.value === "rejected") {
    query = query.eq("status", "rejected");
  }

  const term = searchInput.value.trim();
  if (term) query = query.or(`full_name.ilike.%${term}%,phone.ilike.%${term}%`);

  const { data, error } = await query;

  if (error) {
    console.error(error);
    setDashStatus("Couldn't load registrations. Try refreshing.", "error");
    return;
  }

  currentRows = data;
  renderTable(data);
  renderSummary(data);
  setDashStatus(data.length ? "" : "No registrations match these filters.", null);
}

function renderSummary(rows) {
  let pending = 0;
  let approved = 0;
  let rejected = 0;
  rows.forEach((r) => {
    if (r.status === "rejected") rejected++;
    else if (r.approved) approved++;
    else pending++;
  });
  summaryRow.innerHTML = `
    <span class="admin-pill">${rows.length} shown</span>
    <span class="admin-pill status-new">${pending} pending</span>
    <span class="admin-pill status-placed">${approved} approved</span>
    <span class="admin-pill status-contacted">${rejected} rejected</span>
  `;
}

function renderTable(rows) {
  if (!rows.length) {
    regTableBody.innerHTML = "";
    return;
  }

  regTableBody.innerHTML = rows.map((row) => `
    <tr data-id="${row.id}">
      <td>${escapeHtml(row.full_name)}</td>
      <td>${escapeHtml(row.phone)}</td>
      <td>${formatDate(row.created_at)}</td>
      <td>
        <div class="admin-approval-cell">
          ${row.approved
            ? `<span class="admin-pill status-placed">Approved</span>
               <button class="btn btn-ghost btn-sm copy-link-btn" data-id="${row.id}" type="button">Copy link</button>`
            : row.status === "rejected"
              ? `<span class="admin-pill status-contacted">Rejected</span>
                 <button class="btn btn-primary btn-sm approve-btn" data-id="${row.id}" type="button">Approve</button>`
              : `<button class="btn btn-primary approve-btn" data-id="${row.id}" type="button">Approve</button>
                 <button class="btn btn-ghost btn-sm reject-btn" data-id="${row.id}" type="button">Reject</button>`}
          <button class="btn btn-ghost btn-sm delete-registration-btn" data-id="${row.id}" type="button" aria-label="Delete registration">Delete</button>
        </div>
      </td>
      <td><button class="btn btn-ghost view-btn" data-id="${row.id}" type="button">View</button></td>
    </tr>
  `).join("");
}

modalBody.addEventListener("change", async (e) => {
  if (!e.target.classList.contains("status-select")) return;
  const id = e.target.dataset.id;
  const newStatus = e.target.value;

  e.target.disabled = true;
  const { error } = await supabaseClient
    .from("registration")
    .update({ status: newStatus })
    .eq("id", id);
  e.target.disabled = false;

  if (error) {
    console.error(error);
    setDashStatus("Couldn't update status. Try again.", "error");
    return;
  }

  e.target.className = "status-select status-" + newStatus;
  const row = currentRows.find((r) => r.id === id);
  if (row) row.status = newStatus;
  renderSummary(currentRows);
});

regTableBody.addEventListener("click", async (e) => {
  if (e.target.classList.contains("view-btn")) {
    const id = e.target.dataset.id;
    const row = currentRows.find((r) => r.id === id);
    if (row) openDetail(row);
    return;
  }

  if (e.target.classList.contains("copy-link-btn")) {
    const id = e.target.dataset.id;
    const row = currentRows.find((r) => r.id === id);
    const link = confirmationLinkFor(row);

    if (!link) {
      setDashStatus("No registration link for this row.", "error");
      return;
    }

    const original = e.target.textContent;
    const ok = await copyTextToClipboard(link);
    e.target.textContent = ok ? "Copied!" : "Couldn't copy";
    setTimeout(() => { e.target.textContent = original; }, 1500);

    if (!ok) setDashStatus("Couldn't copy the link — you can copy it from the detail view instead.", "error");
    return;
  }

  if (e.target.classList.contains("approve-btn")) {
    const id = e.target.dataset.id;
    if (!confirm("Approve this registration? This sends the applicant their confirmation email.")) return;

    e.target.disabled = true;
    e.target.textContent = "Approving…";

    const { error } = await supabaseClient
      .from("registration")
      .update({ approved: true, approved_at: new Date().toISOString(), status: "new" })
      .eq("id", id);

    if (error) {
      console.error(error);
      setDashStatus("Couldn't approve. Try again.", "error");
      e.target.disabled = false;
      e.target.textContent = "Approve";
      return;
    }

    const row = currentRows.find((r) => r.id === id);
    if (row) { row.approved = true; row.status = "new"; }
    loadRegistrations();
    return;
  }

  if (e.target.classList.contains("reject-btn")) {
    const id = e.target.dataset.id;
    if (!confirm("Reject this registration? The applicant will be marked as rejected.")) return;

    e.target.disabled = true;
    e.target.textContent = "Rejecting…";

    const { error } = await supabaseClient
      .from("registration")
      .update({ status: "rejected", approved: false })
      .eq("id", id);

    if (error) {
      console.error(error);
      setDashStatus("Couldn't reject. Try again.", "error");
      e.target.disabled = false;
      e.target.textContent = "Reject";
      return;
    }

    const row = currentRows.find((r) => r.id === id);
    if (row) { row.status = "rejected"; row.approved = false; }
    loadRegistrations();
    return;
  }

  if (e.target.classList.contains("delete-registration-btn")) {
    const id = e.target.dataset.id;
    const row = currentRows.find((r) => r.id === id);
    const name = row ? row.full_name : "this registration";

    if (!confirm(`Delete "${name}"? This permanently removes the registration and can't be undone.`)) return;

    e.target.disabled = true;
    e.target.textContent = "Deleting…";

    const { error } = await supabaseClient
      .from("registration")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(error);
      setDashStatus("Couldn't delete that registration. Try again.", "error");
      e.target.disabled = false;
      e.target.textContent = "Delete";
      return;
    }

    // Best-effort cleanup of the uploaded files — a failure here shouldn't
    // block the row from being removed, since the database record is gone
    // either way.
    if (row) {
      const paths = [row.photo_path, row.id_document_path, row.id_document_back_path, row.receipt_path].filter(Boolean);
      if (paths.length) {
        supabaseClient.storage.from("registrations").remove(paths).catch((err) => {
          console.error("Couldn't remove storage files for deleted registration:", err);
        });
      }
    }

    if (!modalOverlay.hidden) modalOverlay.hidden = true;
    loadRegistrations();
  }
});

/* ---------- detail modal ---------- */

async function signedLink(path) {
  if (!path) return null;
  const { data, error } = await supabaseClient
    .storage
    .from("registrations")
    .createSignedUrl(path, 300); // 5 minutes
  if (error) {
    console.error(error);
    return null;
  }
  return data.signedUrl;
}

function isImagePath(path) {
  return /\.(jpe?g|png|gif|webp|heic|heif)$/i.test(path || "");
}

function docPreviewMarkup(url, path, label) {
  if (!url) return `<div class="admin-doc"><span class="admin-modal-label">${label}</span><span class="field-hint">Unavailable</span></div>`;
  if (isImagePath(path)) {
    return `
      <div class="admin-doc">
        <span class="admin-modal-label">${label}</span>
        <a href="${url}" target="_blank" rel="noopener">
          <img class="admin-doc-preview" src="${url}" alt="${label}">
        </a>
      </div>`;
  }
  return `
    <div class="admin-doc">
      <span class="admin-modal-label">${label}</span>
      <a class="btn btn-ghost" href="${url}" target="_blank" rel="noopener">View ${label}</a>
    </div>`;
}

async function openDetail(row) {
  modalBody.innerHTML = `<p>Loading documents…</p>`;
  modalOverlay.hidden = false;

  const [photoUrl, idFrontUrl, idBackUrl, receiptUrl] = await Promise.all([
    signedLink(row.photo_path),
    signedLink(row.id_document_path),
    signedLink(row.id_document_back_path),
    signedLink(row.receipt_path),
  ]);

  modalBody.innerHTML = `
    <h2 id="modalTitle" class="admin-modal-title">${escapeHtml(row.full_name)}</h2>
    <span class="admin-pill ${row.approved ? "status-placed" : "status-new"}" style="margin-bottom:16px; display:inline-block;">
      ${row.approved ? "Approved" : "Pending approval"}
    </span>

    ${row.approved && confirmationLinkFor(row)
      ? `<div class="form-row">
          <label class="admin-modal-label">Registration link</label>
          <div class="confirm-link-row">
            <input type="text" readonly value="${escapeHtml(confirmationLinkFor(row))}" id="modalConfirmLink-${row.id}">
            <button type="button" class="btn btn-ghost modal-copy-link-btn" data-id="${row.id}">Copy</button>
          </div>
        </div>`
      : ""}

    <div class="form-row">
      <label class="admin-modal-label" for="statusSelect-${row.id}">Status</label>
      <select class="status-select status-${row.status}" id="statusSelect-${row.id}" data-id="${row.id}">
        <option value="new" ${row.status === "new" ? "selected" : ""}>New</option>
        <option value="contacted" ${row.status === "contacted" ? "selected" : ""}>Contacted</option>
        <option value="placed" ${row.status === "placed" ? "selected" : ""}>Placed</option>
        <option value="rejected" ${row.status === "rejected" ? "selected" : ""}>Rejected</option>
      </select>
    </div>

    <div class="admin-modal-grid">
      <div><span class="admin-modal-label">Phone</span>${escapeHtml(row.phone)}</div>
      <div><span class="admin-modal-label">Email</span>${escapeHtml(row.email) || "—"}</div>
      <div><span class="admin-modal-label">Date of birth</span>${escapeHtml(row.date_of_birth)}</div>
      <div><span class="admin-modal-label">Gender</span>${escapeHtml(row.gender) || "—"}</div>
      <div><span class="admin-modal-label">Location</span>${escapeHtml(row.location)}</div>
      <div><span class="admin-modal-label">Bank name</span>${escapeHtml(row.bank_name) || "—"}</div>
      <div><span class="admin-modal-label">Bank account number</span>${escapeHtml(row.bank_account_number) || "—"}</div>
      <div><span class="admin-modal-label">Submitted</span>${formatDate(row.created_at)}</div>
    </div>

    <div class="form-section-label">Documents</div>
    <div class="admin-modal-docs">
      ${docPreviewMarkup(photoUrl, row.photo_path, "Photo")}
      ${docPreviewMarkup(idFrontUrl, row.id_document_path, "ID document (front)")}
      ${docPreviewMarkup(idBackUrl, row.id_document_back_path, "ID document (back)")}
      ${docPreviewMarkup(receiptUrl, row.receipt_path, "Payment receipt")}
    </div>
    <p class="field-hint" style="margin-top:14px;">Click an image to open it full-size. Document links expire after 5 minutes.</p>
  `;
}

modalBody.addEventListener("click", async (e) => {
  if (!e.target.classList.contains("modal-copy-link-btn")) return;
  const id = e.target.dataset.id;
  const input = document.getElementById(`modalConfirmLink-${id}`);
  if (!input) return;

  const original = e.target.textContent;
  const ok = await copyTextToClipboard(input.value);
  e.target.textContent = ok ? "Copied!" : "Couldn't copy";
  if (!ok) input.select(); // fallback: at least select it so they can Ctrl+C
  setTimeout(() => { e.target.textContent = original; }, 1500);
});

modalCloseBtn.addEventListener("click", () => { modalOverlay.hidden = true; });
modalOverlay.addEventListener("click", (e) => {
  if (e.target === modalOverlay) modalOverlay.hidden = true;
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !modalOverlay.hidden) modalOverlay.hidden = true;
});

/* ---------- site settings ---------- */

async function loadSettings() {
  const { data, error } = await supabaseClient
    .from("r_site_settings")
    .select("whatsapp_number, payment_bank_name, payment_account_name, payment_account_number")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    console.error(error);
    return;
  }
  if (!data) return;

  whatsappNumberInput.value = data.whatsapp_number || "";
  paymentBankNameInput.value = data.payment_bank_name || "";
  paymentAccountNameInput.value = data.payment_account_name || "";
  paymentAccountNumberInput.value = data.payment_account_number || "";
}

settingsForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const whatsapp = whatsappNumberInput.value.trim();

  if (!/^\d{8,15}$/.test(whatsapp)) {
    settingsStatus.textContent = "WhatsApp number: digits only, international format (e.g. 251912345678).";
    settingsStatus.className = "field-hint error";
    return;
  }

  const bankName = paymentBankNameInput.value.trim();
  const accountName = paymentAccountNameInput.value.trim();
  const accountNumber = paymentAccountNumberInput.value.trim();

  if (!bankName || !accountName || !accountNumber) {
    settingsStatus.textContent = "Fill in all payment fields.";
    settingsStatus.className = "field-hint error";
    return;
  }

  saveSettingsBtn.disabled = true;
  saveSettingsBtn.textContent = "Saving…";

  const { error } = await supabaseClient
    .from("r_site_settings")
    .update({
      whatsapp_number: whatsapp,
      payment_bank_name: bankName,
      payment_account_name: accountName,
      payment_account_number: accountNumber,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  saveSettingsBtn.disabled = false;
  saveSettingsBtn.textContent = "Save";

  if (error) {
    console.error(error);
    settingsStatus.textContent = "Couldn't save. Try again.";
    settingsStatus.className = "field-hint error";
    return;
  }

  settingsStatus.textContent = "Saved.";
  settingsStatus.className = "field-hint success";
});


/* ---------- account: change username / password ---------- */

accountForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  accountStatus.textContent = "";
  accountStatus.className = "field-hint";

  const currentPassword = currentPasswordInput.value;
  const newUsername = newUsernameInput.value.trim();
  const newPassword = newPasswordInput.value;
  const confirmNewPassword = confirmNewPasswordInput.value;

  if (!newUsername && !newPassword) {
    accountStatus.textContent = "Enter a new username and/or a new password.";
    accountStatus.className = "field-hint error";
    return;
  }

  if (newUsername && !USERNAME_RE.test(newUsername)) {
    accountStatus.textContent = "Username: 3–32 characters, letters/numbers/./_/- only.";
    accountStatus.className = "field-hint error";
    return;
  }

  if (newPassword) {
    if (newPassword.length < 8) {
      accountStatus.textContent = "New password must be at least 8 characters.";
      accountStatus.className = "field-hint error";
      return;
    }
    if (newPassword !== confirmNewPassword) {
      accountStatus.textContent = "New password and confirmation don't match.";
      accountStatus.className = "field-hint error";
      return;
    }
  }

  const { data: sessionData } = await supabaseClient.auth.getSession();
  const currentEmail = sessionData.session?.user?.email;
  if (!currentEmail) {
    accountStatus.textContent = "Your session expired — sign in again.";
    accountStatus.className = "field-hint error";
    return;
  }

  saveAccountBtn.disabled = true;
  saveAccountBtn.textContent = "Verifying…";

  // Re-check the current password before changing anything, so a staff
  // member who steps away from an unlocked, still-logged-in tab can't have
  // their login silently changed by someone else.
  const { error: reauthError } = await supabaseClient.auth.signInWithPassword({
    email: currentEmail,
    password: currentPassword,
  });

  if (reauthError) {
    saveAccountBtn.disabled = false;
    saveAccountBtn.textContent = "Update login";
    accountStatus.textContent = "Current password is incorrect.";
    accountStatus.className = "field-hint error";
    return;
  }

  const updates = {};
  if (newUsername) updates.email = usernameToLoginEmail(newUsername);
  if (newPassword) updates.password = newPassword;

  saveAccountBtn.textContent = "Saving…";

  const { error } = await supabaseClient.auth.updateUser(updates);

  saveAccountBtn.disabled = false;
  saveAccountBtn.textContent = "Update login";

  if (error) {
    console.error(error);
    accountStatus.textContent = error.message.includes("already")
      ? "That username is already taken."
      : "Couldn't update your login. Try again.";
    accountStatus.className = "field-hint error";
    return;
  }

  accountForm.reset();

  if (newUsername) {
    currentUsernameLabel.textContent = newUsername;
    accountStatus.textContent = "Username updated. If your Supabase project requires confirming email changes, sign out and back in with your old username once, then switch to the new one after it's confirmed.";
  } else {
    accountStatus.textContent = "Password updated.";
  }
  accountStatus.className = "field-hint success";
});

/* ---------- job openings ---------- */

async function loadJobOpenings() {
  const { data, error } = await supabaseClient
    .from("job_openings")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    openingsAdminList.innerHTML = `<p class="field-hint error">Couldn't load job openings.</p>`;
    return;
  }

  currentOpenings = data || [];
  renderOpeningsAdminList();
}

function renderOpeningsAdminList() {
  if (!currentOpenings.length) {
    openingsAdminList.innerHTML = `<p class="field-hint">No job openings yet — add one above.</p>`;
    return;
  }

  openingsAdminList.innerHTML = currentOpenings
    .map(
      (o) => `
    <div class="admin-opening-row${o.is_active ? "" : " inactive"}" data-id="${o.id}">
      ${o.image_url
        ? `<img class="admin-opening-thumb" src="${escapeHtml(o.image_url)}" alt="">`
        : `<div class="admin-opening-thumb admin-opening-thumb-empty"></div>`}
      <div class="admin-opening-info">
        <strong>${escapeHtml(o.title)}</strong>
        <span>${o.is_active ? "Visible on site" : "Hidden"}</span>
      </div>
      <div class="admin-opening-actions">
        <button type="button" class="btn btn-ghost opening-toggle-active-btn" data-id="${o.id}">${o.is_active ? "Hide" : "Show"}</button>
        <button type="button" class="btn btn-ghost opening-edit-btn" data-id="${o.id}">Edit</button>
        <button type="button" class="btn btn-ghost opening-delete-btn" data-id="${o.id}">Delete</button>
      </div>
    </div>
  `
    )
    .join("");
}

function resetOpeningForm() {
  openingForm.reset();
  openingIdInput.value = "";
  openingActiveInput.checked = true;
  editingOpeningImageUrl = null;
  openingImagePreviewWrap.hidden = true;
  openingImagePreview.src = "";
  saveOpeningBtn.textContent = "Add opening";
  cancelEditOpeningBtn.hidden = true;
}

cancelEditOpeningBtn.addEventListener("click", () => {
  resetOpeningForm();
  openingFormStatus.textContent = "";
  openingFormStatus.className = "field-hint";
});

openingImageInput.addEventListener("change", () => {
  const file = openingImageInput.files && openingImageInput.files[0];
  if (!file) return;
  openingImagePreview.src = URL.createObjectURL(file);
  openingImagePreviewWrap.hidden = false;
});

async function uploadOpeningImage(file) {
  const ext = safeUploadExtension(file);
  const path = `openings/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabaseClient.storage
    .from("job-images")
    .upload(path, file, { upsert: false });
  if (error) throw error;
  const { data } = supabaseClient.storage.from("job-images").getPublicUrl(path);
  return data.publicUrl;
}

openingsAdminList.addEventListener("click", async (e) => {
  const id = e.target.dataset.id;
  if (!id) return;
  const row = currentOpenings.find((o) => o.id === id);
  if (!row) return;

  if (e.target.classList.contains("opening-edit-btn")) {
    openingIdInput.value = row.id;
    openingTitleInput.value = row.title;
    openingDescriptionInput.value = row.description || "";
    openingActiveInput.checked = row.is_active;
    editingOpeningImageUrl = row.image_url || null;
    openingImageInput.value = "";
    if (row.image_url) {
      openingImagePreview.src = row.image_url;
      openingImagePreviewWrap.hidden = false;
    } else {
      openingImagePreviewWrap.hidden = true;
    }
    saveOpeningBtn.textContent = "Update opening";
    cancelEditOpeningBtn.hidden = false;
    openingForm.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }

  if (e.target.classList.contains("opening-toggle-active-btn")) {
    e.target.disabled = true;
    const { error } = await supabaseClient
      .from("job_openings")
      .update({ is_active: !row.is_active })
      .eq("id", id);
    e.target.disabled = false;
    if (error) {
      console.error(error);
      openingFormStatus.textContent = "Couldn't update that listing. Try again.";
      openingFormStatus.className = "field-hint error";
      return;
    }
    loadJobOpenings();
    return;
  }

  if (e.target.classList.contains("opening-delete-btn")) {
    if (!confirm(`Delete "${row.title}"? This can't be undone.`)) return;
    e.target.disabled = true;
    const { error } = await supabaseClient.from("job_openings").delete().eq("id", id);
    e.target.disabled = false;
    if (error) {
      console.error(error);
      openingFormStatus.textContent = "Couldn't delete that listing. Try again.";
      openingFormStatus.className = "field-hint error";
      return;
    }
    if (openingIdInput.value === id) resetOpeningForm();
    loadJobOpenings();
  }
});

openingForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  openingFormStatus.textContent = "";
  openingFormStatus.className = "field-hint";

  const title = openingTitleInput.value.trim();
  if (!title) {
    openingFormStatus.textContent = "Job title is required.";
    openingFormStatus.className = "field-hint error";
    return;
  }

  const file = openingImageInput.files && openingImageInput.files[0];
  if (file && file.size > MAX_OPENING_IMAGE_BYTES) {
    openingFormStatus.textContent = "Image is too large (max 5MB).";
    openingFormStatus.className = "field-hint error";
    return;
  }

  saveOpeningBtn.disabled = true;
  saveOpeningBtn.textContent = "Saving…";

  try {
    let imageUrl = editingOpeningImageUrl;
    if (file) {
      openingFormStatus.textContent = "Uploading photo…";
      imageUrl = await uploadOpeningImage(file);
    }

    const payload = {
      title,
      description: openingDescriptionInput.value.trim() || null,
      image_url: imageUrl,
      is_active: openingActiveInput.checked,
    };

    const editingId = openingIdInput.value;
    const { error } = editingId
      ? await supabaseClient.from("job_openings").update(payload).eq("id", editingId)
      : await supabaseClient.from("job_openings").insert([payload]);

    if (error) throw error;

    resetOpeningForm();
    openingFormStatus.textContent = editingId ? "Listing updated." : "Listing added.";
    openingFormStatus.className = "field-hint success";
    loadJobOpenings();
  } catch (err) {
    console.error(err);
    openingFormStatus.textContent = "Couldn't save that listing. Try again.";
    openingFormStatus.className = "field-hint error";
  } finally {
    saveOpeningBtn.disabled = false;
    saveOpeningBtn.textContent = openingIdInput.value ? "Update opening" : "Add opening";
  }
});


/* ---------- job application receipts ---------- */

let currentJobReceipts = [];

async function loadJobApplicationReceipts() {
  const { data, error } = await supabaseClient
    .from("job_application_receipts")
    .select("*, job_openings(title)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    jobReceiptsAdminList.innerHTML = `<p class="field-hint error">Couldn't load application receipts.</p>`;
    return;
  }

  currentJobReceipts = data || [];
  renderJobReceiptsAdminList();
}

function renderJobReceiptsAdminList() {
  if (!currentJobReceipts.length) {
    jobReceiptsAdminList.innerHTML = `<p class="field-hint">No application receipts uploaded yet.</p>`;
    return;
  }

  jobReceiptsAdminList.innerHTML = currentJobReceipts
    .map(
      (r) => `
    <div class="admin-opening-row" data-id="${r.id}">
      <div class="admin-opening-info">
        <strong>${escapeHtml(r.job_openings ? r.job_openings.title : "Job listing removed")}</strong>
        <span>Submitted ${formatDate(r.created_at)}</span>
      </div>
      <div class="admin-opening-actions">
        <button type="button" class="btn btn-ghost job-receipt-view-btn" data-id="${r.id}">View receipt</button>
        <button type="button" class="btn btn-ghost job-receipt-delete-btn" data-id="${r.id}">Delete</button>
      </div>
    </div>
  `
    )
    .join("");
}

jobReceiptsAdminList.addEventListener("click", async (e) => {
  const id = e.target.dataset.id;
  if (!id) return;
  const row = currentJobReceipts.find((r) => r.id === id);
  if (!row) return;

  if (e.target.classList.contains("job-receipt-view-btn")) {
    e.target.disabled = true;
    const url = await signedLink(row.receipt_path);
    e.target.disabled = false;
    if (!url) {
      alert("Couldn't open that receipt. Try again.");
      return;
    }
    window.open(url, "_blank", "noopener");
    return;
  }

  if (e.target.classList.contains("job-receipt-delete-btn")) {
    if (!confirm("Delete this receipt? This can't be undone.")) return;
    e.target.disabled = true;
    const { error } = await supabaseClient.from("job_application_receipts").delete().eq("id", id);
    e.target.disabled = false;
    if (error) {
      console.error(error);
      alert("Couldn't delete that receipt. Try again.");
      return;
    }
    loadJobApplicationReceipts();
  }
});

/* ---------- filters ---------- */

statusFilter.addEventListener("change", loadRegistrations);
refreshBtn.addEventListener("click", loadRegistrations);
searchInput.addEventListener("input", () => {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(loadRegistrations, 350);
});

/* ---------- init ---------- */

refreshAuthUI();
