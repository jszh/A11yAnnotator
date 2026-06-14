(function() {
  if (window.__ADNETIFY_SCRIPT) {
    console.log("PROS - Adnetify is already instantiated: ", window.__ADNETIFY_SCRIPT);
    return;
  }
  var adnetify = document.createElement('script')
  var src = (document.querySelectorAll('[data-container-id^="mm2-"]')).length > 0
    ? 'https://registry-modules.airtrfx.com/assets/adnetify/adnetify.js'
    : 'https://em-frontend-assets.airtrfx.com/mm/1.1.21/adnetify.js'
  adnetify.type = 'text/javascript'
  adnetify.src = src
  adnetify.onload = function () {
    console.info('Everymundo - adnetify loaded and ready')
  }
  adnetify.onerror = function () {
    console.info('Everymundo - adnetify could not be loaded')
  }
  document.body.appendChild(adnetify)
  window.__ADNETIFY_SCRIPT = src;
})()
