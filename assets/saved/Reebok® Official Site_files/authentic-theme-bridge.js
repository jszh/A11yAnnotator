/**
 * Authentic Theme Bridge
 *
 * Provides universal variant/price change detection and cart event normalization
 * across any Shopify theme. Eliminates the need for theme-specific event dispatching
 * by observing standard Shopify patterns (product form inputs, URL variant params).
 *
 * Configure via window.authenticThemeConfig (set before this script loads):
 * {
 *   disableVariantDetection: false,  // skip variant input/URL watching
 *   disablePriceObserver: false,     // skip MutationObserver on price elements
 *   disableCartNormalization: false,  // skip non-standard cart event forwarding
 *   priceSelectors: [],              // override price element selectors
 *   cartEvents: [],                  // override cart event names to normalize
 *   variantFormSelector: '',         // override product form selector
 * }
 */
(function authenticThemeBridge() {
  if (window._authenticThemeBridgeInitialized) return;
  window._authenticThemeBridgeInitialized = true;

  const config = window.authenticThemeConfig || {};

  const DEFAULTS = {
    priceSelectors: [
      '.price__regular .price-item--regular', // Dawn
      '.price .price-item--regular',          // Dawn alternate
      '.price__sale ins',                     // Release / DigiFist sale price
      '.price__regular > span:not(.visually-hidden)', // Release / DigiFist regular price
      '.product__price .money',               // Prestige / Impulse
      '[data-product-price]',                 // common data attribute
      '.product-single__price',               // Debut / older themes
      '.product__price',                      // generic
      '.price .money',                        // common money class
    ],
    cartEvents: [
      'cart:refresh',       // Prestige
      'cart:updated',       // Impulse
      'on:cart:add',        // some custom themes
      'ajaxProduct:added',  // Ajaxify / older patterns
      'cart:build',         // Pipeline / Starter
    ],
    variantFormSelector: 'form[action*="/cart/add"]',
  };

  const priceSelectors = config.priceSelectors || DEFAULTS.priceSelectors;
  const cartEvents = config.cartEvents || DEFAULTS.cartEvents;
  const variantFormSelector = config.variantFormSelector || DEFAULTS.variantFormSelector;

  let productData = null;
  let lastVariantId = null;
  let lastProductId = null;
  let variantDebounce = null;

  // ---------------------------------------------------------------------------
  // Utilities
  // ---------------------------------------------------------------------------

  function getProductHandle() {
    const match = window.location.pathname.match(/\/products\/([^/?#]+)/);
    return match ? match[1] : null;
  }

  async function fetchProductData(handle) {
    if (productData) return productData;
    try {
      const root = window.Shopify?.routes?.root || '/';
      const res = await fetch(`${root}products/${handle}.js`);
      if (!res.ok) return null;
      productData = await res.json();
      return productData;
    } catch (err) {
      console.warn('[authentic-bridge] Failed to fetch product data:', err);
      return null;
    }
  }

  function getVariantById(variantId) {
    if (!productData?.variants) return null;
    return productData.variants.find(
      (v) => v.id.toString() === variantId.toString()
    );
  }

  function parsePriceFromText(text) {
    if (!text) return null;
    const cleaned = text.replace(/[^0-9.,]/g, '').trim();
    if (!cleaned) return null;

    const lastComma = cleaned.lastIndexOf(',');
    const lastDot = cleaned.lastIndexOf('.');

    if (lastComma > lastDot) {
      return parseFloat(cleaned.replace(/\./g, '').replace(',', '.'));
    }
    if (lastDot > lastComma) {
      return parseFloat(cleaned.replace(/,/g, ''));
    }
    return parseFloat(cleaned);
  }

  /**
   * Reads the current PDP price from the first matching price element.
   * Returns price in the store's subunit (cents for USD) or null.
   */
  function readPriceFromDOM() {
    for (const selector of priceSelectors) {
      const el = document.querySelector(selector);
      if (!el) continue;

      const dataPrice =
        el.getAttribute('data-product-price') || el.getAttribute('data-price');
      if (dataPrice) {
        const parsed = parseFloat(dataPrice);
        if (!isNaN(parsed)) return parsed; // data attrs are typically in cents
      }

      const dollars = parsePriceFromText(el.textContent);
      if (dollars !== null && !isNaN(dollars)) return Math.round(dollars * 100);
    }
    return null;
  }

  // ---------------------------------------------------------------------------
  // Event dispatchers
  // ---------------------------------------------------------------------------

  function fireVariantPriceChange(priceInCents) {
    window.dispatchEvent(
      new CustomEvent('authentic:variant-price-change', {
        detail: { variantPrice: priceInCents / 100 },
      })
    );
  }

  function fireMembershipPriceChange(priceInCents) {
    window.dispatchEvent(
      new CustomEvent('authentic:membership-price-change', {
        detail: { pdpPrice: priceInCents.toString() },
      })
    );
  }

  function fireParentIdChange(productId) {
    if (!productId) return;
    const pid = productId.toString();
    if (pid === lastProductId) return;
    lastProductId = pid;
    window.dispatchEvent(
      new CustomEvent('authentic:membership-parent-id-change', {
        detail: { pid },
      })
    );
  }

  // ---------------------------------------------------------------------------
  // A. Variant Change Detection
  // ---------------------------------------------------------------------------

  async function handleVariantChange(variantId) {
    if (!variantId || variantId.toString() === lastVariantId) return;
    lastVariantId = variantId.toString();

    clearTimeout(variantDebounce);
    variantDebounce = setTimeout(async () => {
      const handle = getProductHandle();
      if (!handle) return;

      const data = await fetchProductData(handle);
      if (data) {
        fireParentIdChange(data.id);

        const variant = getVariantById(variantId);
        if (variant) {
          fireVariantPriceChange(variant.price);
          fireMembershipPriceChange(variant.price);
          return;
        }
      }

      // Fallback: read price from DOM after a short delay for theme to render
      setTimeout(() => {
        const domPrice = readPriceFromDOM();
        if (domPrice !== null) {
          fireVariantPriceChange(domPrice);
          fireMembershipPriceChange(domPrice);
        }
      }, 200);
    }, 100);
  }

  function watchFormInput(form) {
    if (!form || form._authenticBridgeWatched) return;
    form._authenticBridgeWatched = true;

    const input = form.querySelector('input[name="id"]');
    if (input) {
      // Intercept programmatic .value assignments (MutationObserver can't see these)
      const desc =
        Object.getOwnPropertyDescriptor(input, 'value') ||
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');

      if (desc) {
        Object.defineProperty(input, 'value', {
          get() {
            return desc.get.call(this);
          },
          set(v) {
            desc.set.call(this, v);
            handleVariantChange(v);
          },
          configurable: true,
        });
      }

      input.addEventListener('change', () => handleVariantChange(input.value));
    }

    const select = form.querySelector('select[name="id"]');
    if (select) {
      select.addEventListener('change', () => handleVariantChange(select.value));
    }
  }

  function initVariantDetection() {
    if (config.disableVariantDetection) return;
    if (!window.location.pathname.includes('/products/')) return;

    // Global-theme already dispatches variant/price events natively.
    // [data-member-price] is a server-rendered Liquid element unique to global-theme.
    if (document.querySelector('[data-member-price]')) return;

    // --- URL-based detection (history.pushState / replaceState) ---
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    function checkUrlVariant() {
      const params = new URLSearchParams(window.location.search);
      const urlVariant = params.get('variant');
      if (urlVariant) handleVariantChange(urlVariant);
    }

    history.pushState = function (...args) {
      originalPushState.apply(this, args);
      checkUrlVariant();
    };
    history.replaceState = function (...args) {
      originalReplaceState.apply(this, args);
      checkUrlVariant();
    };
    window.addEventListener('popstate', checkUrlVariant);

    // --- Form input detection ---
    document.querySelectorAll(variantFormSelector).forEach(watchFormInput);

    // Watch for dynamically-added product forms (section re-rendering, quick-view)
    const bodyObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType !== Node.ELEMENT_NODE) continue;
          if (node.matches?.(variantFormSelector)) watchFormInput(node);
          node.querySelectorAll?.(variantFormSelector).forEach(watchFormInput);
        }
      }
    });
    bodyObserver.observe(document.body, { childList: true, subtree: true });

    // Seed product data for later variant lookups
    const handle = getProductHandle();
    if (handle) fetchProductData(handle);

    // Pick up the current variant from the URL on first load
    checkUrlVariant();
  }

  // ---------------------------------------------------------------------------
  // B. Price Element Observation
  // ---------------------------------------------------------------------------

  function initPriceObserver() {
    if (config.disablePriceObserver) return;
    if (!window.location.pathname.includes('/products/')) return;

    // If the theme already provides [data-member-price], the popup's own
    // observeMemberPriceElement() handles it — skip to avoid double-firing.
    if (document.querySelector('[data-member-price]')) return;

    let priceElement = null;
    for (const selector of priceSelectors) {
      priceElement = document.querySelector(selector);
      if (priceElement) break;
    }
    if (!priceElement) return;

    const container =
      priceElement.closest('.price') ||
      priceElement.parentElement ||
      priceElement;
    let lastText = priceElement.textContent?.trim();

    const observer = new MutationObserver(() => {
      let currentEl = priceElement;
      if (!currentEl.isConnected) {
        for (const selector of priceSelectors) {
          currentEl = document.querySelector(selector);
          if (currentEl) break;
        }
        if (!currentEl) return;
        priceElement = currentEl;
      }

      const currentText = currentEl.textContent?.trim();
      if (currentText && currentText !== lastText) {
        lastText = currentText;
        const dollars = parsePriceFromText(currentText);
        if (dollars !== null && !isNaN(dollars)) {
          const cents = Math.round(dollars * 100);
          fireMembershipPriceChange(cents);
          fireVariantPriceChange(cents);
        }
      }
    });

    observer.observe(container, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }

  // ---------------------------------------------------------------------------
  // C. Cart Event Normalization
  // ---------------------------------------------------------------------------

  function extractCartData(source) {
    const raw = source?.cartData || source?.cart || null;
    return raw && typeof raw === 'object' && Array.isArray(raw.items) ? raw : null;
  }

  function buildCartEventDetail(source, cartDataSource) {
    const cartData = extractCartData(cartDataSource);
    return {
      source,
      forceFresh: !cartData,
      ...(cartData ? { cartData } : {}),
    };
  }

  function initCartNormalization() {
    if (config.disableCartNormalization) return;

    const alreadyHandled = new Set([
      'theme:cart:change',
      'authentic:cart-updated',
      'cart-update',
    ]);

    cartEvents.forEach((eventName) => {
      if (alreadyHandled.has(eventName)) return;
      window.addEventListener(eventName, (event) => {
        window.dispatchEvent(
          new CustomEvent('authentic:cart-updated', {
            detail: buildCartEventDetail('theme-bridge', event?.detail),
          })
        );
      });
    });

    if (typeof window.subscribe === 'function') {
      window.subscribe('cart-update', (eventData) => {
        window.dispatchEvent(
          new CustomEvent('authentic:cart-updated', {
            detail: buildCartEventDetail('theme-bridge-pubsub', eventData),
          })
        );
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Init
  // ---------------------------------------------------------------------------

  function init() {
    initVariantDetection();
    initPriceObserver();
    initCartNormalization();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
