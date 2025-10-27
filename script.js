﻿document.addEventListener("DOMContentLoaded", () => {
    const toggle = document.querySelector(".navbar__toggle");
    const menu = document.getElementById("menu");
    const optionButtons = document.querySelectorAll(".options button, .pet-questions button, .results__filters button, .tips-interactive button");
    const searchForm = document.querySelector(".search-form");
    const resultsSection = document.querySelector(".results");
    const assistantForm = document.getElementById("assistant-form");
    const assistantResults = document.getElementById("assistant-results");
    const petTargetInput = document.getElementById("petTarget");
    const suggestionsEl = document.getElementById("assistant-suggestions");

    if (toggle && menu) {
        toggle.addEventListener("click", () => {
            const expanded = toggle.getAttribute("aria-expanded") === "true";
            toggle.setAttribute("aria-expanded", String(!expanded));
            menu.setAttribute("aria-expanded", String(!expanded));
            menu.classList.toggle("is-open");
        });
    }

    optionButtons.forEach(button => {
        button.addEventListener("click", () => {
            const selected = button.textContent?.trim();
            if (selected) {
                showToast(`OpciÃ³n seleccionada: ${selected}`);
            }
        });
    });

    if (searchForm && resultsSection) {
        searchForm.addEventListener("submit", event => {
            event.preventDefault();
            const nombreInput = document.getElementById("nombre");
            const reinoInput = document.getElementById("reino");
            const regionSelect = document.getElementById("region");
            const nombre = nombreInput ? nombreInput.value.trim() : "";
            const reino = reinoInput ? reinoInput.value.trim() : "";
            const region = regionSelect ? regionSelect.value : "";

            if (!nombre || !reino || !region) {
                showToast("Por favor, completa todos los campos para buscar tu personaje.");
                return;
            }

            resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
            showToast(`Buscando mascotas de ${nombre} en ${reino} (${region}).`);
        });
    }

    // --- Asistente de duelos: datos y lÃ³gica ---
    const petCatalog = buildPetCatalog();
    const typeCounters = buildTypeCounters();

    // Try to load Blizzard dataset if available (built at deploy time)
    loadExternalPetsDataset().then(dataset => {
        if (dataset && Array.isArray(dataset.pets)) {
            mergeExternalPets(petCatalog, dataset.pets);
            indexSpeciesIconsFromDataset(dataset.pets); replacePlaceholdersWithIcons(dataset.pets);
        }
    }).catch(() => {/* ignore */});

    if (assistantForm && assistantResults) {
        assistantForm.addEventListener("submit", e => {
            e.preventDefault();
            const nameInput = document.getElementById("petTarget");
            const typeSelect = document.getElementById("petType");
            const targetName = nameInput ? nameInput.value.trim() : "";
            let targetType = "";

            // Detectar tipo por nombre si existe
            if (targetName) {
                const key = normalizeKey(targetName);
                if (petCatalog[key]) {
                    targetType = petCatalog[key].type;
                }
            }

            // Si no detectamos por nombre, tomar el tipo del selector
            if (!targetType && typeSelect && typeSelect.value) {
                targetType = typeSelect.value;
            }

            if (!targetType) {
                showAssistantResult(assistantResults, {
                    title: "Necesitamos mÃ¡s datos",
                    html: `<p>No hemos podido identificar el tipo. Indica el <strong>tipo de la mascota</strong> en el desplegable o escribe un <strong>nombre conocido</strong>.</p>`
                });
                return;
            }

            const counters = typeCounters[targetType] || [];
            if (!counters.length) {
                showAssistantResult(assistantResults, {
                    title: "Sin datos de contra",
                    html: `<p>No tenemos recomendaciones para el tipo <strong>${escapeHtml(targetType)}</strong> por ahora.</p>`
                });
                return;
            }

            const counterBlocks = counters.map(ct => {
                const samples = getSamplePetsByType(petCatalog, ct, 3);
                const sampleHtml = samples.length
                    ? `<div class="assistant-samples">Ejemplos: ${samples.map(n => `<span class="chip">${escapeHtml(n)}</span>`).join(" ")}</div>`
                    : "";
                return `<div class="assistant-counter">
                    <div class="chip chip--type">${iconForType(ct)} ${labelForType(ct)}</div>
                    ${sampleHtml}
                </div>`;
            }).join("");

            const detected = targetName ? `<p>Objetivo: <strong>${escapeHtml(targetName)}</strong> ${petCatalog[normalizeKey(targetName)] ? `(tipo detectado: ${labelForType(targetType)})` : `(tipo indicado: ${labelForType(targetType)})`}</p>`
                                         : `<p>Tipo objetivo: <strong>${labelForType(targetType)}</strong></p>`;

            showAssistantResult(assistantResults, {
                title: "Tipos recomendados para vencer",
                html: `${detected}<div class="assistant-counter-grid">${counterBlocks}</div>
                <p class="help">Consejo: prioriza mascotas con <strong>velocidad</strong> alta o control si el rival escala con el tiempo.</p>`
            });
        });

        assistantForm.addEventListener("reset", () => {
            if (assistantResults) assistantResults.hidden = true;
            if (suggestionsEl) suggestionsEl.hidden = true;
        });
    }

    // Typeahead suggestions
    if (petTargetInput && suggestionsEl) {
        petTargetInput.addEventListener("input", () => {
            const q = petTargetInput.value.trim();
            updateSuggestions(q, petCatalog, suggestionsEl);
        });
        petTargetInput.addEventListener("blur", () => setTimeout(() => suggestionsEl.hidden = true, 150));
    }
});

function showToast(message) {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("is-visible"));
    setTimeout(() => {
        toast.classList.remove("is-visible");
        setTimeout(() => toast.remove(), 300);
    }, 2800);
}

// Utils y datos del asistente
function normalizeKey(s) {
    return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

function buildPetCatalog() {
    // CatÃ¡logo de ejemplo con nombres mostrados en la web
    const items = [
        { name: "Mini Ragnaros", type: "elemental" },
        { name: "Zergling Aplastante", type: "bestia" },
        { name: "Aracnobot Trucado", type: "mecÃ¡nico" },
        { name: "Criadora Esmeralda", type: "dragÃ³n" },
        { name: "MÃºrloc Caballero", type: "humanoide" },
        { name: "FÃ©nix de Fuego Solar", type: "elemental" },
        { name: "Chispix el Reparador", type: "mecÃ¡nico" },
        { name: "Horror PuntadafÃ©tida", type: "no-muerto" },
        { name: "ArÃºspice de Mareas", type: "acuÃ¡tico" },
        { name: "Sombra de Sabrestrella", type: "bestia" },
        { name: "Archivista Relojinte", type: "mÃ¡gico" },
        { name: "Yeti Invernal Juvenil", type: "elemental" },
        { name: "Protovermis Temporal", type: "dragÃ³n" },
        { name: "Vulpin Mensajero", type: "bestia" },
        // Ejemplos adicionales por tipo para recomendaciones
        { name: "HalcÃ³n Ventoligero", type: "volador" },
        { name: "BÃºho de la Luna", type: "volador" }
    ];
    const dict = {};
    items.forEach(p => { dict[normalizeKey(p.name)] = p; });
    return dict;
}

function buildTypeCounters() {
    // Matriz simple basada en la guÃ­a de esta pÃ¡gina (modelo simplificado)
    return {
        "bestia": ["mecÃ¡nico"],
        "humanoide": ["bestia", "no-muerto"],
        "dragÃ³n": ["humanoide"],
        "no-muerto": ["acuÃ¡tico"],
        "mecÃ¡nico": ["elemental"],
        "elemental": ["mÃ¡gico"],
        "acuÃ¡tico": ["volador"],
        "volador": ["dragÃ³n"],
        "mÃ¡gico": ["dragÃ³n"]
    };
}

function getSamplePetsByType(catalog, type, maxCount = 3) {
    const out = [];
    for (const key in catalog) {
        if (catalog[key].type === type) {
            out.push(catalog[key].name);
        }
        if (out.length >= maxCount) break;
    }
    return out;
}

function labelForType(type) {
    const map = {
        "bestia": "Bestia",
        "humanoide": "Humanoide",
        "dragÃ³n": "DragÃ³n",
        "no-muerto": "No-muerto",
        "mecÃ¡nico": "MecÃ¡nico",
        "elemental": "Elemental",
        "acuÃ¡tico": "AcuÃ¡tico",
        "volador": "Volador",
        "mÃ¡gico": "MÃ¡gico"
    };
    return map[type] || type;
}

function iconForType(type) {
    // Iconos sencillos con emojis como marcador visual
    const map = {
        "bestia": "ðŸ¾",
        "humanoide": "ðŸ›¡ï¸",
        "dragÃ³n": "ðŸ‰",
        "no-muerto": "ðŸ’€",
        "mecÃ¡nico": "âš™ï¸",
        "elemental": "ðŸ”¥",
        "acuÃ¡tico": "ðŸŒŠ",
        "volador": "ðŸª½",
        "mÃ¡gico": "âœ¨"
    };
    return map[type] || "âš”ï¸";
}

function showAssistantResult(container, { title, html }) {
    container.hidden = false;
    const summary = container.querySelector(".assistant-summary");
    const counters = container.querySelector(".assistant-counters");
    summary.innerHTML = `<h5>${escapeHtml(title)}</h5>`;
    counters.innerHTML = html;
    container.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function escapeHtml(str) {
    return String(str).replace(/[&<>"]/g, (c) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;"
    })[c]);
}

async function loadExternalPetsDataset() {
    try {
        const res = await fetch('data/pets.json', { cache: 'no-store' });
        if (!res.ok) return null;
        return await res.json();
    } catch (e) {
        return null;
    }
}

function mergeExternalPets(catalog, pets) {
    pets.forEach(p => {
        if (!p || !p.name) return;
        const key = normalizeKey(p.name);
        if (!catalog[key]) {
            catalog[key] = { name: p.name, type: p.type || '' };
        } else if (!catalog[key].type && p.type) {
            catalog[key].type = p.type;
        }
        if (p.icon) catalog[key].icon = p.icon;
    });
}

function replacePlaceholdersWithIcons(pets) {
    const map = new Map();
    pets.forEach(p => map.set(normalizeKey(p.name), p.icon));
    document.querySelectorAll('.image-placeholder[data-pet-name]').forEach(el => {
        const name = el.getAttribute('data-pet-name');
        const icon = name ? map.get(normalizeKey(name)) : null;
        if (icon) {
            el.innerHTML = `<img src="${icon}" alt="Icono de ${escapeHtml(name)}" />`;
            el.classList.remove('image-placeholder');
        }
    });
}

function updateSuggestions(query, catalog, container) {
    const q = normalizeKey(query);
    if (!q) { container.hidden = true; container.innerHTML = ''; return; }
    const all = Object.values(catalog);
    const matches = [];
    for (let i = 0; i < all.length; i++) {
        const n = all[i].name;
        if (normalizeKey(n).includes(q)) matches.push(all[i]);
        if (matches.length >= 12) break;
    }
    if (!matches.length) { container.hidden = true; container.innerHTML = ''; return; }
    container.innerHTML = matches.map(m => {
        const icon = m.icon ? `<img src="${m.icon}" alt="" />` : '';
        return `<div class="item" role="option" data-name="${escapeHtml(m.name)}">${icon}<span>${escapeHtml(m.name)}</span></div>`;
    }).join('');
    container.hidden = false;
    container.querySelectorAll('.item').forEach(item => {
        item.addEventListener('mousedown', (ev) => {
            ev.preventDefault();
            const name = item.getAttribute('data-name');
            const input = document.getElementById('petTarget');
            if (input) input.value = name || '';
            container.hidden = true;
            // Auto detect type and fill select
            const key = normalizeKey(name || '');
            const sel = document.getElementById('petType');
            if (sel && catalog[key] && catalog[key].type) sel.value = catalog[key].type;
        });
    });
}


// speciesId -> iconUrl indexed from data/pets.json
const speciesIconById = new Map();
function indexSpeciesIconsFromDataset(externalPets) {
  try {
    if (!Array.isArray(externalPets)) return;
    for (const p of externalPets) {
      if (p && typeof p.id === 'number' && p.icon) {
        speciesIconById.set(p.id, p.icon);
      }
    }
  } catch {}
}

(function setupCharacterLookup(){
  const btn = document.getElementById('btnConnectBnet');
  if (!btn) return;

  const API_BASE = window.WOW_API_BASE || 'https://YOUR_NETLIFY_SITE.netlify.app/.netlify/functions';

  btn.addEventListener('click', () => {
    const nombre = document.getElementById('nombre');
    const reino = document.getElementById('reino');
    const regionSel = document.getElementById('region');

    const characterName = nombre ? (nombre.value || '').trim() : '';
    let realmSlug = document.getElementById('realmSlug') ? document.getElementById('realmSlug').value.trim() : '';
    if (!realmSlug && reino) realmSlug = toRealmSlug(reino.value || '');
    const region = (regionSel ? regionSel.value : 'EU').toLowerCase();
    const origin = window.location.origin;

    const url = new URL(${API_BASE}/oauth-start);
    if (realmSlug) url.searchParams.set('realmSlug', realmSlug);
    if (characterName) url.searchParams.set('characterName', characterName);
    url.searchParams.set('region', region);
    url.searchParams.set('origin', origin);

    const w = 520, h = 700;
    const left = (window.screen.width - w) / 2;
    const top = (window.screen.height - h) / 2;
    const popup = window.open(url.toString(), 'wowPetsAuth', width=,height=,left=,top=);

    window.addEventListener('message', onAuthMessage, { once: true });

    // safety: close listener if popup closed without message
    const t = setInterval(() => { try { if (popup && popup.closed) { window.removeEventListener('message', onAuthMessage); clearInterval(t); } } catch {} }, 1000);
  });

  function onAuthMessage(ev) {
    try {
      if (!ev || !ev.data || ev.data.type !== 'wowPetsAuth') return;
      const data = ev.data.data;
      const container = document.getElementById('characterPets');
      if (!container) return;

      if (!data || !data.ok) {
        container.innerHTML = <p class="error">Error: </p>;
        return;
      }

      const pets = Array.isArray(data.pets) ? data.pets : [];
      const region = (data.region || 'eu').toLowerCase();

      if (pets.length === 0) {
        container.innerHTML = <p>No se encontraron mascotas en la colección.</p>;
        return;
      }

      const items = pets.slice(0, 200).map(p => {
        const nm = escapeHtml(p.name || #);
        const iconUrl = (p.speciesId && speciesIconById.get(p.speciesId)) || '';
        const img = iconUrl
          ? <img class="pet-thumb" src="" alt="Icono " loading="lazy" />
          : <span class="pet-thumb" aria-hidden="true" style="display:inline-block;text-align:center;line-height:36px;"></span>;
        const lvl = p.level ?  (nivel ) : '';
        const q = p.quality ?  -  : '';
        return <li><span class="pet-meta"></span></li>;
      }).join('');

      container.innerHTML = 
        <h3>Mascotas de  @ </h3>
        <p>Total: </p>
        <ul class="character-pet-list"></ul>
      ;
    } catch {}
  }

  function toRealmSlug(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }
})();

// speciesId -> iconUrl indexed from data/pets.json
const speciesIconById = new Map();
function indexSpeciesIconsFromDataset(externalPets) {
  try {
    if (!Array.isArray(externalPets)) return;
    for (const p of externalPets) {
      if (p && typeof p.id === 'number' && p.icon) {
        speciesIconById.set(p.id, p.icon);
      }
    }
  } catch {}
}

(function setupCharacterLookup(){
  const btn = document.getElementById('btnConnectBnet');
  if (!btn) return;

  const API_BASE = window.WOW_API_BASE || 'https://YOUR_NETLIFY_SITE.netlify.app/.netlify/functions';

  btn.addEventListener('click', () => {
    const nombre = document.getElementById('nombre');
    const reino = document.getElementById('reino');
    const regionSel = document.getElementById('region');

    const characterName = nombre ? (nombre.value || '').trim() : '';
    let realmSlug = document.getElementById('realmSlug') ? document.getElementById('realmSlug').value.trim() : '';
    if (!realmSlug && reino) realmSlug = toRealmSlug(reino.value || '');
    const region = (regionSel ? regionSel.value : 'EU').toLowerCase();
    const origin = window.location.origin;

    const url = new URL(${API_BASE}/oauth-start);
    if (realmSlug) url.searchParams.set('realmSlug', realmSlug);
    if (characterName) url.searchParams.set('characterName', characterName);
    url.searchParams.set('region', region);
    url.searchParams.set('origin', origin);

    const w = 520, h = 700;
    const left = (window.screen.width - w) / 2;
    const top = (window.screen.height - h) / 2;
    const popup = window.open(url.toString(), 'wowPetsAuth', width=,height=,left=,top=);

    window.addEventListener('message', onAuthMessage, { once: true });

    const t = setInterval(() => { try { if (popup && popup.closed) { window.removeEventListener('message', onAuthMessage); clearInterval(t); } } catch {} }, 1000);
  });

  function onAuthMessage(ev) {
    try {
      if (!ev || !ev.data || ev.data.type !== 'wowPetsAuth') return;
      const data = ev.data.data;
      const container = document.getElementById('characterPets');
      if (!container) return;

      if (!data || !data.ok) {
        container.innerHTML = <p class="error">Error: </p>;
        return;
      }

      const pets = Array.isArray(data.pets) ? data.pets : [];
      const region = (data.region || 'eu').toLowerCase();

      if (pets.length === 0) {
        container.innerHTML = <p>No se encontraron mascotas en la colección.</p>;
        return;
      }

      const items = pets.slice(0, 200).map(p => {
        const nm = escapeHtml(p.name || #);
        const iconUrl = (p.speciesId && speciesIconById.get(p.speciesId)) || '';
        const img = iconUrl
          ? <img class="pet-thumb" src="" alt="Icono " loading="lazy" />
          : <span class="pet-thumb" aria-hidden="true" style="display:inline-block;text-align:center;line-height:36px;"></span>;
        const lvl = p.level ?  (nivel ) : '';
        const q = p.quality ?  -  : '';
        return <li><span class="pet-meta"></span></li>;
      }).join('');

      container.innerHTML = 
        <h3>Mascotas de  @ </h3>
        <p>Total: </p>
        <ul class="character-pet-list"></ul>
      ;
    } catch {}
  }

  function toRealmSlug(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }
})();
