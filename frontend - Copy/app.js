(() => {
  // Create toast stack once
  const ensureToastStack = () => {
    let stack = document.querySelector(".toast-stack");
    if (!stack) {
      stack = document.createElement("div");
      stack.className = "toast-stack";
      document.body.appendChild(stack);
    }
    return stack;
  };

  const buildToast = (message, type = "info", duration = 3800) => {
    const stack = ensureToastStack();
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.setAttribute("role", "status");
    toast.innerHTML = `
      <div class="toast-bar"></div>
      <div class="toast-content">
        <span class="toast-dot"></span>
        <span>${message}</span>
        <button class="toast-close" aria-label="Dismiss notification">&times;</button>
      </div>
    `;

    const close = () => {
      toast.classList.add("hide");
      setTimeout(() => toast.remove(), 260);
    };

    toast.querySelector(".toast-close").addEventListener("click", close);
    stack.appendChild(toast);
    // Trigger animation
    requestAnimationFrame(() => toast.classList.add("show"));

    if (duration > 0) {
      setTimeout(close, duration);
    }
  };

  window.showToast = (message, type = "info", duration) =>
    buildToast(message, type, duration || 3800);

  // Mobile nav toggle
  const navToggle = document.querySelector(".nav-toggle");
  const siteNav = document.querySelector(".site-nav");
  const toggleNav = () => {
    if (!navToggle || !siteNav) return;
    const isOpen = siteNav.classList.toggle("open");
    navToggle.classList.toggle("open", isOpen);
    navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    document.body.classList.toggle("nav-open", isOpen);
  };

  if (navToggle && siteNav) {
    navToggle.addEventListener("click", toggleNav);
    siteNav.querySelectorAll("a").forEach((link) =>
      link.addEventListener("click", () => {
        if (siteNav.classList.contains("open")) toggleNav();
      }),
    );
  }

  // Highlight current nav item
  const currentPath = window.location.pathname.replace(/\\/g, "/");
  const normalize = (href) => {
    try {
      const url = new URL(href, window.location.origin);
      let p = url.pathname;
      if (p === "/") p = "/index.html";
      return p;
    } catch (_) {
      return href;
    }
  };
  if (siteNav) {
    const links = siteNav.querySelectorAll("a");
    links.forEach((link) => {
      const linkPath = normalize(link.getAttribute("href") || "");
      const pagePath =
        currentPath === "/" ? "/index.html" : currentPath.toLowerCase();
      if (pagePath.endsWith(linkPath.toLowerCase())) {
        link.classList.add("active");
      }
    });
  }
})();
