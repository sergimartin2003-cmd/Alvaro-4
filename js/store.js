/* ============================================================
   STORE: capa de datos (Supabase con fallback a modo demo local)
   Interfaz asíncrona compartida por app.js (tienda) y admin.js (panel).
   ============================================================ */
(function () {
  const APP = window.APP_CONFIG || {};
  const SITE = Object.assign(
    {
      brand: "Hipopick",
      tagline: "Encuentra tus productos con fotos reales",
      currency: "€",
      buyLabel: "Comprar ahora",
      accent: "#6C5CE7",
      accent2: "#a06bff",
      demoPasscode: "admin1234"
    },
    window.SITE_CONFIG || {}
  );
  const BUCKET = APP.STORAGE_BUCKET || "product-images";

  // ¿Hay credenciales de Supabase reales configuradas?
  const configured =
    APP.SUPABASE_URL &&
    APP.SUPABASE_ANON_KEY &&
    !/TU-PROYECTO|TU-ANON/i.test(APP.SUPABASE_URL + APP.SUPABASE_ANON_KEY);

  let sb = null;
  if (configured && window.supabase && window.supabase.createClient) {
    try {
      sb = window.supabase.createClient(APP.SUPABASE_URL, APP.SUPABASE_ANON_KEY);
    } catch (e) {
      console.error("No se pudo iniciar Supabase:", e);
    }
  }
  const MODE = sb ? "supabase" : "local";

  /* -------------------- Utilidades comunes -------------------- */
  function uid() {
    return "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }
  function normalize(p) {
    let images = Array.isArray(p.images) ? p.images.slice() : [];
    if (!images.length && p.image) images = [p.image];
    return {
      id: p.id || uid(),
      name: (p.name || "").trim(),
      price: p.price === "" || p.price == null ? null : Number(p.price),
      currency: p.currency || SITE.currency,
      category: (p.category || "Otros").trim() || "Otros",
      sizes: (p.sizes != null ? p.sizes : (p.badge || "")).toString().trim(),
      description: (p.description || "").trim(),
      buyLink: (p.buyLink || p.buy_link || "").trim(),
      images: images,
      rating: p.rating != null && p.rating !== "" ? Number(p.rating) : null,
      createdAt: p.createdAt || p.created_at || Date.now()
    };
  }
  // Convierte un objeto JS -> fila de la tabla de Supabase (snake_case)
  function toRow(p) {
    return {
      name: (p.name || "").trim(),
      price: p.price === "" || p.price == null ? null : Number(p.price),
      currency: p.currency || SITE.currency,
      category: (p.category || "Otros").trim() || "Otros",
      badge: (p.sizes != null ? p.sizes : (p.badge || "")).toString().trim(),
      description: (p.description || "").trim(),
      buy_link: (p.buyLink || "").trim(),
      images: Array.isArray(p.images) ? p.images : [],
      rating: p.rating != null && p.rating !== "" ? Number(p.rating) : null
    };
  }

  /* ==========================================================
     BACKEND: SUPABASE
     ========================================================== */
  const supabaseBackend = {
    async listProducts() {
      const { data, error } = await sb
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map(normalize);
    },
    async addProduct(p) {
      const { data, error } = await sb.from("products").insert(toRow(p)).select().single();
      if (error) throw error;
      return normalize(data);
    },
    async updateProduct(id, patch) {
      const { data, error } = await sb.from("products").update(toRow(patch)).eq("id", id).select().single();
      if (error) throw error;
      return normalize(data);
    },
    async deleteProduct(id) {
      const { error } = await sb.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    async uploadImage(file) {
      const ext = (file.name && file.name.split(".").pop()) || "jpg";
      const path =
        Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8) + "." + ext;
      const { error } = await sb.storage.from(BUCKET).upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || "image/jpeg"
      });
      if (error) throw error;
      const { data } = sb.storage.from(BUCKET).getPublicUrl(path);
      return data.publicUrl;
    },
    auth: {
      async getUser() {
        const { data } = await sb.auth.getUser();
        return data ? data.user : null;
      },
      async signIn(email, password) {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
      },
      async signOut() {
        await sb.auth.signOut();
      },
      onChange(cb) {
        sb.auth.onAuthStateChange((_e, session) => cb(session ? session.user : null));
      }
    }
  };

  /* ==========================================================
     BACKEND: LOCAL (modo demo, sin Supabase) — usa localStorage
     ========================================================== */
  const KEY_PRODUCTS = "hp_products";
  const KEY_DEMO_AUTH = "hp_demo_auth";
  function lsRead(k, f) {
    try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : f; } catch (e) { return f; }
  }
  function lsWrite(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); return true; }
    catch (e) {
      alert("No se pudo guardar en modo demo (almacenamiento lleno). " +
            "Configura Supabase para guardar sin límite.");
      return false;
    }
  }
  function resizeDataURL(file, maxSize, quality) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > maxSize || height > maxSize) {
            if (width >= height) { height = Math.round((height * maxSize) / width); width = maxSize; }
            else { width = Math.round((width * maxSize) / height); height = maxSize; }
          }
          const c = document.createElement("canvas");
          c.width = width; c.height = height;
          c.getContext("2d").drawImage(img, 0, 0, width, height);
          resolve(c.toDataURL("image/jpeg", quality));
        };
        img.onerror = () => resolve(e.target.result);
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }
  const localBackend = {
    async listProducts() {
      return lsRead(KEY_PRODUCTS, []).map(normalize).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    },
    async addProduct(p) {
      const list = lsRead(KEY_PRODUCTS, []);
      const item = normalize(p);
      item.id = uid();
      item.createdAt = Date.now();
      list.unshift(item);
      lsWrite(KEY_PRODUCTS, list);
      return item;
    },
    async updateProduct(id, patch) {
      const list = lsRead(KEY_PRODUCTS, []);
      const i = list.findIndex((x) => x.id === id);
      if (i === -1) return null;
      list[i] = normalize(Object.assign({}, list[i], patch, { id }));
      lsWrite(KEY_PRODUCTS, list);
      return list[i];
    },
    async deleteProduct(id) {
      lsWrite(KEY_PRODUCTS, lsRead(KEY_PRODUCTS, []).filter((x) => x.id !== id));
    },
    async uploadImage(file) {
      return resizeDataURL(file, 1000, 0.82); // guarda la foto como data URL
    },
    auth: {
      async getUser() {
        return sessionStorage.getItem(KEY_DEMO_AUTH) === "1" ? { email: "demo" } : null;
      },
      async signIn(email, password) {
        // En demo, la "contraseña" es SITE.demoPasscode (email se ignora)
        const pass = password || email;
        if (pass !== SITE.demoPasscode) throw new Error("Contraseña incorrecta.");
        sessionStorage.setItem(KEY_DEMO_AUTH, "1");
      },
      async signOut() { sessionStorage.removeItem(KEY_DEMO_AUTH); },
      onChange() {}
    }
  };

  const backend = sb ? supabaseBackend : localBackend;

  /* ==========================================================
     Favoritos (siempre local, por dispositivo)
     ========================================================== */
  const KEY_FAVS = "hp_favs";
  const favs = {
    get() { return lsRead(KEY_FAVS, []); },
    is(id) { return this.get().includes(id); },
    toggle(id) {
      const f = this.get();
      const i = f.indexOf(id);
      if (i === -1) f.push(id); else f.splice(i, 1);
      lsWrite(KEY_FAVS, f);
      return f.includes(id);
    }
  };

  /* ==========================================================
     Helpers de presentación
     ========================================================== */
  function placeholder(text, seed) {
    const palette = [
      ["#6C5CE7", "#a06bff"], ["#00b894", "#55efc4"], ["#0984e3", "#74b9ff"],
      ["#e17055", "#fab1a0"], ["#e84393", "#fd79a8"], ["#fdcb6e", "#ffeaa7"]
    ];
    let h = 0;
    const s = (seed || text || "x").toString();
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    const [c1, c2] = palette[h % palette.length];
    const initials = (text || "?").split(/\s+/).slice(0, 2).map((w) => w[0] || "").join("").toUpperCase();
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600">' +
      '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="' + c1 + '"/><stop offset="1" stop-color="' + c2 + '"/>' +
      "</linearGradient></defs><rect width='600' height='600' fill='url(#g)'/>" +
      '<text x="50%" y="50%" dy=".35em" text-anchor="middle" font-family="Arial, sans-serif" ' +
      'font-size="220" font-weight="700" fill="rgba(255,255,255,.9)">' + initials + "</text></svg>";
    return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
  }

  /* ==========================================================
     API pública
     ========================================================== */
  const Store = {
    MODE,
    isSupabase: MODE === "supabase",
    getConfig() { return Object.assign({}, SITE); },

    listProducts: () => backend.listProducts(),
    addProduct: (p) => backend.addProduct(p),
    updateProduct: (id, patch) => backend.updateProduct(id, patch),
    deleteProduct: (id) => backend.deleteProduct(id),
    uploadImage: (file) => backend.uploadImage(file),
    auth: backend.auth,

    favs,

    placeholder,
    productImage(p, index) {
      const imgs = p.images || [];
      if (imgs.length) return imgs[index || 0];
      return placeholder(p.name, p.id);
    },
    formatPrice(p) {
      if (p.price == null || isNaN(p.price)) return "";
      const cur = p.currency || SITE.currency;
      const val = Number.isInteger(p.price) ? p.price : Number(p.price).toFixed(2);
      return val + " " + cur;
    }
  };

  function applyTheme() {
    const root = document.documentElement;
    if (SITE.accent) root.style.setProperty("--accent", SITE.accent);
    if (SITE.accent2) root.style.setProperty("--accent-2", SITE.accent2);
  }

  window.Store = Store;
  window.applyTheme = applyTheme;
})();
