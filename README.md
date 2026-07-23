# Hipopick — Catálogo de productos con Supabase

Web tipo catálogo (estilo *hipopick.com*) con un **panel privado** donde solo tú,
tras iniciar sesión, subes productos con **fotos, precios, detalles y categorías**.
Todo se guarda en una **base de datos Supabase** (y las fotos en **Supabase Storage**),
así que se ve **igual desde cualquier dispositivo** y para cualquier visitante.

Es un sitio **estático** (HTML/CSS/JS, sin build ni Node en el servidor): se
despliega en cualquier hosting y habla con Supabase desde el navegador.

> **Modo demo:** mientras no configures Supabase, la web funciona guardando en el
> navegador (localStorage) para que puedas probarla. Verás un aviso amarillo.
> Al poner tus credenciales de Supabase, pasa a guardar todo en la base de datos.

---

## 🚀 Puesta en marcha con Supabase (una sola vez)

### 1) Crea un proyecto en Supabase
- Entra en <https://supabase.com>, crea una cuenta y un **New project** (plan gratis vale).
- Apunta la contraseña de la base de datos que te pida (no la necesitarás para la web).

### 2) Crea la tabla, el bucket de fotos y las reglas de seguridad
- En Supabase: **SQL Editor → New query**.
- Copia y pega **todo** el contenido de [`supabase/schema.sql`](supabase/schema.sql) y pulsa **Run**.
- Esto crea la tabla `products`, el bucket `product-images` y las políticas RLS
  (lectura pública, escritura solo para ti tras iniciar sesión).

### 3) Crea tu usuario administrador
- **Authentication → Users → Add user** → pon tu **email** y **contraseña**.
  Ese será el único que pueda entrar al panel a subir productos.
- Recomendado: **Authentication → Providers → Email** y desactiva *Enable Sign Ups*
  para que nadie más pueda registrarse.

### 4) Conecta la web con tu proyecto
- En Supabase: **Project Settings → API** y copia:
  - **Project URL**
  - **anon public** key
- Pégalas en [`js/config.js`](js/config.js):

```js
window.APP_CONFIG = {
  SUPABASE_URL: "https://xxxxxxxx.supabase.co",   // tu Project URL
  SUPABASE_ANON_KEY: "eyJhbGciOi...",             // tu anon public key
  STORAGE_BUCKET: "product-images"
};
```

> La clave **anon public** es segura para el navegador: la seguridad real la dan
> las políticas RLS que ya creaste. (Nunca pongas la `service_role` key aquí.)

¡Listo! Abre `admin.html`, inicia sesión con tu email y contraseña, y sube productos.

---

## 🖥️ Cómo se usa

- **`index.html`** — la tienda: rejilla de productos, buscador, filtros por
  categoría, ficha de producto con galería de fotos y favoritos.
- **`admin.html`** — el panel privado (login). Desde ahí:
  - Añades productos: nombre, precio, moneda, **categoría**, etiqueta, valoración,
    descripción y enlace de compra.
  - **Subes fotos** (varias, arrastrando o eligiendo) → se guardan en Supabase Storage.
    También puedes pegar la URL de una imagen.
  - Editas / eliminas productos.
  - Filtras por categoría y exportas una copia de seguridad en JSON.

## 🗂️ Clasificar productos

El campo **Categoría** del formulario clasifica cada producto. Puedes elegir una
sugerida o **escribir una nueva**. En la tienda, las categorías aparecen
automáticamente como filtros arriba. Las sugeridas se editan en `js/config.js`
(`SUGGESTED_CATEGORIES`).

## 🎨 Personalizar la marca

En `js/config.js` → `window.SITE_CONFIG`:

```js
brand: "Hipopick",   // nombre que aparece arriba
tagline: "…",        // frase del banner
currency: "€",       // moneda por defecto
accent: "#6C5CE7",   // color principal
```

## ☁️ Subir a un hosting

Al ser archivos estáticos, sube toda la carpeta a **Hostinger, Netlify, Vercel,
GitHub Pages**, etc. No hay build. Solo asegúrate de haber rellenado `js/config.js`.

## 📁 Estructura

```
index.html            La tienda (pública)
admin.html            El panel privado (login Supabase)
css/styles.css        Estilos
js/config.js          Tus credenciales de Supabase + ajustes de marca
js/store.js           Capa de datos (Supabase, con fallback a modo demo)
js/app.js             Lógica de la tienda
js/admin.js           Lógica del panel
js/vendor/supabase.js Librería oficial de Supabase (guardada en local)
supabase/schema.sql   Script para crear la base de datos y el Storage
```

## ❓ Preguntas frecuentes

- **¿Los productos se ven en todos los dispositivos?** Sí, una vez configurado
  Supabase: se guardan en la base de datos, no en el navegador.
- **¿Puede subir productos cualquiera?** No. Solo quien inicie sesión con el
  usuario que creaste. Los visitantes solo pueden ver.
- **¿Y las fotos?** Se guardan en Supabase Storage (bucket público de solo lectura;
  subir/borrar requiere estar autenticado).
- **¿Sale un aviso amarillo de "modo demo"?** Significa que aún no has puesto tus
  credenciales en `js/config.js`. Revisa el paso 4.
