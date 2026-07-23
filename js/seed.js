/* ============================================================
   CONFIGURACIÓN DEL SITIO
   Cambia estos valores para personalizar tu web.
   ============================================================ */
window.SITE_CONFIG = {
  brand: "Hipopick",                 // Nombre de tu marca (arriba a la izquierda)
  tagline: "Encuentra tus productos con fotos reales",
  currency: "€",                     // Símbolo de moneda por defecto
  buyLabel: "Comprar ahora",         // Texto del botón de compra
  accent: "#6C5CE7",                 // Color principal (acento)
  accent2: "#a06bff",                // Color secundario del degradado
  // 🔒 Contraseña del panel de administración (/admin.html).
  // Solo quien la conozca puede entrar a subir productos.
  // CÁMBIALA por la tuya. Si la dejas vacía (""), el panel no pedirá contraseña.
  // Nota: es una protección del lado del navegador, sencilla, no cifrado militar.
  adminPasscode: "admin1234"
};

/* ============================================================
   PRODUCTOS INICIALES (semilla)
   Puedes editar esta lista a mano, o usar el panel /admin.html
   (que guarda en el navegador y permite exportar/importar).
   Campos de cada producto:
     id, name, price, currency, category, badge,
     description, buyLink, images[], rating, createdAt
   ============================================================ */
// La web empieza VACÍA. Tú añades tus productos desde el panel /admin.html.
window.SEED_PRODUCTS = [];

/* Categorías sugeridas que aparecen en el panel para clasificar productos.
   Puedes añadir/quitar las que quieras (también puedes escribir una nueva
   categoría al vuelo desde el formulario). */
window.SUGGESTED_CATEGORIES = [
  "Ropa",
  "Calzado",
  "Accesorios",
  "Relojes",
  "Bolsos",
  "Tecnología",
  "Hogar",
  "Otros"
];
