document.addEventListener("DOMContentLoaded", () => {
  const menuButton = document.querySelector(".menu-button");
  const nav = document.querySelector("#main-nav");
  const backtop = document.querySelector("[data-backtop]");
  const sections = [...document.querySelectorAll("main section[id]")];
  const network = document.querySelector(".network");
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  if (network && !reducedMotion) {
    window.addEventListener(
      "pointermove",
      (event) => {
        const x = (event.clientX / window.innerWidth - 0.5) * 12;
        const y = (event.clientY / window.innerHeight - 0.5) * 8;
        network.style.setProperty("--network-x", `${x.toFixed(2)}px`);
        network.style.setProperty("--network-y", `${y.toFixed(2)}px`);
      },
      { passive: true },
    );
  }

  menuButton?.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    menuButton.setAttribute("aria-expanded", String(isOpen));
  });

  nav?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("open");
      menuButton?.setAttribute("aria-expanded", "false");
    });
  });

  const updateBackToTop = () =>
    backtop?.classList.toggle("show", window.scrollY > 500);
  window.addEventListener("scroll", updateBackToTop, { passive: true });
  updateBackToTop();

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        nav?.querySelectorAll("a").forEach((link) => {
          link.classList.toggle(
            "active",
            link.getAttribute("href") === `#${entry.target.id}`,
          );
        });
      });
    },
    { rootMargin: "-35% 0px -55% 0px" },
  );
  sections.forEach((section) => sectionObserver.observe(section));

  const timeline = document.querySelector("[data-timeline]");
  if (timeline) setupTimeline(timeline);

  const form = document.querySelector("[data-contact-form]");
  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    const fields = [...form.querySelectorAll("input, textarea")].map(
      (field) => field.value,
    );
    const [name, email, subject, message] = fields;
    const body = `Nome: ${name}\nEmail: ${email}\n\n${message}`;
    window.location.href = `mailto:lucas.scurto@gmail.com?subject=${encodeURIComponent(subject || "Contacto pelo portfólio")}&body=${encodeURIComponent(body)}`;
  });
});

function setupTimeline(timeline) {
  const path = timeline.querySelector("[data-timeline-path]");
  const items = [...timeline.querySelectorAll(".timeline-item")];
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  let pathLength = 0;
  let frameRequested = false;
  let metrics = null;
  let lastVisibleIndex = -1;

  const buildPath = () => {
    const compactLayout = window.innerWidth <= 800;
    const height = timeline.scrollHeight;

    if (compactLayout) {
      path.style.display = "none";
      timeline.style.setProperty("--timeline-progress", "0%");
      metrics = {
        top: timeline.getBoundingClientRect().top + window.scrollY,
        height,
        viewport: window.innerHeight,
        itemProgresses: items.map(
          (item) => (item.offsetTop + item.offsetHeight * 0.2) / height,
        ),
      };
      lastVisibleIndex = -1;
      return;
    }

    path.style.display = "block";
    const width = timeline.clientWidth;
    const points = items.map((item, index) => ({
      x: width * (0.5 + (index % 2 === 0 ? -0.06 : 0.06)),
      y: item.offsetTop + item.offsetHeight / 2,
    }));
    const scaleX = 1000 / width;
    let d = `M ${width * 0.5 * scaleX} 0`;

    points.forEach((point, index) => {
      const x = point.x * scaleX;
      if (index === 0) {
        d += ` C 500 ${point.y * 0.45}, ${x} ${point.y * 0.55}, ${x} ${point.y}`;
        return;
      }
      const previous = points[index - 1];
      const middle = (previous.y + point.y) / 2;
      d += ` C ${previous.x * scaleX} ${middle}, ${x} ${middle}, ${x} ${point.y}`;
    });

    path.parentElement.setAttribute("viewBox", `0 0 1000 ${height}`);
    path.setAttribute("d", d);
    pathLength = path.getTotalLength();
    path.style.strokeDasharray = `${pathLength} ${pathLength}`;
    path.style.strokeDashoffset = pathLength;

    metrics = {
      top: timeline.getBoundingClientRect().top + window.scrollY,
      height,
      viewport: window.innerHeight,
      itemTops: items.map(
        (item) =>
          timeline.getBoundingClientRect().top +
          window.scrollY +
          item.offsetTop,
      ),
      itemProgresses: items.map(
        (item) => (item.offsetTop + item.offsetHeight * 0.35) / height,
      ),
    };
    lastVisibleIndex = -1;
  };

  const updateTimeline = () => {
    frameRequested = false;
    if (!metrics) {
      return;
    }

    const compactLayout = window.innerWidth <= 800;
    const rect = timeline.getBoundingClientRect();
    const viewport = window.visualViewport?.height || window.innerHeight;
    const start = viewport * 0.2;
    const end = viewport * 0.8;
    const travel = Math.max(1, rect.height - (end - start));
    const progress = reducedMotion
      ? 1
      : Math.min(1, Math.max(0, (start - rect.top) / travel));

    if (compactLayout) {
      timeline.style.setProperty("--timeline-progress", `${progress * 100}%`);
    } else {
      path.style.strokeDashoffset = String(pathLength * (1 - progress));
    }

    const visibleIndex = metrics.itemProgresses.reduce(
      (last, itemProgress, index) =>
        itemProgress <= progress ? index : last,
      -1,
    );
    items.forEach((item, index) =>
      item.classList.toggle("visible", index <= visibleIndex),
    );
    lastVisibleIndex = visibleIndex;
  };

  const requestUpdate = () => {
    if (frameRequested) return;
    frameRequested = true;
    window.requestAnimationFrame(updateTimeline);
  };

  const rebuild = () => {
    buildPath();
    updateTimeline();
  };

  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", rebuild, { passive: true });
  window.addEventListener("orientationchange", rebuild, { passive: true });
  window.visualViewport?.addEventListener("resize", rebuild, { passive: true });
  if (window.ResizeObserver) {
    const observer = new ResizeObserver(rebuild);
    observer.observe(timeline);
  }
  document.fonts?.ready.then(rebuild);
  window.addEventListener("load", rebuild, { once: true });
  rebuild();
}

document.addEventListener("DOMContentLoaded", () => {
  const sideMenu = document.querySelector(".side-menu");
  const hero = document.querySelector(".hero");
  const footer = document.querySelector(".footer");

  if (!sideMenu || !hero || !footer) return;

  const updateSideMenu = () => {
    const menuRect = sideMenu.getBoundingClientRect();
    const heroRect = hero.getBoundingClientRect();
    const footerRect = footer.getBoundingClientRect();

    const overlapsHero =
      heroRect.top < menuRect.bottom && heroRect.bottom > menuRect.top;

    const overlapsFooter =
      footerRect.top < menuRect.bottom && footerRect.bottom > menuRect.top;

    sideMenu.classList.toggle("is-hidden", overlapsHero || overlapsFooter);
  };

  window.addEventListener("scroll", updateSideMenu, { passive: true });
  window.addEventListener("resize", updateSideMenu);

  updateSideMenu();
});
