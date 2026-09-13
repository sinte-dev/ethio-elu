// Floating WhatsApp click-to-chat button. Include after config.js on any
// public page. The number is normally fetched from the get-settings Edge
// Function (so admin can change it from admin.html without editing code).
// WHATSAPP_NUMBER in config.js is only used as a fallback if that fetch
// fails or the function hasn't been deployed yet.
(async function () {
  let number = typeof WHATSAPP_NUMBER !== "undefined" ? WHATSAPP_NUMBER : null;

  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/get-settings`, {
      headers: { apikey: SUPABASE_ANON_KEY },
    });
    if (res.ok) {
      const data = await res.json();
      if (data.whatsapp_number) number = data.whatsapp_number;
    }
  } catch {
    // Fall back to the config.js default silently — a missing/failed
    // function shouldn't block the rest of the page.
  }

  if (!number) return;
  const href = `https://wa.me/${number}?text=${encodeURIComponent(defaultMessage)}`;

  const link = document.createElement("a");
  link.href = href;
  link.target = "_blank";
  link.rel = "noopener";
  link.className = "whatsapp-fab";
  link.setAttribute("aria-label", "Chat with us on WhatsApp");
  link.innerHTML = `
    <svg viewBox="0 0 32 32" width="30" height="30" fill="currentColor" aria-hidden="true">
      <path d="M16.02 3C9.4 3 4 8.37 4 14.98c0 2.2.6 4.27 1.65 6.05L4 29l8.2-1.6a12.9 12.9 0 0 0 3.82.58h.01c6.62 0 12.02-5.37 12.02-11.98C28.05 8.37 22.66 3 16.02 3zm7.05 17.02c-.3.84-1.7 1.6-2.35 1.7-.6.1-1.36.14-2.2-.14-.5-.16-1.15-.38-1.98-.75-3.48-1.5-5.75-5-5.93-5.24-.17-.24-1.42-1.9-1.42-3.62 0-1.72.9-2.56 1.22-2.92.32-.35.7-.44.93-.44.23 0 .46 0 .66.01.21.01.5-.08.78.6.3.7 1 2.4 1.1 2.58.1.18.16.4.03.64-.13.24-.2.4-.4.6-.2.22-.4.5-.58.66-.2.18-.4.38-.18.75.23.37 1 1.65 2.15 2.68 1.48 1.32 2.72 1.73 3.1 1.93.37.2.6.16.82-.1.23-.26.97-1.14 1.23-1.53.26-.4.5-.32.83-.2.34.13 2.13 1 2.5 1.19.36.18.6.27.7.42.1.16.1.9-.2 1.74z"/>
    </svg>
  `;

  document.body.appendChild(link);
})();
