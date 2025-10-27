document.addEventListener("DOMContentLoaded", () => {
    const toggle = document.querySelector(".navbar__toggle");
    const menu = document.getElementById("menu");
    const optionButtons = document.querySelectorAll(".options button, .pet-questions button, .results__filters button, .tips-interactive button");
    const searchForm = document.querySelector(".search-form");
    const resultsSection = document.querySelector(".results");

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
