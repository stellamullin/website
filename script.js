document.addEventListener("DOMContentLoaded", () => {
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  // Open external links safely in a new tab.
  document.querySelectorAll('a[href^="http"]').forEach((link) => {
    link.target = "_blank";
    link.rel = "noopener noreferrer";
  });

  // Issue date and copyright year.
  const now = new Date();
  const issueDate = document.querySelector("#issue-date");
  const currentYear = document.querySelector("#current-year");

  if (issueDate) {
    issueDate.textContent = new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(now);
  }

  if (currentYear) {
    currentYear.textContent = String(now.getFullYear());
  }

  // Hide the fallback monogram after the portrait successfully loads.
  const portrait = document.querySelector(".cover-portrait img");

  if (portrait) {
    const handlePortraitState = () => {
      portrait.style.display =
        portrait.complete && portrait.naturalWidth ? "block" : "none";
    };

    portrait.addEventListener("load", handlePortraitState);
    portrait.addEventListener("error", handlePortraitState);
    handlePortraitState();
  }

  // Mobile navigation.
  const menuToggle = document.querySelector(".menu-toggle");
  const siteMenu = document.querySelector("#site-menu");

  const closeMenu = () => {
    if (!menuToggle || !siteMenu) return;

    menuToggle.setAttribute("aria-expanded", "false");
    siteMenu.classList.remove("is-open");
    document.body.classList.remove("menu-open");
  };

  if (menuToggle && siteMenu) {
    menuToggle.addEventListener("click", () => {
      const isOpen = menuToggle.getAttribute("aria-expanded") === "true";

      menuToggle.setAttribute("aria-expanded", String(!isOpen));
      siteMenu.classList.toggle("is-open", !isOpen);
      document.body.classList.toggle("menu-open", !isOpen);
    });

    siteMenu.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener("click", closeMenu);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeMenu();
      }
    });
  }

  // Smooth in-page navigation with browser history preserved.
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (event) => {
      const id = anchor.getAttribute("href");

      if (!id || id === "#") return;

      const target = document.querySelector(id);

      if (!target) return;

      event.preventDefault();

      target.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "start",
      });

      history.pushState(null, "", id);
    });
  });

  // Reveal animation.
  const revealElements = document.querySelectorAll(".reveal");

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    revealElements.forEach((element) => {
      element.classList.add("is-visible");
    });
  } else {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -7% 0px",
      }
    );

    revealElements.forEach((element) => {
      revealObserver.observe(element);
    });
  }

  // Active section state in the sticky navigation.
  const sections = document.querySelectorAll("[data-section]");
  const navLinks = document.querySelectorAll(
    '.primary-nav a[href^="#"]'
  );

  if ("IntersectionObserver" in window) {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (firstEntry, secondEntry) =>
              secondEntry.intersectionRatio -
              firstEntry.intersectionRatio
          )[0];

        if (!visible) return;

        navLinks.forEach((link) => {
          const isCurrent =
            link.getAttribute("href") === `#${visible.target.id}`;

          link.classList.toggle("is-active", isCurrent);

          if (isCurrent) {
            link.setAttribute("aria-current", "page");
          } else {
            link.removeAttribute("aria-current");
          }
        });
      },
      {
        threshold: [0.2, 0.45, 0.7],
        rootMargin: "-25% 0px -55% 0px",
      }
    );

    sections.forEach((section) => {
      sectionObserver.observe(section);
    });
  }

  // Reading progress and restrained portrait movement.
  const progressBar = document.querySelector(
    ".reading-progress__bar"
  );

  const portraitImage = document.querySelector(
    ".cover-portrait img"
  );

  let ticking = false;

  const updateOnScroll = () => {
    const scrollTop = window.scrollY;
    const total =
      document.documentElement.scrollHeight - window.innerHeight;

    const progress =
      total > 0 ? Math.min(scrollTop / total, 1) : 0;

    if (progressBar) {
      progressBar.style.transform = `scaleX(${progress})`;
    }

    if (portraitImage && !prefersReducedMotion) {
      const portraitRect = portraitImage.getBoundingClientRect();

      const isNearViewport =
        portraitRect.bottom > -200 &&
        portraitRect.top < window.innerHeight + 200;

      if (isNearViewport) {
        const shift = Math.max(
          -20,
          Math.min(20, portraitRect.top * -0.025)
        );

        portraitImage.style.setProperty(
          "--portrait-shift",
          `${shift}px`
        );
      }
    }

    ticking = false;
  };

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        window.requestAnimationFrame(updateOnScroll);
        ticking = true;
      }
    },
    { passive: true }
  );

  updateOnScroll();
});