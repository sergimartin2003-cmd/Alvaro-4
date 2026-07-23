# Hipopick — Catálogo de productos con panel de administración

Una web **vacía** tipo catálogo (estilo *hipopick.com*) donde **solo tú**, desde un
panel privado con contraseña, subes tus productos con fotos, detalles y los
**clasificas por categorías**. Todo funciona sin servidor ni base de datos:
son archivos estáticos (HTML/CSS/JS) listos para subir a cualquier hosting.

## 📁 Archivos

| Archivo | Qué es |
|---|---|
| `index.html` | La **tienda** pública: rejilla de productos, buscador, filtros por categoría, ficha de producto y favoritos. |
| `admin.html` | El **panel privado** (con contraseña) para añadir/editar/eliminar productos. |
| `js/seed.js` | **Configuración** (nombre de marca, colores, moneda y **contraseña**) + categorías sugeridas. |
| `js/store.js` | Lógica de datos (guardado en el navegador). |
| `js/app.js` | Lógica de la tienda. |
| `js/admin.js` | Lógica del panel. |
| `css/styles.css` | Estilos. |

## 🚀 Cómo probarla

Ábrela con un servidor local (recomendado) o directamente el archivo:

```bash
# Opción A: servidor local (recomendado)
cd Alvaro-4
python3 -m http.server 8080
# luego abre http://localhost:8080

# Opción B: doble clic en index.html (también funciona)
```

1. Abre `index.html` → verás la tienda **vacía**.
2. Pulsa **“+ Añadir productos”** (o abre `admin.html`).
3. Introduce la contraseña. Por defecto es **`admin1234`**.
4. Rellena el formulario (nombre, precio, **categoría**, fotos…) y **Guardar**.
5. Vuelve a la tienda: tu producto ya aparece, con su categoría como filtro.

## 🔒 Cambiar la contraseña del panel

Edita `js/seed.js` y cambia:

```js
adminPasscode: "admin1234"   // ← pon aquí TU contraseña
```

- Si la dejas vacía (`""`), el panel no pedirá contraseña.
- Es una protección sencilla del lado del navegador (suficiente para uso normal),
  no un sistema de login con servidor.

## 🎨 Personalizar la marca

En `js/seed.js`:

```js
brand: "Hipopick",     // nombre que aparece arriba
tagline: "…",          // frase del banner
currency: "€",         // moneda por defecto
accent: "#6C5CE7",     // color principal
```

## 🗂️ Clasificar productos

En el formulario del panel, el campo **Categoría** clasifica cada producto.
Puedes elegir una de las sugeridas o **escribir una nueva**. En la tienda,
las categorías aparecen automáticamente como filtros (chips) arriba.

Las categorías sugeridas se editan en `js/seed.js` (`SUGGESTED_CATEGORIES`).

## 💾 Dónde se guardan los productos (importante)

Los productos se guardan en el **navegador** (localStorage) del dispositivo donde
los añades. Esto significa:

- Se conservan aunque cierres la pestaña, en ese mismo navegador.
- **No** se comparten solos entre dispositivos ni con otros visitantes.

Para hacerlos permanentes / moverlos a otro sitio:

- En el panel, pulsa **⬇ Exportar** para descargar `productos.json` (copia de seguridad).
- Usa **⬆ Importar** para cargarlos en otro navegador/dispositivo.

> ¿Quieres que **todos los visitantes** vean los mismos productos sin importar el
> dispositivo? Eso necesita un **backend con base de datos**. Dímelo y te lo monto.

## ☁️ Subir a un hosting

Al ser archivos estáticos, sube toda la carpeta a cualquier hosting:
Hostinger, Netlify, Vercel, GitHub Pages, etc. No necesita build ni Node.
