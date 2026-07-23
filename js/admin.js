/* ============================================================
   ADMIN: panel privado para gestionar productos
   ============================================================ */
(function () {
  applyTheme();
  const cfg = Store.getConfig();
  const $ = (id) => document.getElementById(id);

  /* -------------------- Contraseña -------------------- */
  const SESSION_KEY = "hp_admin_ok";
  function needsGate() {
    return !!(cfg.adminPasscode && cfg.adminPasscode.length);
  }
  function unlocked() {
    return sessionStorage.getItem(SESSION_KEY) === "1";
  }
  function showPanel() {
    $("gate").style.display = "none";
    $("panel").style.display = "block";
    initPanel();
  }
  function showGate() {
    $("gate").style.display = "block";
    $("panel").style.display = "none";
    $("gatePass").focus();
  }
  function tryUnlock() {
    const val = $("gatePass").value;
    if (val === cfg.adminPasscode) {
      sessionStorage.setItem(SESSION_KEY, "1");
      showPanel();
    } else {
      $("gateErr").style.display = "block";
      $("gatePass").select();
    }
  }
  $("gateBtn").onclick = tryUnlock;
  $("gatePass").addEventListener("keydown", (e) => { if (e.key === "Enter") tryUnlock(); });
  $("lockBtn").onclick = () => { sessionStorage.removeItem(SESSION_KEY); location.reload(); };

  if (!needsGate() || unlocked()) showPanel();
  else showGate();

  /* -------------------- Panel -------------------- */
  let pendingImages = []; // imágenes del formulario actual (data URIs o URLs)

  function initPanel() {
    refreshCategoryInputs();
    renderList();
    bindForm();
    bindTools();
  }

  /* ---- Categorías (datalist + filtro) ---- */
  function allCategories() {
    const set = new Set(window.SUGGESTED_CATEGORIES || []);
    Store.getProducts().forEach((p) => p.category && set.add(p.category));
    return [...set].sort();
  }
  function refreshCategoryInputs() {
    const cats = allCategories();
    const dl = $("catList");
    dl.innerHTML = cats.map((c) => '<option value="' + escAttr(c) + '">').join("");

    const filter = $("filterCat");
    const current = filter.value;
    filter.setAttribute("list", "filterCatList");
    let dl2 = $("filterCatList");
    if (!dl2) {
      dl2 = document.createElement("datalist");
      dl2.id = "filterCatList";
      document.body.appendChild(dl2);
    }
    dl2.innerHTML =
      '<option value="">' +
      cats.map((c) => '<option value="' + escAttr(c) + '">').join("");
    filter.placeholder = "Filtrar por categoría…";
    filter.value = current;
  }

  /* ---- Formulario ---- */
  function bindForm() {
    const form = $("productForm");
    form.onsubmit = (e) => {
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
      if (editId) {
        Store.updateProduct(editId, data);
        toast("Producto actualizado ✓");
      } else {
        Store.addProduct(data);
        toast("Producto añadido ✓");
      }
      resetForm();
      refreshCategoryInputs();
      renderList();
    };

    $("cancelBtn").onclick = resetForm;

    // Subida de ficheros
    const drop = $("dropzone");
    const fileInput = $("fileInput");
    drop.onclick = () => fileInput.click();
    fileInput.onchange = () => handleFiles(fileInput.files);
    ["dragenter", "dragover"].forEach((ev) =>
      drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add("drag"); })
    );
    ["dragleave", "drop"].forEach((ev) =>
      drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove("drag"); })
    );
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

  function handleFiles(files) {
    const arr = [...files].filter((f) => f.type.startsWith("image/"));
    let done = 0;
    if (!arr.length) return;
    arr.forEach((file) => {
      resizeImage(file, 1000, 0.82).then((dataUrl) => {
        pendingImages.push(dataUrl);
        done++;
        renderThumbs();
        if (done === arr.length) toast(arr.length + " imagen(es) añadida(s)");
      });
    });
  }

  // Redimensiona/comprime la imagen en el navegador (para no llenar el almacenamiento)
  function resizeImage(file, maxSize, quality) {
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
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          canvas.getContext("2d").drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        };
        img.onerror = () => resolve(e.target.result);
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function renderThumbs() {
    const wrap = $("thumbsPreview");
    wrap.innerHTML = "";
    pendingImages.forEach((src, i) => {
      const d = document.createElement("div");
      d.className = "thumb-item";
      d.innerHTML = '<img src="' + escAttr(src) + '"><button type="button" title="Quitar">×</button>';
      d.querySelector("button").onclick = () => { pendingImages.splice(i, 1); renderThumbs(); };
      wrap.appendChild(d);
    });
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
    const p = Store.getProduct(id);
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

  /* ---- Lista de productos ---- */
  function renderList() {
    const filter = ($("filterCat").value || "").trim().toLowerCase();
    let list = Store.getProducts();
    if (filter) list = list.filter((p) => (p.category || "").toLowerCase().includes(filter));
    list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    const wrap = $("adminList");
    const total = Store.getProducts().length;
    $("countLabel").textContent = "(" + total + ")";
    wrap.innerHTML = "";

    if (!total) { $("adminEmpty").style.display = "block"; return; }
    $("adminEmpty").style.display = "none";

    if (!list.length) {
      wrap.innerHTML = '<p style="color:#7a7f95;padding:16px">Ningún producto en esa categoría.</p>';
      return;
    }

    list.forEach((p) => {
      const item = document.createElement("div");
      item.className = "admin-item";
      item.innerHTML =
        '<img src="' + escAttr(Store.productImage(p)) + '" alt="">' +
        '<div class="meta">' +
          '<div class="n">' + esc(p.name) + "</div>" +
          '<div class="s">' + esc(p.category) + " · " + (Store.formatPrice(p) || "sin precio") +
            (p.images && p.images.length ? " · " + p.images.length + " foto(s)" : "") +
          "</div>" +
        "</div>" +
        '<div class="acts">' +
          '<button class="mini-btn edit" title="Editar">✏️</button>' +
          '<button class="mini-btn del" title="Eliminar">🗑</button>' +
        "</div>";
      item.querySelector(".edit").onclick = () => editProduct(p.id);
      item.querySelector(".del").onclick = () => {
        if (confirm('¿Eliminar "' + p.name + '"?')) {
          Store.deleteProduct(p.id);
          refreshCategoryInputs();
          renderList();
          toast("Producto eliminado");
        }
      };
      wrap.appendChild(item);
    });
  }

  /* ---- Herramientas: filtro, exportar, importar ---- */
  function bindTools() {
    $("filterCat").addEventListener("input", renderList);

    $("exportBtn").onclick = () => {
      const blob = new Blob([Store.exportJSON()], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "productos.json";
      a.click();
      URL.revokeObjectURL(a.href);
      toast("Copia de seguridad descargada");
    };

    $("importBtn").onclick = () => $("importFile").click();
    $("importFile").onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const n = Store.importJSON(reader.result);
          refreshCategoryInputs();
          renderList();
          toast("Importados " + n + " productos ✓");
        } catch (err) {
          alert("No se pudo importar: " + err.message);
        }
        $("importFile").value = "";
      };
      reader.readAsText(file);
    };
  }

  /* ---- Helpers ---- */
  function esc(s) {
    return (s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function escAttr(s) { return esc(s); }
  let toastTimer;
  function toast(msg) {
    const t = $("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 1800);
  }
})();
