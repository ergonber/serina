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
    function isInteractive(target) {
      return target && target.closest && target.closest("input, textarea, select, button, a, label");
    }

    zone.addEventListener("contextmenu", function (event) {
      if (isInteractive(event.target)) return;
      event.preventDefault();
    });

    zone.addEventListener("dragstart", function (event) {
      if (isInteractive(event.target)) return;
      event.preventDefault();
    });

    zone.addEventListener("selectstart", function (event) {
      if (isInteractive(event.target)) return;
      event.preventDefault();
    });
  });


  document.querySelectorAll("[data-carousel]").forEach(function (carousel) {
    var viewport = carousel.querySelector(".carousel-viewport");
    var track = carousel.querySelector(".carousel-track");
    var slides = Array.prototype.slice.call(carousel.querySelectorAll(".carousel-slide"));
    var dots = Array.prototype.slice.call(carousel.querySelectorAll(".carousel-dot"));
    var count = carousel.querySelector(".carousel-count");
    var playBtn = carousel.querySelector(".carousel-play");
    var prevBtn = carousel.querySelector(".carousel-prev");
    var nextBtn = carousel.querySelector(".carousel-next");
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var playing = !reduceMotion;
    var index = 0;
    var timer = null;
    var startX = null;

    if (!viewport || !track || !slides.length) return;

    function updateUi() {
      slides.forEach(function (slide, i) {
        slide.classList.toggle("is-active", i === index);
        slide.setAttribute("aria-hidden", i === index ? "false" : "true");
      });

      dots.forEach(function (dot, i) {
        dot.classList.toggle("is-active", i === index);
        if (i === index) {
          dot.setAttribute("aria-current", "true");
        } else {
          dot.removeAttribute("aria-current");
        }
      });

      if (count) count.textContent = (index + 1) + " / " + slides.length;
    }

    function updatePlayButton() {
      if (!playBtn) return;
      playBtn.setAttribute("aria-label", playing ? "Pausar carrusel" : "Reproducir carrusel");
      var pauseIcon = playBtn.querySelector(".icon-pause");
      var playIcon = playBtn.querySelector(".icon-play");
      if (pauseIcon) pauseIcon.hidden = !playing;
      if (playIcon) playIcon.hidden = playing;
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    function start() {
      if (!playing) return;
      stop();
      timer = window.setInterval(function () {
        go(index + 1);
      }, 6500);
    }

    function go(nextIndex) {
      index = ((nextIndex % slides.length) + slides.length) % slides.length;
      track.style.transform = "translateX(-" + index * 100 + "%)";
      updateUi();
    }

    function goManual(nextIndex) {
      go(nextIndex);
      if (playing) {
        stop();
        start();
      }
    }

    if (prevBtn) {
      prevBtn.addEventListener("click", function () {
        goManual(index - 1);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", function () {
        goManual(index + 1);
      });
    }

    dots.forEach(function (dot, i) {
      dot.addEventListener("click", function () {
        goManual(i);
      });
    });

    if (playBtn) {
      playBtn.addEventListener("click", function () {
        playing = !playing;
        updatePlayButton();
        if (playing) {
          start();
        } else {
          stop();
        }
      });
    }

    carousel.addEventListener("mouseenter", stop);
    carousel.addEventListener("mouseleave", start);
    carousel.addEventListener("focusin", stop);
    carousel.addEventListener("focusout", function (event) {
      if (!carousel.contains(event.relatedTarget)) start();
    });

    carousel.addEventListener("keydown", function (event) {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goManual(index - 1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        goManual(index + 1);
      }
    });

    viewport.addEventListener("pointerdown", function (event) {
      if (event.target.closest("button")) return;
      startX = event.clientX;
    });

    viewport.addEventListener("pointerup", function (event) {
      if (startX === null) return;
      var distance = event.clientX - startX;
      startX = null;
      if (Math.abs(distance) > 42) {
        goManual(index + (distance < 0 ? 1 : -1));
      }
    });

    viewport.addEventListener("pointercancel", function () {
      startX = null;
    });

    updateUi();
    updatePlayButton();
    start();
  });

  document.querySelectorAll("img").forEach(function (img) {
    img.setAttribute("draggable", "false");
  });
})();
