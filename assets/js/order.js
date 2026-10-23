(function () {
  "use strict";

  var config = window.SERINA_CONFIG || {};
  var products = Array.isArray(config.products) ? config.products : [];
  var currency = config.currency || "Bs.";
  var whatsapp = String(config.whatsapp || "59178302116").replace(/\D/g, "");
  var storageKey = "serina-order-v1";
  var maxQty = 999;
  var maxFileBytes = 15 * 1024 * 1024;

  var dinero = new Intl.NumberFormat("es-BO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });

  var cart = {};
  var selectedFile = null;
  var previewUrl = null;

  var productsBox = document.getElementById("orderProducts");
  var summaryItems = document.getElementById("summaryItems");
  var summaryEmpty = document.getElementById("summaryEmpty");
  var summaryCount = document.getElementById("summaryCount");
  var summaryTotal = document.getElementById("summaryTotal");
  var summaryNote = document.getElementById("summaryNote");
  var payButton = document.getElementById("payButton");
  var dialog = document.getElementById("paymentDialog");
  var closePayment = document.getElementById("closePayment");
  var paymentAmount = document.getElementById("paymentAmount");
  var qrImage = document.getElementById("qrImage");
  var qrNotice = document.getElementById("qrNotice");
  var copyAmount = document.getElementById("copyAmount");
  var receiptInput = document.getElementById("receipt");
  var receiptPreview = document.getElementById("receiptPreview");
  var sendPayment = document.getElementById("sendPayment");
  var sendDetail = document.getElementById("sendDetail");
  var paymentStatus = document.getElementById("paymentStatus");

  function money(value) {
    return currency + " " + dinero.format(value);
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (char) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[char];
    });
  }

  function findProduct(id) {
    for (var i = 0; i < products.length; i++) {
      if (products[i].id === id) return products[i];
    }
    return null;
  }

  function getQty(id) {
    return cart[id] || 0;
  }

  function lineTotal(product) {
    return product.price * getQty(product.id);
  }

  function getTotal() {
    return products.reduce(function (sum, product) {
      return sum + lineTotal(product);
    }, 0);
  }

  function getCount() {
    return products.reduce(function (sum, product) {
      return sum + getQty(product.id);
    }, 0);
  }

  function getLines() {
    return products
      .filter(function (product) {
        return getQty(product.id) > 0;
      })
      .map(function (product) {
        return {
          product: product,
          qty: getQty(product.id),
          total: lineTotal(product)
        };
      });
  }

  function loadCart() {
    var stored = {};
    try {
      stored = JSON.parse(window.localStorage.getItem(storageKey)) || {};
    } catch (error) {
      stored = {};
    }

    products.forEach(function (product) {
      var qty = parseInt(stored[product.id], 10);
      if (isFinite(qty) && qty > 0) {
        cart[product.id] = Math.min(qty, maxQty);
      }
    });
  }

  function saveCart() {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(cart));
    } catch (error) {
      /* El pedido sigue funcionando en esta sesión. */
    }
  }

  function addFromQuery() {
    var params = new URLSearchParams(window.location.search);
    var add = params.get("add");
    if (!add || !findProduct(add)) return;

    cart[add] = Math.min(getQty(add) + 1, maxQty);
    saveCart();

    try {
      window.history.replaceState(null, "", window.location.pathname + window.location.hash);
    } catch (error) {
      /* Sin historial, no pasa nada. */
    }
  }

  function orderText() {
    var lines = getLines().map(function (line) {
      return "• " + line.product.name + " x" + line.qty + " — " + money(line.total);
    });
    return "Pedido:\n" + lines.join("\n") + "\n\nTotal: " + money(getTotal());
  }

  function detailMessage() {
    return "Hola Serina, este es el detalle de mi pedido:\n\n" + orderText();
  }

  function paymentMessage() {
    return "Hola Serina, envié mi pago.\n\n" + orderText() + "\n\nAdjunto mi comprobante.";
  }

  function whatsappUrl(message) {
    return "https://wa.me/" + whatsapp + "?text=" + encodeURIComponent(message);
  }

  function setStatus(message, ok) {
    if (!paymentStatus) return;
    paymentStatus.textContent = message || "";
    paymentStatus.classList.toggle("is-ok", Boolean(ok));
  }

  function renderProducts() {
    if (!productsBox) return;

    if (!products.length) {
      productsBox.innerHTML = '<p class="order-noscript">No hay productos disponibles en este momento. Escríbenos por WhatsApp.</p>';
      return;
    }

    productsBox.innerHTML = products.map(function (product) {
      var qty = getQty(product.id);
      return (
        '<article class="order-item" data-id="' + escapeHtml(product.id) + '">' +
          '<div class="order-thumb">' +
            '<img src="' + escapeHtml(product.image) + '" width="200" height="240" alt="' + escapeHtml(product.name) + '" loading="lazy" decoding="async" draggable="false">' +
          "</div>" +
          '<div class="order-info">' +
            '<span class="order-tag">' + escapeHtml(product.tag || "") + "</span>" +
            "<h2>" + escapeHtml(product.displayName || product.name) + "</h2>" +
            "<p>" + escapeHtml((product.size ? product.size + " · " : "") + (product.meta || "")) + "</p>" +
            '<span class="order-price">' + money(product.price) + " c/u</span>" +
          "</div>" +
          '<div class="qty" role="group" aria-label="Cantidad de ' + escapeHtml(product.name) + '">' +
            '<button class="qty-minus" type="button" aria-label="Quitar una unidad de ' + escapeHtml(product.name) + '"' + (qty === 0 ? " disabled" : "") + '>−</button>' +
            '<input type="number" min="0" max="' + maxQty + '" step="1" inputmode="numeric" value="' + qty + '" aria-label="Cantidad de ' + escapeHtml(product.name) + '">' +
            '<button class="qty-plus" type="button" aria-label="Agregar una unidad de ' + escapeHtml(product.name) + '">+</button>' +
          "</div>" +
        "</article>"
      );
    }).join("");

    productsBox.querySelectorAll(".order-item").forEach(bindRow);
  }

  function bindRow(row) {
    var id = row.getAttribute("data-id");
    var input = row.querySelector(".qty input");
    var minus = row.querySelector(".qty-minus");
    var plus = row.querySelector(".qty-plus");

    if (!id || !input || !minus || !plus) return;

    minus.addEventListener("click", function () {
      setQuantity(id, getQty(id) - 1);
    });

    plus.addEventListener("click", function () {
      setQuantity(id, getQty(id) + 1);
    });

    input.addEventListener("input", function () {
      var value = parseInt(input.value, 10);
      if (!isFinite(value) || value < 0) return;
      value = Math.min(value, maxQty);
      if (value === 0) {
        delete cart[id];
      } else {
        cart[id] = value;
      }
      saveCart();
      minus.disabled = value === 0;
      renderSummary();
    });

    input.addEventListener("blur", function () {
      var value = parseInt(input.value, 10);
      setQuantity(id, isFinite(value) ? value : 0);
    });
  }

  function setQuantity(id, value) {
    var qty = parseInt(value, 10);
    if (!isFinite(qty) || qty < 0) qty = 0;
    qty = Math.min(qty, maxQty);

    if (qty === 0) {
      delete cart[id];
    } else {
      cart[id] = qty;
    }

    saveCart();

    var row = productsBox ? productsBox.querySelector('[data-id="' + id + '"]') : null;
    if (row) {
      var input = row.querySelector(".qty input");
      var minus = row.querySelector(".qty-minus");
      if (input) input.value = qty;
      if (minus) minus.disabled = qty === 0;
    }

    renderSummary();
  }

  function renderSummary() {
    var lines = getLines();
    var total = getTotal();
    var count = getCount();

    if (summaryItems) {
      summaryItems.innerHTML = lines.map(function (line) {
        return (
          '<div class="summary-line">' +
            "<span>" + escapeHtml(line.product.shortName || line.product.name) + " <em>×" + line.qty + "</em></span>" +
            "<strong>" + money(line.total) + "</strong>" +
          "</div>"
        );
      }).join("");
    }

    if (summaryEmpty) summaryEmpty.hidden = lines.length > 0;
    if (summaryCount) summaryCount.textContent = count + (count === 1 ? " producto" : " productos");
    if (summaryTotal) summaryTotal.textContent = money(total);

    if (payButton) {
      payButton.disabled = total <= 0;
      payButton.textContent = total > 0 ? "Pagar " + money(total) : "Pagar";
    }

    if (summaryNote) {
      summaryNote.textContent = total > 0
        ? "Pago con QR. Al final envía tu comprobante por WhatsApp."
        : "Agrega al menos 1 producto para continuar.";
    }

    if (sendDetail) {
      if (total > 0) {
        sendDetail.href = whatsappUrl(detailMessage());
      } else {
        sendDetail.href = "#";
      }
    }
  }

  function updatePayment() {
    var total = getTotal();
    if (paymentAmount) paymentAmount.textContent = money(total);

    if (qrImage) {
      qrImage.src = config.qrImage || "assets/img/pago/qr-pago.png";
      qrImage.alt = config.qrReady === false
        ? "QR de pago pendiente de configurar"
        : "QR de pago de Serina";
    }

    if (qrNotice) {
      qrNotice.hidden = config.qrReady !== false;
    }

    if (sendDetail) {
      sendDetail.href = whatsappUrl(detailMessage());
    }

    if (sendPayment) {
      sendPayment.disabled = !selectedFile;
    }
  }

  function openDialog() {
    if (!dialog || getTotal() <= 0) return;
    updatePayment();
    setStatus("");
    document.body.classList.add("payment-open");

    if (typeof dialog.showModal === "function") {
      dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }
  }

  function closeDialog() {
    if (!dialog) return;
    document.body.classList.remove("payment-open");
    if (typeof dialog.close === "function") {
      dialog.close();
    } else {
      dialog.removeAttribute("open");
    }
  }

  function revokePreview() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      previewUrl = null;
    }
  }

  function clearReceipt(keepStatus) {
    revokePreview();
    selectedFile = null;

    if (receiptInput) receiptInput.value = "";
    if (receiptPreview) {
      receiptPreview.hidden = true;
      receiptPreview.innerHTML = "";
    }
    if (sendPayment) sendPayment.disabled = true;
    if (!keepStatus) setStatus("");
  }

  function showPreview(file) {
    if (!receiptPreview) return;

    revokePreview();
    receiptPreview.innerHTML = "";
    receiptPreview.hidden = false;

    var isImage = file.type.indexOf("image/") === 0;

    if (isImage) {
      var image = document.createElement("img");
      previewUrl = URL.createObjectURL(file);
      image.src = previewUrl;
      image.alt = "Vista previa del comprobante";
      receiptPreview.appendChild(image);
    } else {
      var badge = document.createElement("span");
      badge.className = "file-badge";
      badge.textContent = "PDF";
      receiptPreview.appendChild(badge);
    }

    var name = document.createElement("span");
    name.textContent = file.name;
    receiptPreview.appendChild(name);
  }

  function handleReceipt() {
    if (!receiptInput || !receiptInput.files || !receiptInput.files[0]) {
      clearReceipt();
      return;
    }

    var file = receiptInput.files[0];
    var isImage = file.type.indexOf("image/") === 0;
    var isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);

    if (!isImage && !isPdf) {
      clearReceipt(true);
      setStatus("Adjunta una imagen o un PDF de tu comprobante.", false);
      return;
    }

    if (file.size > maxFileBytes) {
      clearReceipt(true);
      setStatus("El comprobante supera los 15 MB. Intenta con un archivo más pequeño.", false);
      return;
    }

    selectedFile = file;
    showPreview(file);
    if (sendPayment) sendPayment.disabled = false;
    setStatus("Comprobante listo para enviar.", true);
  }

  function copyText(text, onSuccess, onError) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(onSuccess).catch(onError);
      return;
    }

    var field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.top = "-1000px";
    field.style.opacity = "0";
    document.body.appendChild(field);
    field.select();

    try {
      document.execCommand("copy");
      onSuccess();
    } catch (error) {
      onError();
    }

    document.body.removeChild(field);
  }

  function openWhatsApp(url, message) {
    window.open(url, "_blank", "noopener,noreferrer");
    setStatus(message || "Se abrió WhatsApp con el detalle. Adjunta tu comprobante en el chat. Si no se abrió, usa el enlace “Enviar solo el detalle”.", true);
  }

  function sendReceipt() {
    if (getTotal() <= 0) return;

    if (!selectedFile) {
      setStatus("Adjunta tu comprobante para enviarlo.", false);
      if (receiptInput) receiptInput.focus();
      return;
    }

    var message = paymentMessage();
    var href = whatsappUrl(message);
    var file = selectedFile;

    if (sendPayment) sendPayment.disabled = true;
    setStatus("Preparando el envío…", true);

    var canShareFiles = false;
    try {
      canShareFiles = Boolean(navigator.canShare && navigator.canShare({ files: [file] }));
    } catch (error) {
      canShareFiles = false;
    }

    if (canShareFiles && typeof navigator.share === "function") {
      navigator.share({
        files: [file],
        text: message,
        title: "Comprobante Serina"
      }).then(function () {
        setStatus("Se abrió el menú para compartir. Elige WhatsApp y envía tu comprobante.", true);
        if (sendPayment) sendPayment.disabled = false;
      }).catch(function (error) {
        if (error && error.name === "AbortError") {
          setStatus("No se envió nada. Puedes intentarlo de nuevo.", false);
          if (sendPayment) sendPayment.disabled = false;
        } else {
          openWhatsApp(href, "No se pudo compartir el archivo automáticamente. Se abrió WhatsApp con el detalle: adjunta tu comprobante en el chat.");
          if (sendPayment) sendPayment.disabled = false;
        }
      });
    } else {
      openWhatsApp(href);
      if (sendPayment) sendPayment.disabled = false;
    }
  }

  function bindDialog() {
    if (!dialog) return;

    if (payButton) {
      payButton.addEventListener("click", openDialog);
    }

    if (closePayment) {
      closePayment.addEventListener("click", closeDialog);
    }

    dialog.addEventListener("click", function (event) {
      if (event.target === dialog) closeDialog();
    });

    dialog.addEventListener("close", function () {
      document.body.classList.remove("payment-open");
    });

    if (copyAmount) {
      copyAmount.addEventListener("click", function () {
        var text = money(getTotal());
        copyText(
          text,
          function () {
            var original = copyAmount.textContent;
            copyAmount.textContent = "Monto copiado";
            setStatus("Monto copiado: " + text, true);
            window.setTimeout(function () {
              copyAmount.textContent = original;
            }, 2200);
          },
          function () {
            setStatus("No se pudo copiar el monto. Escríbelo manualmente: " + text, false);
          }
        );
      });
    }

    if (receiptInput) {
      receiptInput.addEventListener("change", handleReceipt);
    }

    if (sendPayment) {
      sendPayment.addEventListener("click", sendReceipt);
    }
  }

  loadCart();
  addFromQuery();
  renderProducts();
  renderSummary();
  bindDialog();
})();
