// script.js
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  "https://gpanqnyxmzpbnlixcttw.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdwYW5xbnl4bXpwYm5saXhjdHR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5ODY0NjAsImV4cCI6MjA2OTU2MjQ2MH0.wYQFfLuKlSY94eHES691SF7jrMHVfRFGrXsq2-CFbAk"
);

console.log("✅ script.js cargado en", location.pathname);

/* ========= CONTACTO ========= */
const TABLE_CONTACTS = "contactos";
const isEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v || "");

async function sha256Hex(text) {
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function initContactForm() {
  const form = document.getElementById("contact-form");
  if (!form) return;

  const successBox = document.getElementById("success-message");

  form.addEventListener(
    "submit",
    async (e) => {
      e.preventDefault();
      e.stopImmediatePropagation();

      const btn = form.querySelector('button[type="submit"]');
      if (btn) {
        btn.disabled = true;
        btn.textContent = "Enviando…";
      }

      const payload = {
        nombre: form.nombre?.value?.trim(),
        email: form.email?.value?.trim(),
        telefono: form.telefono?.value?.trim() || null,
        empresa: form.empresa?.value?.trim() || null,
        motivo: form.motivo?.value || null,
        mensaje: form.mensaje?.value?.trim(),
      };

      if (!payload.nombre || !isEmail(payload.email) || !payload.motivo || !payload.mensaje) {
        alert("Revisa nombre, email, motivo y mensaje.");
        if (btn) {
          btn.disabled = false;
          btn.textContent = "📨 Enviar consulta";
        }
        return;
      }

      const origen = location.pathname || "/contacto.html";
      const normalized = `${(payload.email || "").toLowerCase()}|${(payload.mensaje || "")
        .replace(/\s+/g, " ")
        .trim()}`;
      const submission_hash = await sha256Hex(normalized);

      const { error } = await supabase.from(TABLE_CONTACTS).insert([{ ...payload, origen, submission_hash }]);

      if (error) {
        const m = String(error.message || "").toLowerCase();
        if (m.includes("duplicate") || m.includes("unique")) {
          alert("Ya hemos recibido una consulta igual recientemente. Gracias.");
        } else {
          console.error(error);
          alert("No se pudo enviar ahora mismo. Intenta de nuevo en unos minutos.");
        }
        if (btn) {
          btn.disabled = false;
          btn.textContent = "📨 Enviar consulta";
        }
        return;
      }

      form.reset();
      if (successBox) {
        successBox.style.display = "block";
        successBox.scrollIntoView({ behavior: "smooth" });
        setTimeout(() => (successBox.style.display = "none"), 5000);
      } else {
        alert("¡Gracias por tu mensaje!");
      }
      if (btn) {
        btn.disabled = false;
        btn.textContent = "📨 Enviar consulta";
      }
    },
    { capture: true }
  );
}

/* ========= BLOG (3 últimas) ========= */
const TABLE_BLOG = "blog_posts";
const esc = (s = "") =>
  s.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));

async function loadBlogCards() {
  const container = document.getElementById("blog-row");
  console.log("🧩 blog-row encontrado?", !!container);
  if (!container) return;

  container.innerHTML = "<p style='text-align:center;opacity:.6'>Cargando entradas…</p>";

  const { data, error } = await supabase
    .from(TABLE_BLOG)
    .select("title, excerpt, url, cover_image, published_at, is_published")
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .limit(3);

  console.log("📦 resultado Supabase", { error, data });

  if (error) {
    container.innerHTML = "<p style='text-align:center;color:#b00'>No se pudieron cargar las publicaciones.</p>";
    return;
  }

  if (!data || data.length === 0) {
    container.innerHTML = "<p style='text-align:center;opacity:.6'>Aún no hay publicaciones disponibles.</p>";
    return;
  }

  // Pintamos de antigua → nueva para que la más reciente quede a la DERECHA
  const items = [...data].reverse();

  container.innerHTML = items
    .map(
      (p) => `
      <a href="${p.url}" class="blog-card" target="_blank" rel="noopener">
        <img src="${p.cover_image || "/images/blog/bienvenidos-xpertauth.jpg"}" alt="${esc(p.title)}" class="card-image">
        <div class="card-content">
          <h3 class="card-title">${esc(p.title)}</h3>
          <p class="card-description">${esc(p.excerpt || "")}</p>
        </div>
      </a>`
    )
    .join("");
  // Fallback y rendimiento de imágenes (poner justo después de pintar las tarjetas)
for (const img of container.querySelectorAll(".blog-card img")) {
  // Mejor rendimiento en carga
  img.loading = "lazy";
  img.decoding = "async";

  // Si falla la ruta/extension, probamos la alternativa y, si no, una imagen por defecto
  img.addEventListener(
    "error",
    () => {
      const src = img.getAttribute("src") || "";
      if (/\.jpg$/i.test(src)) {
        img.src = src.replace(/\.jpg$/i, ".png");
      } else if (/\.png$/i.test(src)) {
        img.src = src.replace(/\.png$/i, ".jpg");
      } else {
        img.src = "/images/blog/bienvenidos-xpertauth.jpg";
      }
    },
    { once: true }
  );
}

}

/* ========= Arranque ========= */
document.addEventListener("DOMContentLoaded", () => {
  initContactForm();
  loadBlogCards();
});
/* ========= ELIMINAR SOLO TOOLTIPS, MANTENER CLICKS ========= */
function removeOnlyTooltips() {
  // Solo eliminar elementos de tooltip específicos
  const tooltips = document.querySelectorAll('#estamento-info, .estamento-info');
  tooltips.forEach(tooltip => {
    if (tooltip) {
      tooltip.style.display = 'none';
      tooltip.style.visibility = 'hidden';
      tooltip.style.opacity = '0';
    }
  });
}

// Ejecutar solo una vez al cargar
document.addEventListener("DOMContentLoaded", function() {
  removeOnlyTooltips();
  
  // Observar si aparecen nuevos tooltips dinámicamente
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.addedNodes.length > 0) {
        removeOnlyTooltips();
      }
    });
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
});