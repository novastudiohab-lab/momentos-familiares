/* ============================================================
   NOVA STUDIO - INTERACCIONES
   Sin librerías externas.
   ============================================================ */

(() => {
  const config = window.NOVA_CONFIG || {};
  const suppliedNumber = String(config.whatsappNumber || "").replace(/\D/g, "");
  // El número debe conservar código de Cuba (+53) y ocho dígitos nacionales.
  const whatsapp = /^53\d{8}$/.test(suppliedNumber) ? suppliedNumber : "";

  // ---------- Año automático ----------
  const year = document.querySelector("#year");
  if (year) year.textContent = new Date().getFullYear();

  // ---------- Menú móvil ----------
  const menuButton = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".nav");

  if (menuButton && nav) {
    menuButton.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      menuButton.setAttribute("aria-expanded", String(open));
    });

    const closeMenu = () => {
      nav.classList.remove("is-open");
      menuButton.setAttribute("aria-expanded", "false");
      menuButton.setAttribute("aria-label", "Abrir menú de navegación");
    };
    menuButton.addEventListener("click", () => {
      menuButton.setAttribute("aria-label", nav.classList.contains("is-open") ? "Cerrar menú de navegación" : "Abrir menú de navegación");
    });
    nav.querySelectorAll("a").forEach(link => link.addEventListener("click", closeMenu));
    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && nav.classList.contains("is-open")) {
        closeMenu();
        menuButton.focus();
      }
    });
    document.addEventListener("click", event => {
      if (nav.classList.contains("is-open") && !event.target.closest(".site-header")) closeMenu();
    });
    window.addEventListener("resize", () => {
      if (window.innerWidth >= 1180) closeMenu();
    });
  }

  // ---------- WhatsApp ----------
  const buildWhatsappUrl = (message) => {
    if (!whatsapp) return null;
    return `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`;
  };

  document.querySelectorAll(".js-wa").forEach(link => {
    const message = link.dataset.waMessage || "Hola Nova Studio 👋 Me gustaría recibir información.";

    link.addEventListener("click", (event) => {
      const url = buildWhatsappUrl(message);

      if (!url) {
        event.preventDefault();
        // Si el WhatsApp no está configurado, prepara el formulario
        // con el paquete o servicio consultado; nunca usa números ficticios.
        const service = link.dataset.service || "";
        const session = link.dataset.session || "";
        const sessionInput = document.querySelector("#sesion");
        if (session && sessionInput && [...sessionInput.options].some(option => option.value === session)) {
          sessionInput.value = session;
        }
        if (service) {
          const packageInput = document.querySelector("#paquete");
          const serviceInput = document.querySelector("#sesion");
          for (const select of [packageInput, serviceInput]) {
            if (select && [...select.options].some(option => option.value === service)) {
              select.value = service;
            }
          }
        }
        document.querySelector("#reservar")?.scrollIntoView({ behavior: "smooth" });

        const status = document.querySelector("#form-status");
        if (status) {
          status.textContent = "WhatsApp pendiente de configurar: añade el número real en js/config.js para habilitar las consultas.";
          status.classList.add("is-error");
        }
        return;
      }

      event.preventDefault();
      window.open(url, "_blank", "noopener,noreferrer");
    });
  });

  const fab = document.querySelector("#whatsapp-fab");
  if (fab && whatsapp) fab.classList.add("is-ready");

  // Mantiene coherente el tipo de sesión con la oferta seleccionada.
  const sessionSelect = document.querySelector("#sesion");
  const packageSelect = document.querySelector("#paquete");
  if (sessionSelect && packageSelect) {
    sessionSelect.addEventListener("change", () => {
      const selectedPackage = packageSelect.value;
      if (!selectedPackage) return;
      const maternityPackage = selectedPackage.startsWith("Maternidad ");
      const generalPackage = selectedPackage.startsWith("Oferta ");
      const generalSessions = ["Infantil o familiar (por definir)", "Infantil", "Familiar", "Cumpleaños"];
      const incompatible = (maternityPackage && sessionSelect.value !== "Maternidad") ||
        (generalPackage && !generalSessions.includes(sessionSelect.value));
      if (incompatible) packageSelect.value = "";
    });
    packageSelect.addEventListener("change", () => {
      if (packageSelect.value.startsWith("Maternidad ")) {
        sessionSelect.value = "Maternidad";
      } else if (packageSelect.value.startsWith("Oferta ")) {
        const generalSessions = ["Infantil o familiar (por definir)", "Infantil", "Familiar", "Cumpleaños"];
        if (!generalSessions.includes(sessionSelect.value)) {
          sessionSelect.value = "Infantil o familiar (por definir)";
        }
      }
    });
  }

  // ---------- Formulario -> WhatsApp ----------
  const form = document.querySelector("#lead-form");
  const formStatus = document.querySelector("#form-status");

  if (form) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const data = new FormData(form);
      // Los datos únicamente se codifican en un enlace a WhatsApp, nunca se
      // insertan como HTML ni se envían a un servidor propio.
      const cleanText = (value, limit) => String(value || "")
        .replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, limit);
      const nombre = cleanText(data.get("nombre"), 80);
      const sesion = cleanText(data.get("sesion"), 100);
      const paquete = cleanText(data.get("paquete"), 100);
      const detalle = cleanText(data.get("detalle"), 180);
      const fecha = cleanText(data.get("fecha"), 12);

      const lines = [
        "Hola Nova Studio 👋",
        `Soy ${nombre}.`,
        `Estoy interesada/o en: ${sesion}.`,
      ];

      if (paquete) lines.push(`Oferta de interés: ${paquete}.`);
      if (detalle) lines.push(`Edad / ocasión: ${detalle}.`);
      if (fecha) lines.push(`Fecha aproximada: ${fecha}.`);

      lines.push("Quisiera consultar disponibilidad y conocer las opciones disponibles.");

      const url = buildWhatsappUrl(lines.join("\n"));

      if (!url) {
        if (formStatus) {
          formStatus.textContent = "Falta configurar el número de WhatsApp en js/config.js.";
          formStatus.classList.add("is-error");
        }
        return;
      }

      if (formStatus) {
        formStatus.textContent = "Abriendo WhatsApp…";
        formStatus.classList.remove("is-error");
      }

      window.open(url, "_blank", "noopener,noreferrer");
    });
  }

  // ---------- Redes sociales ----------
  const instagram = document.querySelector("#instagram-link");
  const facebook = document.querySelector("#facebook-link");

  // Evita protocolos inseguros e inyecciones de enlaces javascript: en config.
  const safeSocialUrl = (candidate, domain) => {
    try {
      const url = new URL(String(candidate || ""));
      const host = url.hostname.toLowerCase();
      return url.protocol === "https:" && (host === domain || host === `www.${domain}`)
        ? url.href : null;
    } catch (_) { return null; }
  };

  for (const [element, candidate, domain] of [
    [instagram, config.instagramUrl, "instagram.com"],
    [facebook, config.facebookUrl, "facebook.com"]
  ]) {
    if (!element) continue;
    const href = safeSocialUrl(candidate, domain);
    if (href) element.href = href;
    else element.hidden = true;
  }

  // ---------- GALERÍA REUTILIZABLE / MANIFIESTO ----------
  // Edita únicamente js/gallery-data.js; nunca concatenamos HTML ni ejecutamos
  // texto de un archivo. Se admiten solo rutas internas de imágenes .webp.
  const gallery = document.querySelector("#galeria-fotos");
  const photos = Array.isArray(window.NOVA_GALLERY) ? window.NOVA_GALLERY : [];
  const pathOk = /^[a-zA-Z0-9_-]+\.webp$/;
  const shapes = { panoramica: "gallery__item--wide", vertical: "gallery__item--tall", natural: "gallery__item--natural" };
  if (gallery) {
    for (const photo of photos) {
      if (!photo || typeof photo.archivo !== "string" || !pathOk.test(photo.archivo)) continue;
      const alt = String(photo.descripcion || "Fotografía de Nova Studio").slice(0, 180);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "gallery__item " + (shapes[photo.formato] || shapes.panoramica);
      button.setAttribute("aria-label", "Ampliar fotografía: " + alt);
      const image = document.createElement("img");
      image.src = "assets/fotos/" + photo.archivo;
      image.alt = alt;
      image.loading = "lazy";
      image.decoding = "async";
      const focus = Number(photo.enfoque);
      if (Number.isFinite(focus)) {
        // Solo coordenada CSS numérica saneada; nunca se añade HTML.
        image.style.objectPosition = "center " + Math.min(100, Math.max(0, focus)) + "%";
      }
      button.appendChild(image);
      gallery.appendChild(button);
    }
  }

  // ---------- Lightbox galería ----------
  const dialog = document.querySelector("#lightbox");
  const dialogImage = dialog?.querySelector("img");
  const closeButton = dialog?.querySelector(".lightbox__close");

  if (dialog && dialogImage) {
    let lastGalleryButton = null;
    document.querySelectorAll(".gallery__item").forEach(item => {
      item.addEventListener("click", () => {
        const img = item.querySelector("img");
        if (!img) return;
        lastGalleryButton = item;

        dialogImage.src = img.src;
        dialogImage.alt = img.alt;

        if (typeof dialog.showModal === "function") {
          dialog.showModal();
          closeButton?.focus({ preventScroll: true });
        }
      });
    });

    closeButton?.addEventListener("click", () => dialog.close());
    dialog.addEventListener("close", () => {
      lastGalleryButton?.focus({ preventScroll: true });
    });

    dialog.addEventListener("click", (event) => {
      const rect = dialog.getBoundingClientRect();
      const outside =
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom;

      if (outside) dialog.close();
    });
  }
})();
