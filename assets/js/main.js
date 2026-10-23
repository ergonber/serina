(function () {
  "use strict";

  document.documentElement.classList.add("js");

  var config = window.SERINA_CONFIG || {};
  var whatsapp = String(config.whatsapp || "").replace(/\D/g, "");
  var isPlaceholder = !whatsapp || whatsapp === "59100000000";
  var defaultMessage = "Hola Serina, quiero hacer un pedido.";

  function waUrl(message) {
    var number = isPlaceholder ? "59100000000" : whatsapp;
    return "https://wa.me/" + number + "?text=" + encodeURIComponent(message || defaultMessage);
  }

  document.querySelectorAll("[data-wa]").forEach(function (link) {
    var message = link.getAttribute("data-wa-msg") || defaultMessage;
    link.setAttribute("href", waUrl(message));
    link.setAttribute("target", "_blank");
    link.setAttribute("rel", "noopener noreferrer");
  });

  if (isPlaceholder) {
    console.warn("[Serina] Configura el número real de WhatsApp en assets/js/config.js antes de publicar.");
  }

  var socialMap = {
    instagram: config.instagram,
    facebook: config.facebook,
    tiktok: config.tiktok
  };

  Object.keys(socialMap).forEach(function (key) {
    var url = String(socialMap[key] || "").trim();
    document.querySelectorAll('[data-social="' + key + '"]').forEach(function (link) {
      if (url) {
        link.setAttribute("href", url);
        link.setAttribute("target", "_blank");
        link.setAttribute("rel", "noopener noreferrer");
        link.removeAttribute("hidden");
      } else {
        link.setAttribute("hidden", "");
      }
    });
  });

  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  var header = document.querySelector(".site-header");
  var menuToggle = document.querySelector(".menu-toggle");
  var nav = document.getElementById("nav");

  function onScroll() {
    if (!header) return;
    header.classList.toggle("scrolled", window.scrollY > 8);
  }

  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  function setMenu(open) {
    if (!menuToggle) return;
    document.body.classList.toggle("nav-open", open);
    menuToggle.setAttribute("aria-expanded", open ? "true" : "false");
    menuToggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");

    if (open && nav) {
      var first = nav.querySelector("a");
      if (first) {
        window.setTimeout(function () {
          first.focus({ preventScroll: true });
        }, 220);
      }
    }
  }

  if (menuToggle) {
    menuToggle.addEventListener("click", function () {
      setMenu(!document.body.classList.contains("nav-open"));
    });
  }

  if (nav) {
    nav.addEventListener("click", function (event) {
      if (event.target.closest("a")) setMenu(false);
    });
  }

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && document.body.classList.contains("nav-open")) {
      setMenu(false);
      if (menuToggle) menuToggle.focus();
    }
  });

  document.addEventListener("click", function (event) {
    if (!document.body.classList.contains("nav-open")) return;
    if (header && !header.contains(event.target)) setMenu(false);
  });

  var revealItems = document.querySelectorAll(".reveal");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function showAllReveal() {
    revealItems.forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  if (reduceMotion || !("IntersectionObserver" in window)) {
    showAllReveal();
  } else {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    revealItems.forEach(function (el) {
      observer.observe(el);
    });

    window.setTimeout(showAllReveal, 3500);
  }

  document.querySelectorAll(".faq-list details").forEach(function (detail) {
    detail.addEventListener("toggle", function () {
      if (!detail.open) return;
      document.querySelectorAll(".faq-list details[open]").forEach(function (other) {
        if (other !== detail) other.open = false;
      });
    });
  });

  document.querySelectorAll("[data-protect]").forEach(function (zone) {
    zone.addEventListener("contextmenu", function (event) {
      event.preventDefault();
    });

    zone.addEventListener("dragstart", function (event) {
      event.preventDefault();
    });

    zone.addEventListener("selectstart", function (event) {
      event.preventDefault();
    });
  });

  document.querySelectorAll("img").forEach(function (img) {
    img.setAttribute("draggable", "false");
  });
})();
