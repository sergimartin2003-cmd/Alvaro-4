/* ============================================================
   CONFIGURACIÓN
   ------------------------------------------------------------
   1) Pega aquí los datos de tu proyecto de Supabase.
      Los encuentras en: Supabase → Project Settings → API
        - Project URL      → SUPABASE_URL
        - anon public key  → SUPABASE_ANON_KEY
      (La clave "anon public" es segura para el navegador; la
       seguridad real la dan las políticas RLS de la base de datos.)

   2) Mientras estos valores tengan el texto de ejemplo "TU-...",
      la web funciona en MODO DEMO (se guarda en el navegador).
      Al poner tus datos reales, pasa a guardar TODO en Supabase.
   ============================================================ */
window.APP_CONFIG = {
  SUPABASE_URL: "https://TU-PROYECTO.supabase.co",
  SUPABASE_ANON_KEY: "TU-ANON-PUBLIC-KEY",

  // Nombre del bucket de Storage donde se guardan las fotos.
  // (Lo crea el script supabase/schema.sql)
  STORAGE_BUCKET: "product-images"
};

/* ============================================================
   AJUSTES VISUALES DE LA MARCA
   ============================================================ */
window.SITE_CONFIG = {
  brand: "Hipopick",
  tagline: "Encuentra tus productos con fotos reales",
  currency: "€",
  buyLabel: "Comprar ahora",
  accent: "#6C5CE7",
  accent2: "#a06bff",
  // Contraseña SOLO del modo demo (sin Supabase). Con Supabase se usa
  // login por email + contraseña, así que esto se ignora.
  demoPasscode: "admin1234"
};

/* Categorías sugeridas en el panel para clasificar productos.
   También puedes escribir una nueva al vuelo en el formulario. */
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
