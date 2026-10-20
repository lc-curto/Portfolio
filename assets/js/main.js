document.addEventListener("DOMContentLoaded", () => {
    const year = document.querySelector("[data-current-year]");
    if (year) {
        year.textContent = new Date().getFullYear();
    }

    const nav = document.querySelector("#mainNav");
    if (nav && window.bootstrap) {
        nav.querySelectorAll('a[href^="#"]').forEach((link) => {
            link.addEventListener("click", () => {
                if (window.matchMedia("(max-width: 991.98px)").matches) {
                    window.bootstrap.Collapse.getOrCreateInstance(nav).hide();
                }
            });
        });
    }
});
