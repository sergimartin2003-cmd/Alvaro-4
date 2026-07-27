/* ============================================================
   APP: lógica de la tienda / catálogo (lee de Supabase)
   ============================================================ */
(function () {
  applyTheme();
  const cfg = Store.getConfig();
  const $ = (id) => document.getElementById(id);

  const state = { search: "", category: "Todos", sort: "new", favsOnly: false };
  let products = []; // cache de productos cargados

  const grid = $("grid");
  const empty = $("empty");
  const chips = $("chips");

  // --- Marca / textos ---
  $("brandName").innerHTML = brandHTML(cfg.brand);
  $("footBrand").textContent = cfg.brand;
  $("year").textContent = new Date().getFullYear();
  document.title = cfg.brand + " — Catálogo de productos";

  // Aviso de modo demo (sin Supabase configurado)
  if (!Store.isSupabase && $("demoBanner")) $("demoBanner").style.display = "block";

  function brandHTML(name) {
    if (!name) return "Catálogo";
    const mid = Math.ceil(name.length / 2);
    return name.slice(0, mid) + "<b>" + name.slice(mid) + "</b>";
  }

  /* ---------- Carga de datos ---------- */
  async function load() {
    grid.innerHTML = skeletons(8);
    empty.style.display = "none";
    try {
      products = await Store.listProducts();
    } catch (e) {
      console.error(e);
      products = [];
      grid.innerHTML = "";
      empty.style.display = "block";
      $("emptyMsg").textContent =
        "No se pudieron cargar los productos. Revisa la conexión con la base de datos.";
      return;
    }
    renderChips();
    render();
  }

  function skeletons(n) {
    let s = "";
    for (let i = 0; i < n; i++) {
      s +=
        '<div class="card"><div class="card-media skeleton"></div>' +
        '<div class="card-body"><div class="sk-line" style="width:40%"></div>' +
        '<div class="sk-line" style="width:80%"></div>' +
        '<div class="sk-line" style="width:30%"></div></div></div>';
    }
    return s;
  }

  /* ---------- Categorías ---------- */
  function renderChips() {
    const cats = ["Todos", ...uniqueCategories()];
    chips.innerHTML = "";
    cats.forEach((c) => {
      const b = document.createElement("button");
      b.className = "chip" + (state.category === c && !state.favsOnly ? " active" : "");
      b.textContent = c;
      b.onclick = () => {
        state.category = c;
        state.favsOnly = false;
        $("favToggle").classList.remove("active");
        renderChips();
        render();
      };
      chips.appendChild(b);
    });
  }
  function uniqueCategories() {
    const set = new Set();
    products.forEach((p) => p.category && set.add(p.category));
    return [...set].sort();
  }

  /* ---------- Filtro + orden ---------- */
  function currentList() {
    let list = products.slice();
    if (state.favsOnly) {
      const f = Store.favs.get();
      list = list.filter((p) => f.includes(p.id));
    } else if (state.category !== "Todos") {
      list = list.filter((p) => p.category === state.category);
    }
    if (state.search) {
      const q = state.search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description || "").toLowerCase().includes(q) ||
          (p.category || "").toLowerCase().includes(q)
      );
    }
    switch (state.sort) {
      case "price-asc": list.sort((a, b) => (a.price ?? 1e15) - (b.price ?? 1e15)); break;
      case "price-desc": list.sort((a, b) => (b.price ?? -1) - (a.price ?? -1)); break;
      case "name": list.sort((a, b) => a.name.localeCompare(b.name)); break;
      default: list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }
    return list;
  }

  /* ---------- Render ---------- */
  function render() {
    const list = currentList();
    $("listTitle").childNodes[0].nodeValue = state.favsOnly
      ? "Tus favoritos "
      : state.category === "Todos"
      ? "Todos los productos "
      : state.category + " ";
    $("listCount").textContent = "(" + list.length + ")";
    const heroEl = $("hero");
    if (heroEl) heroEl.style.display = state.favsOnly || state.search ? "none" : "";

    grid.innerHTML = "";
    if (!list.length) {
      empty.style.display = "block";
      $("emptyMsg").textContent = state.favsOnly
        ? "Aún no has guardado favoritos. Pulsa el ♡ en un producto."
        : state.search
        ? "No se encontraron productos para “" + state.search + "”."
        : "No hay productos todavía.";
      return;
    }
    empty.style.display = "none";
    const f = Store.favs.get();
    list.forEach((p) => grid.appendChild(card(p, f)));
  }

  function card(p, favList) {
    const el = document.createElement("article");
    el.className = "card";
    const isFav = favList.includes(p.id);
    const rating = p.rating ? '<span class="card-rating">★ ' + p.rating + "</span>" : "";
    el.innerHTML =
      '<div class="card-media">' +
        '<button class="fav-btn' + (isFav ? " active" : "") + '" aria-label="Favorito">' + heartSVG() + "</button>" +
        '<img loading="lazy" src="' + esc(Store.productImage(p)) + '" alt="' + esc(p.name) + '">' +
      "</div>" +
      '<div class="card-body">' +
        '<span class="card-cat">' + esc(p.category) + "</span>" +
        '<div class="card-name">' + esc(p.name) + "</div>" +
        '<div class="card-foot">' +
          '<span class="card-price">' + (Store.formatPrice(p) || "—") + "</span>" + rating +
        "</div>" +
      "</div>";

    const media = el.querySelector(".card-media");
    media.onclick = (e) => { if (!e.target.closest(".fav-btn")) openModal(p.id); };
    const nameEl = el.querySelector(".card-name");
    nameEl.style.cursor = "pointer";
    nameEl.onclick = () => openModal(p.id);
    el.querySelector(".fav-btn").onclick = (e) => {
      e.stopPropagation();
      const now = Store.favs.toggle(p.id);
      e.currentTarget.classList.toggle("active", now);
      updateFavCount();
      toast(now ? "Añadido a favoritos ♥" : "Quitado de favoritos");
      if (state.favsOnly) render();
    };
    return el;
  }

  /* ---------- Modal ---------- */
  function openModal(id) {
    const p = products.find((x) => x.id === id);
    if (!p) return;
    const imgs = p.images && p.images.length ? p.images : [Store.productImage(p)];
    $("mCat").textContent = p.category;
    $("mName").textContent = p.name;
    $("mPrice").textContent = Store.formatPrice(p) || "Precio no indicado";
    $("mDesc").textContent = p.description || "Sin descripción.";
    $("mImg").src = imgs[0];

    // Tallas disponibles (pastillas)
    const mSizes = $("mSizes");
    const sizeList = (p.sizes || "")
      .split(/[,/|]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (sizeList.length) {
      mSizes.style.display = "block";
      mSizes.innerHTML =
        '<span class="modal-sizes-label">Tallas disponibles</span>' +
        '<div class="size-chips">' +
        sizeList.map((s) => '<span class="size-chip">' + esc(s) + "</span>").join("") +
        "</div>";
    } else {
      mSizes.style.display = "none";
      mSizes.innerHTML = "";
    }

    const thumbs = $("mThumbs");
    thumbs.innerHTML = "";
    thumbs.style.display = imgs.length > 1 ? "flex" : "none";
    imgs.forEach((src, i) => {
      const t = document.createElement("img");
      t.src = src;
      t.className = i === 0 ? "active" : "";
      t.onclick = () => {
        $("mImg").src = src;
        thumbs.querySelectorAll("img").forEach((x) => x.classList.remove("active"));
        t.classList.add("active");
      };
      thumbs.appendChild(t);
    });

    const buy = $("mBuy");
    buy.textContent = cfg.buyLabel || "Comprar ahora";
    if (p.buyLink) { buy.href = p.buyLink; buy.style.display = ""; }
    else { buy.href = "#"; buy.style.display = "none"; }

    const favBtn = $("mFav");
    const setFav = (v) => { favBtn.classList.toggle("active", v); favBtn.textContent = v ? "♥ Guardado" : "♡ Guardar"; };
    setFav(Store.favs.is(p.id));
    favBtn.onclick = () => { const now = Store.favs.toggle(p.id); setFav(now); updateFavCount(); render(); };

    $("modal").classList.add("open");
    document.body.style.overflow = "hidden";
  }
  function closeModal() { $("modal").classList.remove("open"); document.body.style.overflow = ""; }
  $("modalClose").onclick = closeModal;
  $("modal").onclick = (e) => { if (e.target.id === "modal") closeModal(); };
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

  /* ---------- Controles ---------- */
  let searchTimer;
  $("searchInput").addEventListener("input", (e) => {
    clearTimeout(searchTimer);
    const v = e.target.value;
    searchTimer = setTimeout(() => { state.search = v.trim(); render(); }, 160);
  });
  $("sortSelect").addEventListener("change", (e) => { state.sort = e.target.value; render(); });
  $("favToggle").addEventListener("click", () => {
    state.favsOnly = !state.favsOnly;
    $("favToggle").classList.toggle("active", state.favsOnly);
    if (state.favsOnly) state.category = "Todos";
    renderChips();
    render();
  });
  function updateFavCount() {
    const n = Store.favs.get().length;
    const badge = $("favCount");
    badge.textContent = n;
    badge.style.display = n ? "grid" : "none";
  }

  // Modo noche
  const themeBtn = $("themeToggle");
  function syncThemeIcon() {
    const dark = Store.getTheme() === "dark";
    themeBtn.textContent = dark ? "☀️" : "🌙";
    themeBtn.title = dark ? "Modo día" : "Modo noche";
  }
  if (themeBtn) {
    syncThemeIcon();
    themeBtn.onclick = () => { Store.toggleTheme(); syncThemeIcon(); };
  }

  /* ---------- Helpers ---------- */
  function esc(s) {
    return (s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function heartSVG() {
    return '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-7.5-4.9-10-9.3C.4 8.4 2 4.8 5.4 4.8c1.9 0 3.3 1 4.6 2.6C11.3 5.8 12.7 4.8 14.6 4.8c3.4 0 5 3.6 3.4 6.9C19.5 16.1 12 21 12 21z"/></svg>';
  }
  let toastTimer;
  function toast(msg) {
    const t = $("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 1800);
  }

  /* ---------- Init ---------- */
  updateFavCount();
  load();
})();
