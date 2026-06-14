
(function() {
  if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", changeHref);
  } else {
    changeHref();
  }
  function changeHref() {
    const links = document.querySelectorAll('.personalized-combo-intel.brand-theme .link-more');
    links.forEach(link => {
      const href = link.getAttribute('href');
      if (href && href.includes('cm_sp') && href.endsWith('-msi')) {
        const newHref = href.replace(/-msi$/, '-asus');
        link.setAttribute('href', newHref);
      }
    });
  }
})();
