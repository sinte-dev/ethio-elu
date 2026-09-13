(() => {
  "use strict";

  // Prevent duplicate buttons if this script is loaded more than once.
  if (document.getElementById("whatsapp-float")) return;

  const number = (typeof WHATSAPP_NUMBER !== "undefined" && WHATSAPP_NUMBER)
    ? String(WHATSAPP_NUMBER).replace(/\D/g, "")
    : "251900000000";

  const message = "Hello, I would like to get more information.";

  const style = document.createElement("style");
  style.id = "whatsapp-float-style";
  style.textContent = `
    #whatsapp-float {
      position: fixed;
      right: 20px;
      bottom: 20px;
      width: 58px;
      height: 58px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2147483647;
      text-decoration: none;
      box-shadow: 0 4px 14px rgba(0,0,0,.25);
      background: #25D366;
      color: #fff;
      font-family: Arial, sans-serif;
      transition: transform .2s ease, box-shadow .2s ease;
    }
    #whatsapp-float:hover {
      transform: scale(1.06);
      box-shadow: 0 6px 18px rgba(0,0,0,.30);
    }
    #whatsapp-float svg {
      width: 31px;
      height: 31px;
      fill: currentColor;
    }
    @media (max-width: 600px) {
      #whatsapp-float {
        right: 16px;
        bottom: 16px;
        width: 56px;
        height: 56px;
      }
    }
  `;
  document.head.appendChild(style);

  const link = document.createElement("a");
  link.id = "whatsapp-float";
  link.href = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.setAttribute("aria-label", "Contact us on WhatsApp");
  link.title = "Contact us on WhatsApp";
  link.innerHTML = `
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="M19.11 17.24c-.27-.14-1.6-.79-1.85-.88-.25-.09-.43-.14-.61.14-.18.27-.7.88-.86 1.06-.16.18-.32.2-.59.07-.27-.14-1.14-.42-2.17-1.34-.8-.71-1.34-1.58-1.5-1.85-.16-.27-.02-.42.12-.56.12-.12.27-.32.41-.48.14-.16.18-.27.27-.45.09-.18.05-.34-.02-.48-.07-.14-.61-1.47-.84-2.01-.22-.53-.45-.46-.61-.47h-.52c-.18 0-.48.07-.73.34-.25.27-.96.94-.96 2.3s.98 2.67 1.12 2.85c.14.18 1.93 2.95 4.68 4.14.65.28 1.16.45 1.55.58.65.21 1.24.18 1.7.11.52-.08 1.6-.65 1.83-1.28.23-.63.23-1.17.16-1.28-.07-.11-.25-.18-.52-.32z"/>
      <path d="M16.01 3.2c-7.07 0-12.8 5.73-12.8 12.8 0 2.26.59 4.38 1.63 6.22L3.2 28.8l6.76-1.77a12.74 12.74 0 0 0 6.05 1.53h.01c7.07 0 12.8-5.73 12.8-12.8S23.08 3.2 16.01 3.2zm0 23.25h-.01a10.45 10.45 0 0 1-5.33-1.46l-.38-.23-4.01 1.05 1.07-3.91-.25-.4a10.44 10.44 0 1 1 8.91 4.95z"/>
    </svg>
  `;

  const mount = () => {
    if (!document.body || document.getElementById("whatsapp-float")) return;
    document.body.appendChild(link);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount, { once: true });
  } else {
    mount();
  }
})();
