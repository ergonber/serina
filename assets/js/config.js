/*
 * Configuración de Serina Skin Care.
 * Número de WhatsApp de Serina en formato internacional.
 * Debe ir sin "+", sin espacios ni guiones.
 */
window.SERINA_CONFIG = {
  whatsapp: "59178302116",
  instagram: "",
  facebook: "",
  tiktok: "",
  email: "",
  city: "Cochabamba, Bolivia",
  address: "Av. Humboldt #234, Oficinas Liberland, Cochabamba, Bolivia",
  phoneDisplay: "+591 783 02116",
  domain: "https://serina.bo",
  currency: "Bs.",
  // QR de pago configurado. Si cambia, reemplaza qr-mercantil.png y mantén qrReady en true.
  qrReady: true,
  qrImage: "assets/img/pago/qr-mercantil.png",
  // Ajusta aquí precios y nombres cuando cambien.
  products: [
    {
      id: "facial500",
      name: "Crema facial con sebo de res purificado 500 ml",
      displayName: "Crema facial con sebo de res",
      shortName: "Facial 500 ml",
      size: "500 ml",
      tag: "Facial",
      meta: "Hidratante · Nutritiva",
      price: 100,
      image: "assets/img/products/facial-750.webp"
    },
    {
      id: "facial250",
      name: "Crema facial con sebo de res purificado 250 ml",
      displayName: "Crema facial con sebo de res",
      shortName: "Facial 250 ml",
      size: "250 ml",
      tag: "Facial · 250 ml",
      meta: "Bote negro · Formato compacto",
      price: 100,
      image: "assets/img/products/facial-250-750.webp"
    },
    {
      id: "corporal500",
      name: "Crema corporal 500 ml",
      displayName: "Crema corporal",
      shortName: "Corporal 500 ml",
      size: "500 ml",
      tag: "Corporal",
      meta: "Hidratante · Nutritiva",
      price: 60,
      image: "assets/img/products/corporal-750.webp"
    },
    {
      id: "atopic500",
      name: "Crema facial para piel atópica 500 ml",
      displayName: "Crema facial para piel atópica",
      shortName: "Atópica 500 ml",
      size: "500 ml",
      tag: "Piel sensible",
      meta: "Calmante · Cuidado diario",
      price: 160,
      image: "assets/img/products/atopic-750.webp"
    }
  ]
};
