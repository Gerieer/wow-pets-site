document.addEventListener("DOMContentLoaded", () => {
    const toggle = document.querySelector(".navbar__toggle");
    const menu = document.getElementById("menu");
    const optionButtons = document.querySelectorAll(".options button, .pet-questions button, .results__filters button, .tips-interactive button");
    const searchForm = document.querySelector(".search-form");
    const resultsSection = document.querySelector(".results");
    const assistantForm = document.getElementById("assistant-form");
    const assistantResults = document.getElementById("assistant-results");

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
                showToast(`Opción seleccionada: ${selected}`);
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

    // --- Asistente de duelos: datos y lógica ---
    const petCatalog = buildPetCatalog();
    const typeCounters = buildTypeCounters();

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
                    title: "Necesitamos más datos",
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
        });
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
    // Catálogo de ejemplo con nombres mostrados en la web
    const items = [
        { name: "Mini Ragnaros", type: "elemental" },
        { name: "Zergling Aplastante", type: "bestia" },
        { name: "Aracnobot Trucado", type: "mecánico" },
        { name: "Criadora Esmeralda", type: "dragón" },
        { name: "Múrloc Caballero", type: "humanoide" },
        { name: "Fénix de Fuego Solar", type: "elemental" },
        { name: "Chispix el Reparador", type: "mecánico" },
        { name: "Horror Puntadafétida", type: "no-muerto" },
        { name: "Arúspice de Mareas", type: "acuático" },
        { name: "Sombra de Sabrestrella", type: "bestia" },
        { name: "Archivista Relojinte", type: "mágico" },
        { name: "Yeti Invernal Juvenil", type: "elemental" },
        { name: "Protovermis Temporal", type: "dragón" },
        { name: "Vulpin Mensajero", type: "bestia" },
        // Ejemplos adicionales por tipo para recomendaciones
        { name: "Halcón Ventoligero", type: "volador" },
        { name: "Búho de la Luna", type: "volador" }
    ];
    const dict = {};
    items.forEach(p => { dict[normalizeKey(p.name)] = p; });
    return dict;
}

function buildTypeCounters() {
    // Matriz simple basada en la guía de esta página (modelo simplificado)
    return {
        "bestia": ["mecánico"],
        "humanoide": ["bestia", "no-muerto"],
        "dragón": ["humanoide"],
        "no-muerto": ["acuático"],
        "mecánico": ["elemental"],
        "elemental": ["mágico"],
        "acuático": ["volador"],
        "volador": ["dragón"],
        "mágico": ["dragón"]
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
        "dragón": "Dragón",
        "no-muerto": "No-muerto",
        "mecánico": "Mecánico",
        "elemental": "Elemental",
        "acuático": "Acuático",
        "volador": "Volador",
        "mágico": "Mágico"
    };
    return map[type] || type;
}

function iconForType(type) {
    // Iconos sencillos con emojis como marcador visual
    const map = {
        "bestia": "🐾",
        "humanoide": "🛡️",
        "dragón": "🐉",
        "no-muerto": "💀",
        "mecánico": "⚙️",
        "elemental": "🔥",
        "acuático": "🌊",
        "volador": "🪽",
        "mágico": "✨"
    };
    return map[type] || "⚔️";
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
