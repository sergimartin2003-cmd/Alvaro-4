/* ============================================================
   ADMIN: panel privado (login Supabase Auth + CRUD en la base de datos)
   ============================================================ */
(function () {
  applyTheme();
  const cfg = Store.getConfig();
  const $ = (id) => document.getElementById(id);

  let products = [];        // cache
  let pendingImages = [];   // URLs (Supabase) o data URLs (demo) del formulario
  let panelReady = false;

  // Aviso de modo demo
  if (!Store.isSupabase && $("demoBanner")) $("demoBanner").style.display = "block";
  // En modo demo ocultamos el campo email (solo importa la contraseña)
  if (!Store.isSupabase && $("gateEmailField")) $("gateEmailField").style.display = "none";

  /* -------------------- Login -------------------- */
  async function boot() {
    let user = null;
    try { user = await Store.auth.getUser(); } catch (e) { user = null; }
    if (user) showPanel();
    else showGate();
  }
  function showGate() {
    $("gate").style.display = "block";
    $("panel").style.display = "none";
    ($("gateEmail") || $("gatePass")).focus();
  }
  async function showPanel() {
    $("gate").style.display = "none";
    $("panel").style.display = "block";
    if (!panelReady) { bindForm(); bindTools(); panelReady = true; }
    await refresh();
  }
  async function tryLogin() {
    const email = $("gateEmail") ? $("gateEmail").value.trim() : "";
    const pass = $("gatePass").value;
    $("gateErr").style.display = "none";
    $("gateBtn").disabled = true;
    $("gateBtn").textContent = "Entrando…";
    try {
      await Store.auth.signIn(email, pass);
      await showPanel();
    } catch (e) {
      $("gateErr").textContent = Store.isSupabase
        ? "Email o contraseña incorrectos."
        : "Contraseña incorrecta.";
      $("gateErr").style.display = "block";
      $("gatePass").select();
    } finally {
      $("gateBtn").disabled = false;
      $("gateBtn").textContent = "Entrar";
    }
  }
  $("gateBtn").onclick = tryLogin;
  $("gatePass").addEventListener("keydown", (e) => { if (e.key === "Enter") tryLogin(); });
  if ($("gateEmail")) $("gateEmail").addEventListener("keydown", (e) => { if (e.key === "Enter") $("gatePass").focus(); });
  $("lockBtn").onclick = async () => { await Store.auth.signOut(); location.reload(); };

  /* -------------------- Datos -------------------- */
  async function refresh() {
    try {
      products = await Store.listProducts();
    } catch (e) {
      console.error(e);
      toast("Error al cargar productos");
      products = [];
    }
    refreshCategoryInputs();
    renderList();
  }

  function allCategories() {
    const set = new Set(window.SUGGESTED_CATEGORIES || []);
    products.forEach((p) => p.category && set.add(p.category));
    return [...set].sort();
  }
  function refreshCategoryInputs() {
    const cats = allCategories();
    $("catList").innerHTML = cats.map((c) => '<option value="' + esc(c) + '">').join("");
    let dl2 = $("filterCatList");
    if (!dl2) { dl2 = document.createElement("datalist"); dl2.id = "filterCatList"; document.body.appendChild(dl2); }
    dl2.innerHTML = cats.map((c) => '<option value="' + esc(c) + '">').join("");
    $("filterCat").setAttribute("list", "filterCatList");
    $("filterCat").placeholder = "Filtrar por categoría…";
  }

  /* -------------------- Formulario -------------------- */
  function bindForm() {
    $("productForm").onsubmit = async (e) => {
      e.preventDefault();
      const data = {
        name: $("fName").value.trim(),
        price: $("fPrice").value,
        currency: $("fCurrency").value.trim() || cfg.currency,
        category: $("fCategory").value.trim() || "Otros",
        badge: $("fBadge").value.trim(),
        rating: $("fRating").value,
        description: $("fDesc").value.trim(),
        buyLink: $("fBuy").value.trim(),
        images: pendingImages.slice()
      };
      if (!data.name) return;

      const editId = $("editId").value;
      setSaving(true);
      try {
        if (editId) { await Store.updateProduct(editId, data); toast("Producto actualizado ✓"); }
        else { await Store.addProduct(data); toast("Producto añadido ✓"); }
        resetForm();
        await refresh();
      } catch (err) {
        console.error(err);
        alert("No se pudo guardar: " + (err.message || err));
      } finally {
        setSaving(false);
      }
    };

    $("cancelBtn").onclick = resetForm;

    // Subida de ficheros
    const drop = $("dropzone");
    const fileInput = $("fileInput");
    drop.onclick = () => fileInput.click();
    fileInput.onchange = () => { handleFiles(fileInput.files); fileInput.value = ""; };
    ["dragenter", "dragover"].forEach((ev) =>
      drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add("drag"); }));
    ["dragleave", "drop"].forEach((ev) =>
      drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove("drag"); }));
    drop.addEventListener("drop", (e) => handleFiles(e.dataTransfer.files));

    // URL de imagen
    $("fImgUrl").addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const url = e.target.value.trim();
        if (url) { pendingImages.push(url); renderThumbs(); e.target.value = ""; }
      }
    });
  }

  async function handleFiles(files) {
    const arr = [...files].filter((f) => f.type.startsWith("image/"));
    if (!arr.length) return;
    setUploading(true, arr.length);
    let ok = 0;
    for (const file of arr) {
      try {
        const ref = await Store.uploadImage(file);
        pendingImages.push(ref);
        ok++;
        renderThumbs();
      } catch (err) {
        console.error(err);
        toast("Error subiendo una imagen");
      }
    }
    setUploading(false);
    if (ok) toast(ok + " imagen(es) subida(s) ✓");
  }

  function renderThumbs() {
    const wrap = $("thumbsPreview");
    wrap.innerHTML = "";
    pendingImages.forEach((src, i) => {
      const d = document.createElement("div");
      d.className = "thumb-item";
      d.innerHTML = '<img src="' + esc(src) + '"><button type="button" title="Quitar">×</button>';
      d.querySelector("button").onclick = () => { pendingImages.splice(i, 1); renderThumbs(); };
      wrap.appendChild(d);
    });
  }

  function setUploading(on, n) {
    const dz = $("dropzone");
    if (on) { dz.classList.add("uploading"); dz.dataset.label = dz.innerHTML; dz.innerHTML = "⏳ Subiendo " + (n || "") + " imagen(es)…"; }
    else if (dz.dataset.label) { dz.classList.remove("uploading"); dz.innerHTML = dz.dataset.label; }
  }
  function setSaving(on) {
    $("saveBtn").disabled = on;
    $("saveBtn").textContent = on ? "Guardando…" : ($("editId").value ? "Guardar cambios" : "Guardar producto");
  }

  function resetForm() {
    $("productForm").reset();
    $("editId").value = "";
    pendingImages = [];
    renderThumbs();
    $("formTitle").textContent = "➕ Nuevo producto";
    $("saveBtn").textContent = "Guardar producto";
    $("cancelBtn").style.display = "none";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function editProduct(id) {
    const p = products.find((x) => x.id === id);
    if (!p) return;
    $("editId").value = p.id;
    $("fName").value = p.name;
    $("fPrice").value = p.price ?? "";
    $("fCurrency").value = p.currency || "";
    $("fCategory").value = p.category || "";
    $("fBadge").value = p.badge || "";
    $("fRating").value = p.rating ?? "";
    $("fDesc").value = p.description || "";
    $("fBuy").value = p.buyLink || "";
    pendingImages = (p.images || []).slice();
    renderThumbs();
    $("formTitle").textContent = "✏️ Editar producto";
    $("saveBtn").textContent = "Guardar cambios";
    $("cancelBtn").style.display = "";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* -------------------- Lista -------------------- */
  function renderList() {
    const filter = ($("filterCat").value || "").trim().toLowerCase();
    let list = products.slice();
    if (filter) list = list.filter((p) => (p.category || "").toLowerCase().includes(filter));

    const wrap = $("adminList");
    $("countLabel").textContent = "(" + products.length + ")";
    wrap.innerHTML = "";
    if (!products.length) { $("adminEmpty").style.display = "block"; return; }
    $("adminEmpty").style.display = "none";
    if (!list.length) { wrap.innerHTML = '<p style="color:#7a7f95;padding:16px">Ningún producto en esa categoría.</p>'; return; }

    list.forEach((p) => {
      const item = document.createElement("div");
      item.className = "admin-item";
      item.innerHTML =
        '<img src="' + esc(Store.productImage(p)) + '" alt="">' +
        '<div class="meta"><div class="n">' + esc(p.name) + "</div>" +
        '<div class="s">' + esc(p.category) + " · " + (Store.formatPrice(p) || "sin precio") +
          (p.images && p.images.length ? " · " + p.images.length + " foto(s)" : "") + "</div></div>" +
        '<div class="acts">' +
          '<button class="mini-btn edit" title="Editar">✏️</button>' +
          '<button class="mini-btn del" title="Eliminar">🗑</button></div>';
      item.querySelector(".edit").onclick = () => editProduct(p.id);
      item.querySelector(".del").onclick = async () => {
        if (!confirm('¿Eliminar "' + p.name + '"?')) return;
        try { await Store.deleteProduct(p.id); toast("Producto eliminado"); await refresh(); }
        catch (err) { alert("No se pudo eliminar: " + (err.message || err)); }
      };
      wrap.appendChild(item);
    });
  }

  /* -------------------- Herramientas -------------------- */
  function bindTools() {
    $("filterCat").addEventListener("input", renderList);

    $("exportBtn").onclick = () => {
      const blob = new Blob([JSON.stringify(products, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "productos-backup.json";
      a.click();
      URL.revokeObjectURL(a.href);
      toast("Copia de seguridad descargada");
    };

    $("importBtn").onclick = () => $("importFile").click();
    $("importFile").onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async () => {
        let arr;
        try { arr = JSON.parse(reader.result); if (!Array.isArray(arr)) throw new Error("Formato inválido"); }
        catch (err) { alert("Archivo no válido: " + err.message); return; }
        if (!confirm("Se importarán " + arr.length + " productos a la base de datos. ¿Continuar?")) return;
        let n = 0;
        for (const p of arr) { try { await Store.addProduct(p); n++; } catch (e) {} }
        toast("Importados " + n + " productos ✓");
        await refresh();
        $("importFile").value = "";
      };
      reader.readAsText(file);
    };
  }

  /* -------------------- Helpers -------------------- */
  function esc(s) {
    return (s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  let toastTimer;
  function toast(msg) {
    const t = $("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2000);
  }

  boot();
})();
