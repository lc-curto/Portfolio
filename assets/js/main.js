document.addEventListener('DOMContentLoaded', () => {
  const menuButton = document.querySelector('.menu-button');
  const nav = document.querySelector('#main-nav');
  const backtop = document.querySelector('[data-backtop]');
  const sections = [...document.querySelectorAll('main section[id]')];

  menuButton?.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(isOpen));
  });

  nav?.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      menuButton?.setAttribute('aria-expanded', 'false');
    });
  });

  const updateBackToTop = () => backtop?.classList.toggle('show', window.scrollY > 500);
  window.addEventListener('scroll', updateBackToTop, { passive: true });
  updateBackToTop();

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      nav?.querySelectorAll('a').forEach((link) => {
        link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`);
      });
    });
  }, { rootMargin: '-35% 0px -55% 0px' });
  sections.forEach((section) => sectionObserver.observe(section));

  const timeline = document.querySelector('[data-timeline]');
  if (timeline) setupTimeline(timeline);

  const form = document.querySelector('[data-contact-form]');
  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    const fields = [...form.querySelectorAll('input, textarea')].map((field) => field.value);
    const [name, email, subject, message] = fields;
    const body = `Nome: ${name}\nEmail: ${email}\n\n${message}`;
    window.location.href = `mailto:lucas.scurto@gmail.com?subject=${encodeURIComponent(subject || 'Contacto pelo portfólio')}&body=${encodeURIComponent(body)}`;
  });
});

function setupTimeline(timeline) {
  const path = timeline.querySelector('[data-timeline-path]');
  const items = [...timeline.querySelectorAll('.timeline-item')];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let pathLength = 0;
  let frameRequested = false;
  let metrics = null;
  let lastVisibleIndex = -1;

  const buildPath = () => {
    if (window.innerWidth <= 800) {
      path.style.display = 'none';
      metrics = null;
      return;
    }

    path.style.display = 'block';
    const width = timeline.clientWidth;
    const height = timeline.scrollHeight;
    const points = items.map((item, index) => ({
      x: index % 2 === 0 ? width * .25 : width * .75,
      y: item.offsetTop + item.offsetHeight / 2
    }));
    const scaleX = 1000 / width;
    let d = `M ${points[0].x * scaleX} 0`;

    points.forEach((point, index) => {
      const x = point.x * scaleX;
      if (index === 0) {
        d += ` C 500 ${point.y * .45}, ${x} ${point.y * .55}, ${x} ${point.y}`;
        return;
      }
      const previous = points[index - 1];
      const middle = (previous.y + point.y) / 2;
      d += ` C ${previous.x * scaleX} ${middle}, ${x} ${middle}, ${x} ${point.y}`;
    });

    d += ` C 500 ${height - 100}, 500 ${height - 50}, 500 ${height}`;
    path.parentElement.setAttribute('viewBox', `0 0 1000 ${height}`);
    path.setAttribute('d', d);
    pathLength = path.getTotalLength();
    path.style.strokeDasharray = `${pathLength} ${pathLength}`;
    path.style.strokeDashoffset = pathLength;

    metrics = {
      top: timeline.getBoundingClientRect().top + window.scrollY,
      height,
      viewport: window.innerHeight,
      itemTops: items.map((item) => timeline.getBoundingClientRect().top + window.scrollY + item.offsetTop)
    };
    lastVisibleIndex = -1;
  };

  const updateTimeline = () => {
    frameRequested = false;
    if (!metrics || window.innerWidth <= 800) {
      items.forEach((item) => item.classList.add('visible'));
      return;
    }

    const scrollPosition = window.scrollY;
    const progress = reducedMotion
      ? 1
      : Math.min(1, Math.max(0, (scrollPosition + metrics.viewport * .82 - metrics.top) / (metrics.height + metrics.viewport * .15)));

    path.style.strokeDashoffset = String(pathLength * (1 - progress));

    const visibleIndex = metrics.itemTops.reduce((last, itemTop, index) => (
      itemTop - scrollPosition < metrics.viewport * .76 ? index : last
    ), -1);
    if (visibleIndex !== lastVisibleIndex) {
      items.forEach((item, index) => item.classList.toggle('visible', index <= visibleIndex));
      lastVisibleIndex = visibleIndex;
    }
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

  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', rebuild, { passive: true });
  window.addEventListener('load', rebuild, { once: true });
  rebuild();
}
