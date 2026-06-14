(function () {
  const { currentScript } = document;
  const script =
    new URL(currentScript.src) || new URL(currentScript.getAttribute("src"));

  const appId = script.searchParams.get("appId");
  const environment = script.searchParams.get("environment");

  const srcUrls = {
    local: "http://localhost:3005/dist/tc-plugins.es.js", // local dev server URL defined in vite.config.js
    staging:
      "https://unpkg.com/tapcart-capture-kit@staging/dist/tc-plugins.es.js",
    production:
      "https://unpkg.com/tapcart-capture-kit@production/dist/tc-plugins.es.js",
  };
  const srcUrl = srcUrls[environment] || srcUrls.production;

  window["tapcartParams"] = { appId, environment };

  // Create a new script element with type module
  const moduleScript = document.createElement("script");
  moduleScript.type = "module";
  moduleScript.src = srcUrl;
  document.head.appendChild(moduleScript);

  moduleScript.onerror = function () {
    console.error("The script failed to load.");
  };
})();