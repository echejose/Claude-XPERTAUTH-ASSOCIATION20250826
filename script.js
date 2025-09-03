// script.js - VERSIÓN CORREGIDA
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  "https://gpanqnyxmzpbnlixcttw.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdwYW5xbnl4bXpwYm5saXhjdHR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5ODY0NjAsImV4cCI6MjA2OTU2MjQ2MH0.wYQFfLuKlSY94eHES691SF7jrMHVfRFGrXsq2-CFbAk"
);

console.log("✅ script.js cargado en", location.pathname);

/* ========= NAVEGACIÓN MEJORADA ========= */
function fixNavigation() {
  // Corregir todos los enlaces de navegación para que funcionen desde cualquier página
  const navLinks = document.querySelectorAll('.site-nav a, .footer a');
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href && href.startsWith('index.html#')) {
      // Si estamos en contacto.html y el enlace va a index.html#seccion
      if (window.location.pathname.includes('contacto.html')) {
        // Mantener el enlace tal como está para navegar a index.html
        return;
      }
      // Si estamos en index.html, hacer scroll suave a la sección
      if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
        link.addEventListener('click', function(e) {
          e.preventDefault();
          const sectionId = href.split('#')[1];
          const section = document.getElementById(sectionId);
          if (section) {
            section.scrollIntoView({ behavior: 'smooth' });
          }
        });
      }
    }
  });
}

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

/* ========= BLOG (3 últimas) - VERSIÓN CORREGIDA ========= */
const TABLE_BLOG = "blog_posts";
const esc = (s = "") =>
  s.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));

// Lista de imágenes de fallback locales disponibles
const FALLBACK_IMAGES = [
  "/images/blog/bienvenidos-xpertauth.jpg",
  "/images/blog/transporte-especial.jpg", 
  "/images/blog/normativa.jpg"
];

async function loadBlogCards() {
  const container = document.getElementById("blog-row");
  console.log("🧩 blog-row encontrado?", !!container);
  if (!container) return;

  container.innerHTML = "<p style='text-align:center;opacity:.6'>Cargando entradas…</p>";

  try {
    const { data, error } = await supabase
      .from(TABLE_BLOG)
      .select("title, excerpt, url, cover_image, published_at, is_published")
      .eq("is_published", true)
      .order("published_at", { ascending: false })
      .limit(3);

    console.log("📦 resultado Supabase", { error, data });

    if (error) {
      console.error("Error Supabase:", error);
      // Mostrar contenido de fallback si hay error
      loadFallbackBlog(container);
      return;
    }

    if (!data || data.length === 0) {
      // Si no hay datos, mostrar blog de fallback
      loadFallbackBlog(container);
      return;
    }

    // Pintamos de antigua → nueva para que la más reciente quede a la DERECHA
    const items = [...data].reverse();

    container.innerHTML = items
      .map((p, index) => {
        // Usar imagen de fallback si no hay cover_image o es inválida
        const fallbackImage = FALLBACK_IMAGES[index] || FALLBACK_IMAGES[0];
        const imageUrl = p.cover_image && p.cover_image.trim() !== '' ? p.cover_image : fallbackImage;
        
        return `
          <a href="${p.url || '#'}" class="blog-card" target="_blank" rel="noopener">
            <img src="${imageUrl}" alt="${esc(p.title)}" class="card-image" onerror="this.src='${fallbackImage}';">
            <div class="card-content">
              <h3 class="card-title">${esc(p.title)}</h3>
              <p class="card-description">${esc(p.excerpt || "Descubre más sobre transporte especial y normativas.")}</p>
            </div>
          </a>`;
      })
      .join("");

    // Configurar carga lazy y manejo de errores
    setupImageErrorHandling(container);

  } catch (error) {
    console.error("Error cargando blog:", error);
    loadFallbackBlog(container);
  }
}

// Función para mostrar blog de fallback cuando no hay conexión o datos
function loadFallbackBlog(container) {
  const fallbackPosts = [
    {
      title: "Permisos de Transporte Especial en Catalunya",
      excerpt: "Todo lo que necesitas saber sobre la normativa vigente para transportes especiales.",
      url: "https://xpertauthblog.wordpress.com",
      image: "/images/blog/bienvenidos-xpertauth.jpg"
    },
    {
      title: "Novedades DGT 2025",
      excerpt: "Las últimas actualizaciones en regulación de transportes especiales.",
      url: "https://xpertauthblog.wordpress.com", 
      image: "/images/blog/transporte-especial.jpg"
    },
    {
      title: "IA Aplicada al Transporte",
      excerpt: "Cómo la inteligencia artificial está revolucionando el sector del transporte especial.",
      url: "https://xpertauthblog.wordpress.com",
      image: "/images/blog/normativa.jpg"
    }
  ];

  container.innerHTML = fallbackPosts
    .map(post => `
      <a href="${post.url}" class="blog-card" target="_blank" rel="noopener">
        <img src="${post.image}" alt="${esc(post.title)}" class="card-image" onerror="this.src='/images/blog/bienvenidos-xpertauth.jpg';">
        <div class="card-content">
          <h3 class="card-title">${esc(post.title)}</h3>
          <p class="card-description">${esc(post.excerpt)}</p>
        </div>
      </a>`)
    .join("");

  setupImageErrorHandling(container);
}

// Configurar manejo de errores de imagen y carga lazy
function setupImageErrorHandling(container) {
  const images = container.querySelectorAll(".blog-card img");
  images.forEach((img, index) => {
    // Mejor rendimiento en carga
    img.loading = "lazy";
    img.decoding = "async";

    // Manejo robusto de errores de imagen
    img.addEventListener("error", function() {
      const fallbackImage = FALLBACK_IMAGES[index] || FALLBACK_IMAGES[0];
      if (this.src !== fallbackImage) {
        console.log("Imagen falló, usando fallback:", fallbackImage);
        this.src = fallbackImage;
      }
    }, { once: true });
  });
}

/* ========= Arranque ========= */
document.addEventListener("DOMContentLoaded", () => {
  fixNavigation();     // ✅ Corregir navegación
  initContactForm();   // ✅ Inicializar formulario
  loadBlogCards();     // ✅ Cargar blog con fallback robusto
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
