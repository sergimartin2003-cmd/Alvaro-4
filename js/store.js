/* ============================================================
   STORE: capa de datos compartida (localStorage)
   Usada por la tienda (app.js) y el panel admin (admin.js).
   ============================================================ */
(function () {
  const KEY_PRODUCTS = "hp_products";
  const KEY_FAVS = "hp_favs";
  const KEY_CONFIG = "hp_config";

  const defaultConfig = Object.assign(
    {
      brand: "Hipopick",
      tagline: "Encuentra tus productos con fotos reales",
      currency: "€",
      buyLabel: "Comprar ahora",
      accent: "#6C5CE7",
      accent2: "#a06bff",
      adminPasscode: ""
    },
    window.SITE_CONFIG || {}
  );

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }
  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error("No se pudo guardar (¿espacio lleno?)", e);
      alert(
        "No se pudo guardar. Puede que el almacenamiento esté lleno " +
          "(las imágenes grandes ocupan mucho). Usa imágenes más ligeras o enlaces (URL)."
      );
      return false;
    }
  }

  function uid() {
    return "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  function normalize(p) {
    // Compatibilidad: si viene "image" (string) lo pasamos a images[]
    let images = Array.isArray(p.images) ? p.images.slice() : [];
    if (!images.length && p.image) images = [p.image];
    return {
      id: p.id || uid(),
      name: (p.name || "").trim(),
      price: p.price === "" || p.price == null ? null : Number(p.price),
      currency: p.currency || defaultConfig.currency,
      category: (p.category || "Sin categoría").trim(),
      badge: (p.badge || "").trim(),
      description: (p.description || "").trim(),
      buyLink: (p.buyLink || "").trim(),
      images: images,
      rating: p.rating != null && p.rating !== "" ? Number(p.rating) : null,
      createdAt: p.createdAt || Date.now()
    };
  }

  const Store = {
    // ---------- Config ----------
    getConfig() {
      return Object.assign({}, defaultConfig, read(KEY_CONFIG, {}));
    },
    saveConfig(patch) {
      const merged = Object.assign({}, this.getConfig(), patch);
      write(KEY_CONFIG, merged);
      return merged;
    },

    // ---------- Productos ----------
    getProducts() {
      const stored = read(KEY_PRODUCTS, null);
      const list = stored != null ? stored : window.SEED_PRODUCTS || [];
      return list.map(normalize);
    },
    saveProducts(list) {
      return write(KEY_PRODUCTS, list.map(normalize));
    },
    getProduct(id) {
      return this.getProducts().find((p) => p.id === id) || null;
    },
    addProduct(p) {
      const list = this.getProducts();
      const item = normalize(p);
      if (!item.id) item.id = uid();
      list.unshift(item);
      this.saveProducts(list);
      return item;
    },
    updateProduct(id, patch) {
      const list = this.getProducts();
      const i = list.findIndex((p) => p.id === id);
      if (i === -1) return null;
      list[i] = normalize(Object.assign({}, list[i], patch, { id }));
      this.saveProducts(list);
      return list[i];
    },
    deleteProduct(id) {
      const list = this.getProducts().filter((p) => p.id !== id);
      this.saveProducts(list);
    },
    resetToSeed() {
      localStorage.removeItem(KEY_PRODUCTS);
    },

    // ---------- Favoritos ----------
    getFavs() {
      return read(KEY_FAVS, []);
    },
    isFav(id) {
      return this.getFavs().includes(id);
    },
    toggleFav(id) {
      const favs = this.getFavs();
      const i = favs.indexOf(id);
      if (i === -1) favs.push(id);
      else favs.splice(i, 1);
      write(KEY_FAVS, favs);
      return favs.includes(id);
    },

    // ---------- Import / Export ----------
    exportJSON() {
      return JSON.stringify(this.getProducts(), null, 2);
    },
    importJSON(text) {
      const data = JSON.parse(text);
      if (!Array.isArray(data)) throw new Error("El archivo no contiene una lista de productos.");
      this.saveProducts(data);
      return data.length;
    },

    // ---------- Utilidades ----------
    uid,
    // Genera una imagen SVG de marcador (placeholder) a partir de un texto.
    placeholder(text, seed) {
      const palette = [
        ["#6C5CE7", "#a06bff"],
        ["#00b894", "#55efc4"],
        ["#0984e3", "#74b9ff"],
        ["#e17055", "#fab1a0"],
        ["#e84393", "#fd79a8"],
        ["#fdcb6e", "#ffeaa7"]
      ];
      let h = 0;
      const s = (seed || text || "x").toString();
      for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
      const [c1, c2] = palette[h % palette.length];
      const initials = (text || "?")
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0] || "")
        .join("")
        .toUpperCase();
      const svg =
        '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600">' +
        '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
        '<stop offset="0" stop-color="' + c1 + '"/>' +
        '<stop offset="1" stop-color="' + c2 + '"/>' +
        "</linearGradient></defs>" +
        '<rect width="600" height="600" fill="url(#g)"/>' +
        '<text x="50%" y="50%" dy=".35em" text-anchor="middle" ' +
        'font-family="Arial, sans-serif" font-size="220" font-weight="700" ' +
        'fill="rgba(255,255,255,.9)">' + initials + "</text></svg>";
      return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
    },
    productImage(p, index) {
      const imgs = p.images || [];
      if (imgs.length) return imgs[index || 0];
      return this.placeholder(p.name, p.id);
    },
    formatPrice(p) {
      if (p.price == null || isNaN(p.price)) return "";
      const cur = p.currency || defaultConfig.currency;
      const val = Number.isInteger(p.price) ? p.price : p.price.toFixed(2);
      return val + " " + cur;
    }
  };

  // Aplica el color de acento definido en config a las variables CSS.
  function applyTheme() {
    const cfg = Store.getConfig();
    const root = document.documentElement;
    if (cfg.accent) root.style.setProperty("--accent", cfg.accent);
    if (cfg.accent2) root.style.setProperty("--accent-2", cfg.accent2);
  }

  window.Store = Store;
  window.applyTheme = applyTheme;
})();
