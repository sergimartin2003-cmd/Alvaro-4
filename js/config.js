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
  SUPABASE_URL: "https://dazwhishyhlxgndevizr.supabase.co",
  // Clave PÚBLICA (anon). Es segura en el navegador: la seguridad real la dan
  // las políticas RLS. NUNCA pongas aquí la clave secreta / service_role.
  SUPABASE_ANON_KEY:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRhendoaXNoeWhseGduZGV2aXpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ4NDU2OTgsImV4cCI6MjEwMDQyMTY5OH0.gTWFFbs7kmFJ4SdQ-o7oQUdk4n0G9GuwrndCHQ7o-xc",

  // Nombre del bucket de Storage donde se guardan las fotos.
  // (Lo crea el script supabase/schema.sql)
  STORAGE_BUCKET: "product-images"
};

/* ============================================================
   AJUSTES VISUALES DE LA MARCA
   ============================================================ */
window.SITE_CONFIG = {
  brand: "gtshop",
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
  "Zapas",
  "Accesorios",
  "Relojes",
  "Bolsos",
  "Tecnología",
  "Hogar",
  "Otros"
];
