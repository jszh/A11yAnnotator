(function () {
// Polyfill for requestIdleCallback
if (!window.requestIdleCallback) {
  window.requestIdleCallback = function (callback, options) {
    const start = Date.now();
    return setTimeout(function () {
      callback({
        didTimeout: false,
        timeRemaining: function () {
          return Math.max(0, 50 - (Date.now() - start));
        },
      });
    }, 1);
  };
}

if (!window.cancelIdleCallback) {
  window.cancelIdleCallback = function (id) {
    clearTimeout(id);
  };
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const DISCOUNT_TITLE = 'AUTHENTIC';
const EMAIL_COOKIE_KEY = 'authentic-user-email';

const CACHE_KEYS = {
  cart: 'authentic_cart_cache',
  shipping: 'authentic_shipping_cache',
  shippingMethods: 'authentic_shipping_methods_cache',
  eligibilityPrefix: 'eligibility_',
  savingsPrefix: 'savings_',
};

const CACHE_TTL = {
  cart: 2000,
  cartGlobal: 10000,
  subscription: 60 * 1000,
  eligibility: 5 * 60 * 1000,
  savings: 5 * 60 * 1000,
  shipping: 10 * 60 * 1000,
  shippingMethods: 15 * 60 * 1000,
  brands: 60 * 60 * 1000,
};

const DEBOUNCE_MS = {
  render: 300,
  cartUpdate: 300,
  loginDelay: 100,
  mutationObserver: 200,
};
const CART_ATTRIBUTE_WRITE_COOLDOWN_MS = 5000;

const AUTHENTIC_LOGO_URL =
  'https://cdn.shopify.com/s/files/1/0739/6615/8126/files/authentic-logo-new.png?v=1693531248';
const AUTHENTIC_PILL_URL =
  'https://cdn.shopify.com/s/files/1/0807/3166/8801/files/Authentic_Pill_Medium_64efb613-a733-4731-bec0-799980611cf5.png?v=1719261567';

// ---------------------------------------------------------------------------
// SVG Constants
// ---------------------------------------------------------------------------
const SVG_CLOSE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50" width="20px" height="20px" class="authentic-popup-clos-svg">
  <path d="M 7.71875 6.28125 L 6.28125 7.71875 L 23.5625 25 L 6.28125 42.28125 L 7.71875 43.71875 L 25 26.4375 L 42.28125 43.71875 L 43.71875 42.28125 L 26.4375 25 L 43.71875 7.71875 L 42.28125 6.28125 L 25 23.5625 Z"/>
</svg>`;

const SVG_ARROW_ICON = `<svg class="see-details-arrow" width="10" height="10" viewBox="0 0 8 5" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M0.910156 0.363281L4.18441 3.63754L7.45866 0.363281" stroke="black" stroke-width="0.727612"/>
</svg>`;

// Cart "See details" accordion — Authentic UX (Figma MembershipAccordion 2385:12765)
const SVG_SAVINGS_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 25 25" fill="none">
  <path d="M14.426 3.98793L9.99534 2.18732C9.99534 2.18732 8.96868 1.66976 7.92511 2.46328L5.73857 4.12644L3.55204 5.78961C2.50899 6.58312 2.73315 7.71075 2.73315 7.71075L3.28507 12.4613C3.32366 12.7938 3.45106 13.1105 3.65407 13.3769L10.2464 22.0448C11.0379 23.0852 12.5223 23.2872 13.5627 22.4958L17.4574 19.5342L21.352 16.5727C22.3924 15.7813 22.5943 14.2968 21.8029 13.2564L15.2106 4.58849C15.0076 4.32205 14.7369 4.11481 14.4266 3.98846L14.426 3.98793Z" fill="url(#paint0_linear_3834_13453)"/>
  <path d="M7.99154 8.39519C8.67183 8.39519 9.22332 7.84371 9.22332 7.16342C9.22332 6.48313 8.67183 5.93164 7.99154 5.93164C7.31125 5.93164 6.75977 6.48313 6.75977 7.16342C6.75977 7.84371 7.31125 8.39519 7.99154 8.39519Z" fill="white"/>
  <path d="M8.89268 11.9514C8.33125 12.3785 8.22234 13.1794 8.6495 13.7409C9.07666 14.3023 9.87758 14.4112 10.439 13.9841C11.0004 13.5569 11.1094 12.756 10.6822 12.1945C10.255 11.6331 9.45412 11.5242 8.89268 11.9508V11.9514ZM9.96375 13.3597C9.74752 13.5241 9.43826 13.4824 9.27385 13.2656C9.10943 13.0494 9.1512 12.7401 9.36795 12.5757C9.5847 12.4113 9.89344 12.4531 10.0578 12.6698C10.2223 12.8866 10.1805 13.1953 9.96375 13.3597Z" fill="white"/>
  <path d="M15.1778 12.8591C14.6164 13.2862 14.5075 14.0872 14.9347 14.6486C15.3618 15.21 16.1627 15.3189 16.7242 14.8918C17.2856 14.4646 17.3945 13.6637 16.9673 13.1023C16.5402 12.5408 15.7393 12.4319 15.1778 12.8586V12.8591ZM16.2489 14.2674C16.0327 14.4318 15.7234 14.3901 15.559 14.1733C15.3946 13.9571 15.4364 13.6478 15.6531 13.4834C15.8699 13.319 16.1786 13.3608 16.343 13.5775C16.5074 13.7937 16.4657 14.103 16.2489 14.2674Z" fill="white"/>
  <path d="M12.8545 9.66003L11.8479 17.0591C11.8141 17.3066 11.9891 17.5371 12.237 17.5709L12.2513 17.573C12.4987 17.6068 12.7292 17.4318 12.763 17.1839L13.7696 9.7848C13.8034 9.53474 13.6274 9.30477 13.3773 9.27252C13.3726 9.272 13.3684 9.27147 13.3636 9.27094C13.1157 9.23869 12.8883 9.41262 12.855 9.66056L12.8545 9.66003Z" fill="white"/>
  <path d="M8.21033 7.49585C8.41175 7.33831 8.44875 7.04754 8.2928 6.84507L4.81792 2.32926C4.65933 2.12308 4.36063 2.08449 4.15446 2.24362C3.94828 2.40222 3.90969 2.70091 4.06881 2.90709L7.54316 7.42183C7.7007 7.62695 7.99516 7.66396 8.19923 7.50431C8.20293 7.50113 8.20663 7.49849 8.21033 7.49532V7.49585Z" fill="black"/>
  <defs>
    <linearGradient id="paint0_linear_3834_13453" x1="18.0331" y1="5.35715" x2="7.71773" y2="16.1226" gradientUnits="userSpaceOnUse">
      <stop stop-color="#03A7E9"/>
      <stop offset="0.46" stop-color="#0591CF"/>
      <stop offset="1" stop-color="#2C4B9A"/>
    </linearGradient>
  </defs>
</svg>`;

const SVG_SHIPPING_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 25 25" fill="none">
  <mask id="mask0_3834_13456" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="3" y="3" width="19" height="19">
    <rect x="3.56836" y="3.41992" width="5.63876" height="5.63876" rx="1.12775" fill="#D9D9D9"/>
    <rect x="3.56836" y="9.62256" width="5.63876" height="5.63876" rx="1.12775" fill="#D9D9D9"/>
    <rect x="3.56836" y="15.8252" width="5.63876" height="5.63876" rx="1.12775" fill="#D9D9D9"/>
    <rect x="9.77148" y="3.41992" width="5.63876" height="5.63876" rx="1.12775" fill="#D9D9D9"/>
    <rect x="9.77148" y="9.62256" width="5.63876" height="5.63876" rx="1.12775" fill="#D9D9D9"/>
    <rect x="9.77148" y="15.8252" width="5.63876" height="5.63876" rx="1.12775" fill="#D9D9D9"/>
    <rect x="15.9727" y="3.41992" width="5.63876" height="5.63876" rx="1.12775" fill="#D9D9D9"/>
    <rect x="15.9727" y="9.62256" width="5.63876" height="5.63876" rx="1.12775" fill="#D9D9D9"/>
    <rect x="15.9727" y="15.8252" width="5.63876" height="5.63876" rx="1.12775" fill="#D9D9D9"/>
  </mask>
  <g mask="url(#mask0_3834_13456)">
    <rect x="3.56836" y="3.41992" width="18.044" height="18.044" fill="url(#paint0_linear_3834_13456)"/>
  </g>
  <defs>
    <linearGradient id="paint0_linear_3834_13456" x1="3.56836" y1="12.4419" x2="21.6124" y2="12.4419" gradientUnits="userSpaceOnUse">
      <stop stop-color="#1F449D"/>
      <stop offset="1" stop-color="#00ABEC"/>
    </linearGradient>
  </defs>
</svg>`;

const SVG_CALENDAR_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 25 25" fill="none">
  <path d="M2.58008 19.7198C2.58008 21.1527 3.75232 22.3249 5.18524 22.3249H19.8144C21.2473 22.3249 22.4196 21.1527 22.4196 19.7198V8.70264H2.58008V19.7198ZM8.09089 14.7163C8.55059 14.2723 9.28387 14.2846 9.72788 14.7449L11.0963 16.1616L15.2824 11.943C15.7326 11.4889 16.4659 11.4861 16.92 11.9368C17.3741 12.3875 17.3769 13.1203 16.9261 13.5744L11.907 18.6322C11.6895 18.8514 11.3935 18.9747 11.0851 18.9747H11.0773C10.7661 18.9725 10.4684 18.8452 10.252 18.621L8.06174 16.3533C7.61773 15.8936 7.63007 15.1603 8.09033 14.7163H8.09089Z" fill="url(#paint0_linear_3843_12910)"/>
  <path d="M10.2528 18.6208C10.4692 18.8445 10.7663 18.9723 11.078 18.9745H11.0859C11.3942 18.9745 11.6902 18.8512 11.9077 18.632L16.9269 13.5742C17.3776 13.1201 17.3743 12.3873 16.9207 11.9366C16.4666 11.4859 15.7339 11.4892 15.2832 11.9428L11.0971 16.1614L9.72863 14.7447C9.28463 14.2845 8.55135 14.2721 8.09164 14.7161C7.63194 15.1601 7.61905 15.8934 8.06305 16.3531L10.2534 18.6208H10.2528Z" fill="white"/>
  <path d="M22.3663 6.74197C22.3315 6.57266 22.28 6.40953 22.2138 6.25368C22.1146 6.0199 21.9823 5.80351 21.8225 5.61066C21.6896 5.44976 21.5377 5.30456 21.3701 5.17954C21.203 5.05397 21.0203 4.94857 20.8257 4.8656C20.6699 4.79945 20.5068 4.74787 20.3375 4.71312C20.1681 4.67836 19.9932 4.65986 19.8138 4.65986H18.2778V3.5818C18.2778 3.08342 17.8696 2.67529 17.3713 2.67529C16.8729 2.67529 16.4647 3.08342 16.4647 3.5818V4.65986H8.32803V3.5818C8.32803 3.08342 7.9199 2.67529 7.42152 2.67529C6.92314 2.67529 6.51501 3.08342 6.51501 3.5818V4.65986H5.18524C3.75232 4.65986 2.58008 5.8321 2.58008 7.26502V8.70243H22.4196V7.26502C22.4196 7.08618 22.4011 6.91071 22.3663 6.74141V6.74197Z" fill="black"/>
  <defs>
    <linearGradient id="paint0_linear_3843_12910" x1="22.6068" y1="12.1095" x2="2.33453" y2="18.2622" gradientUnits="userSpaceOnUse">
      <stop stop-color="#03A7E9"/>
      <stop offset="0.46" stop-color="#0591CF"/>
      <stop offset="1" stop-color="#2C4B9A"/>
    </linearGradient>
  </defs>
</svg>`;

const SVG_INFO_ICON = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
<circle cx="8" cy="8" r="6.75" stroke="#737373" stroke-width="1"/>
<text x="8" y="8.35" text-anchor="middle" dominant-baseline="central" fill="#737373" font-size="8.25" font-weight="600" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif">?</text>
</svg>`;

const SVG_SCROLL_ARROW = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 14" focusable="false" aria-hidden="true" class="">
  <path stroke-linecap="round" stroke-linejoin="round" d="M1.4 7h11.2m0 0L7.7 2.1M12.6 7l-4.9 4.9"></path>
</svg>`;

const SVG_FIREWORKS_LINE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50" width="20px" height="20px" class="authentic-popup-clos-svg">
  <path d="M 7.71875 6.28125 L 6.28125 7.71875 L 23.5625 25 L 6.28125 42.28125 L 7.71875 43.71875 L 25 26.4375 L 42.28125 43.71875 L 43.71875 42.28125 L 26.4375 25 L 43.71875 7.71875 L 42.28125 6.28125 L 25 23.5625 Z"/>
</svg>`;

// ---------------------------------------------------------------------------
// Shared Utility Functions
// ---------------------------------------------------------------------------

function scheduleIdleTask(callback, fallbackDelay = 0) {
  if (window.requestIdleCallback) {
    return requestIdleCallback(callback);
  }
  return setTimeout(callback, fallbackDelay);
}

function readSessionCache(key, maxAge) {
  try {
    const raw = sessionStorage.getItem(key);
    if (raw) {
      const { data, timestamp } = JSON.parse(raw);
      if (Date.now() - timestamp < maxAge) {
        return data;
      }
    }
  } catch (_) {
    // Ignore storage errors (e.g., Safari private browsing)
  }
  return null;
}

function writeSessionCache(key, data) {
  try {
    sessionStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
  } catch (_) {
    // Ignore storage errors (e.g., Safari private browsing)
  }
}

function getCartMembershipState(cartData) {
  const subProductId = authenticGlobal.getSubscriptionProductId();
  const items = cartData?.items || [];
  const discounts = cartData?.cart_level_discount_applications || [];
  return {
    subProductId,
    subProductInCart: items.some(
      (item) => item.product_id?.toString() === subProductId?.toString()
    ),
    subDiscountApplied: discounts.some((disc) => disc.title === DISCOUNT_TITLE),
  };
}

function resolveUserEmail() {
  let email = authenticGlobal.customerEmail;
  if (window.shopCustomerEmail) email = window.shopCustomerEmail;

  if (!email) {
    const sessionEmail = window.sessionStorage[EMAIL_COOKIE_KEY];
    if (sessionEmail) email = sessionEmail;
  }

  if (!email) {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === EMAIL_COOKIE_KEY) {
        email = value;
        break;
      }
    }
  }

  if (!email) return null;

  const emailRegex = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
  return emailRegex.test(email) ? email : null;
}

function isB2BCustomer() {
  return window._authenticIsB2B === true;
}

function getCartNotificationElement() {
  return document.querySelector('cart-items') || document.querySelector('cart-notification');
}

function buildCartFingerprint(cartData) {
  if (!cartData || !Array.isArray(cartData.items)) return 'empty';

  const itemPart = cartData.items
    .map((item) => `${item.product_id}:${item.variant_id || ''}:${item.quantity || 0}:${item.price || 0}`)
    .sort()
    .join('|');

  const attrMember = cartData.attributes?.['authentic-member'] || '';
  const discountPart = (cartData.cart_level_discount_applications || [])
    .map((disc) => `${disc.title || ''}:${disc.type || ''}:${disc.total_allocated_amount || ''}`)
    .sort()
    .join('|');
  const token = cartData.token || '';
  const total = cartData.total_price || 0;
  const count = cartData.item_count || cartData.items.length || 0;

  return `${token}::${count}::${total}::${attrMember}::${discountPart}::${itemPart}`;
}

let cartMutationDebounceTimer = null;
let cartMutationSequence = 0;

function getResolvedCartData(cartData) {
  return cartData && typeof cartData === 'object' && Array.isArray(cartData.items)
    ? cartData
    : null;
}

function getCartDataFromEvent(event) {
  return getResolvedCartData(event?.detail?.cartData || event?.detail?.cart);
}

function notifyCartMutation(options = {}) {
  const { source = 'unknown', forceFresh = true, coalesce = true, cartData = null } = options;
  const resolvedCartData = getResolvedCartData(cartData);
  const hasResolvedCartData = !!resolvedCartData;

  if (hasResolvedCartData) {
    cartCache.data = resolvedCartData;
    cartCache.timestamp = Date.now();
    window._shopifyCartData = resolvedCartData;

    const authenticProductId = authenticGlobal.getSubscriptionProductId?.();
    window._authentic_membershipInCart = (resolvedCartData.items || []).some(
      (item) => item.product_id?.toString() === authenticProductId?.toString()
    );
  } else {
    cartCache.invalidate();
  }

  const dispatchMutation = () => {
    cartMutationSequence += 1;
    window.dispatchEvent(
      new CustomEvent('authentic:cart-updated', {
        detail: {
          source,
          forceFresh: hasResolvedCartData ? false : forceFresh,
          mutationId: `${Date.now()}-${cartMutationSequence}`,
          ...(hasResolvedCartData ? { cartData: resolvedCartData } : {}),
        },
      })
    );
  };

  if (!coalesce) {
    dispatchMutation();
    return;
  }

  if (cartMutationDebounceTimer) clearTimeout(cartMutationDebounceTimer);
  cartMutationDebounceTimer = setTimeout(dispatchMutation, 150);
}

let isCartUpdateTrackerInitialized = false;
let isCartCacheSyncInitialized = false;
let suppressPerformanceObserverCount = 0;

function notifyCartMutationDirectlyIfNeeded() {
  if (!isCartUpdateTrackerInitialized) {
    notifyCartMutation({ source: 'direct-fallback', coalesce: false });
  }
}

function syncCartCacheFromEvent(event) {
  const eventCartData = getCartDataFromEvent(event);

  if (eventCartData) {
    cartCache.data = eventCartData;
    cartCache.timestamp = Date.now();
    window._shopifyCartData = eventCartData;
    return;
  }

  if (event?.detail?.forceFresh === true) {
    cartCache.invalidate();
  }
}

function initializeCartCacheSync() {
  if (isCartCacheSyncInitialized) return;
  isCartCacheSyncInitialized = true;

  window.addEventListener('authentic:cart-updated', (event) => {
    syncCartCacheFromEvent(event);
  });

  window.addEventListener('theme:cart:change', (event) => {
    syncCartCacheFromEvent(event);
  });

  if (window.AUTHENTIC_PUB_SUB_EVENTS?.cartUpdate) {
    window.addEventListener(window.AUTHENTIC_PUB_SUB_EVENTS.cartUpdate, (event) => {
      syncCartCacheFromEvent(event);
    });
  }
}

function buildSectionsBody(cartNotificationEl) {
  if (!cartNotificationEl || typeof cartNotificationEl.getSectionsToRender !== 'function') {
    return {};
  }
  return {
    sections: cartNotificationEl.getSectionsToRender().map((section) => section.id),
    sections_url: window.location.pathname,
  };
}

function renderCartSections(cartNotificationEl, parsedState) {
  if (!cartNotificationEl || !parsedState?.sections) return;
  if (typeof cartNotificationEl.getSectionsToRender !== 'function') return;

  cartNotificationEl.getSectionsToRender().forEach((section) => {
    if (parsedState.sections[section.section] === undefined) return;
    const elementToReplace =
      authenticGlobal.safeQuerySelector(document.getElementById(section.id), section.selector) ||
      document.getElementById(section.id);
    if (elementToReplace) {
      elementToReplace.innerHTML = authenticGlobal.getSectionInnerHTML(
        parsedState.sections[section.section],
        section.selector
      );
    }
  });
}

function publishCartUpdate(body, parsedState) {
  if (typeof publish !== 'undefined') {
    publish(window.AUTHENTIC_PUB_SUB_EVENTS.cartUpdate, {
      source: 'product-form',
      productVariantId: body.id,
      cartData: parsedState,
    });
  }
}

function formatCurrency(amount) {
  if (amount === undefined || amount === null || amount === '' || Number(amount) <= 0) {
    return '';
  }
  return amount.toLocaleString('en-US', {
    style: 'currency',
    currency: window.Shopify?.currency?.active || 'USD',
  });
}

let authenticEventSubscribers = {};

function publish(eventName, data) {
  if (authenticEventSubscribers[eventName]) {
    authenticEventSubscribers[eventName].forEach((callback) => {
      callback(data);
    });
  }
}

window.AUTHENTIC_PUB_SUB_EVENTS = {
  cartUpdate: 'cart-update',
  quantityUpdate: 'quantity-update',
  variantChange: 'variant-change',
  cartError: 'cart-error',
};

// pubsub utils end
const authenticGlobal = {
  version: '0.0.46',
  customerEmail: window.shopCustomerEmail || null,
  _cartAttributeWritePending: new Map(),
  _cartAttributeWriteTimestamps: new Map(),
  getWidgets: () => ({
    banner: document.querySelectorAll('authentic-banner'),
  }),
  safeQuerySelector(root, selector) {
    if (!root || !selector || typeof selector !== 'string') return null;
    try {
      return root.querySelector(selector);
    } catch (e) {
      return null;
    }
  },

  isRecognizedMember() {
    try {
      const cache = window._authenticSubscriptionCache;
      if (cache && cache.data && cache.email) {
        if (Date.now() - cache.timestamp < cache.maxAge) {
          return cache.data !== null && cache.data.subscribed === true;
        }
      }

      const cartData = this.getCartSync();
      if (cartData) {
        const { subProductInCart, subDiscountApplied } = getCartMembershipState(cartData);
        if (subDiscountApplied) {
          return !subProductInCart;
        }
      }

      return false;
    } catch (error) {
      console.warn('Error checking recognized member status:', error);
      return false;
    }
  },

  getCartSync() {
    try {
      // Keep sync reads aligned with the async cart cache TTL.
      if (cartCache.data && Date.now() - cartCache.timestamp < cartCache.maxAge) {
        return cartCache.data;
      }
      if (window._shopifyCartData) {
        return window._shopifyCartData;
      }
      if (window.theme?.cart) {
        return window.theme.cart;
      }
      return null;
    } catch (error) {
      return null;
    }
  },

  async init() {
    if (isB2BCustomer()) {
      this.getWidgets().banner.forEach((banner) => banner.remove());
      return;
    }

    initializeGlobalCartHooks();
    this.checkPlacement();

    const initialCart = this.getCartSync?.();
    const customerEmail = resolveUserEmail();
    const hasMembershipStatusAttr = initialCart?.attributes?.['authentic-member'] != null;
    const subscriptionProductId = this.getSubscriptionProductId();
    const hasSubscriptionProductInCart = initialCart?.items?.some(
      (item) => item.product_id?.toString() === subscriptionProductId?.toString()
    );

    if (customerEmail) {
      scheduleIdleTask(async () => {
        const cartData = this.getCartSync?.() || initialCart || await this.getCart();
        const membershipState = getCartMembershipState(cartData);

        if (membershipState.subProductInCart) {
          await this.toggleSubProduct(customerEmail, { cartData });
          return;
        }

        if (cartData?.attributes?.['authentic-member'] == null) {
          await this.setMembershipStatusAttribute();
        }
      });
    } else if (!hasMembershipStatusAttr && initialCart && !hasSubscriptionProductInCart) {
      scheduleIdleTask(() => this.setMembershipStatusAttribute());
    }

    window.addEventListener('authentic:refresh-membership-status', () => {
      scheduleIdleTask(() => this.setMembershipStatusAttribute());
    });

    window.addEventListener('authentic:member-login', () => {
      this.refreshMembershipCache();
    });
  },

  // Refresh membership cache when login is detected
  async refreshMembershipCache() {
    try {
      // Clear existing cache
      if (window._authenticSubscriptionCache) {
        window._authenticSubscriptionCache.data = null;
        window._authenticSubscriptionCache.timestamp = 0;
        window._authenticSubscriptionCache.email = null;
      }
      this._subscriptionDetailsPending = null;
      this._subscriptionDetailsPendingEmail = null;
      this._subscriptionDetailsPendingByEmail.clear();

      // Update customer email
      this.customerEmail = window.Shopify?.customer?.email || window.shopCustomerEmail || null;

      // Force a fresh membership check
      if (this.customerEmail) {
        const banners = this.getWidgets().banner;
        banners.forEach((banner) => {
          if (banner.render) {
            banner.render();
          }
        });
      }
    } catch (error) {
      console.warn('Error refreshing membership cache:', error);
    }
  },

  checkPlacement() {
    let banners = this.getWidgets().banner;
    if (banners.length === 0) return;

    for (let i = 0; i < banners.length; i++) {
      const placement = banners[i].getAttribute('position');
      const isDarkMode = banners[i].getAttribute('mode');

      if (placement === 'above-express') {
        banners[i].remove();
        document
          .querySelector('.additional-checkout-buttons')
          ?.insertAdjacentHTML(
            'beforebegin',
            `<authentic-banner ${isDarkMode ? `mode="dark"` : ''} position="above-express"></authentic-banner>`
          );
        banners = document.querySelectorAll('authentic-banner');
      }
    }
  },

  async ensurePlan(planType, cartData) {
    const subProduct = await authenticGlobal.getSubscriptionProduct();
    if (!subProduct) return;

    const plan = planType === 'trial' ? subProduct.trial : subProduct.noTrial || subProduct.trial;
    if (!plan?.id || !plan?.selling_plan) return;

    const cartItems = cartData?.items || [];
    const existingItem = cartItems.find(
      (item) =>
        item.variant_id === plan.id &&
        item?.selling_plan_allocation?.selling_plan?.id === plan.selling_plan
    );

    if (existingItem) {
      if (existingItem.quantity > 1) {
        await this.fixQuantity(existingItem);
      }
      return;
    }

    await this.removeSubscriptionProduct();
    await this.addSubscriptionProduct();
  },

  async ensureTrialPlan(cartData) {
    return this.ensurePlan('trial', cartData);
  },

  async ensurePaidPlan(cartData) {
    return this.ensurePlan('paid', cartData);
  },

  async addSubscriptionProduct() {
    const subscriptionData = await this.getSubscriptionDetails();

    if (subscriptionData !== null && subscriptionData.subscribed === true) {
      console.error('You are already subscribed, skipping adding membership to cart');
      return;
    }

    const product_id = this.getSubscriptionProductId();
    const cartData = await this.getCart();
    const cartItems = cartData?.items || [];
    const subscriptionLineItem = cartItems.find(
      (item) => item.product_id?.toString() === product_id?.toString()
    );
    if (subscriptionLineItem) return;

    const items = await this.getSubscriptionProduct();
    if (!items) {
      console.warn('[Authentic] Subscription product unavailable, skipping cart add');
      return;
    }

    const preferredItem =
      subscriptionData !== null && subscriptionData.subscribed === false ? items.noTrial : items.trial;
    const baseItem = preferredItem || items.trial;
    if (subscriptionData !== null && subscriptionData.subscribed === false && !items.noTrial) {
      console.warn(
        '[Authentic] Non-trial selling plan unavailable; falling back to default subscription plan'
      );
    }
    if (!baseItem?.id || !baseItem?.selling_plan) {
      console.warn('[Authentic] Subscription selling plan unavailable, skipping cart add');
      return;
    }

    const body = { ...baseItem };

    const cartNotificationEl = getCartNotificationElement();
    Object.assign(body, buildSectionsBody(cartNotificationEl));

    const res = await fetch('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error(`Failed to add to cart: ${res.status}`);
    const parsedState = await res.json();

    if (!cartNotificationEl || !parsedState.sections) {
      if (window.authenticRedirectToCart) window.location.href = '/cart';
    } else {
      publishCartUpdate(body, parsedState);
      renderCartSections(cartNotificationEl, parsedState);
    }

    notifyCartMutation({
      source: 'subscription-add',
      forceFresh: true,
      coalesce: false,
      cartData: parsedState,
    });
    window.dispatchEvent(new Event('authentic:membership-added'));
    await this.updateAttribute(items.productId);
    return parsedState;
  },

  async removeSubscriptionProduct(options = {}) {
    const product_id = this.getSubscriptionProductId();
    const cartData =
      getResolvedCartData(options.cartData) ||
      await this.getCart({ forceFresh: options.forceFresh === true });
    const cartItems = cartData?.items || [];
    const subscriptionLineItem = cartItems.find(
      (item) => item.product_id?.toString() === product_id?.toString()
    );
    if (!subscriptionLineItem) return cartData || null;

    const cartNotificationEl = getCartNotificationElement();
    const body = { id: subscriptionLineItem.key, quantity: 0, ...buildSectionsBody(cartNotificationEl) };

    try {
      const res = await fetch('/cart/change.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error(`Cart update failed: ${res.status}`);
      const parsedState = await res.json();

      if (!cartNotificationEl || !parsedState.sections) {
        if (window.authenticRedirectToCart) window.location.href = '/cart';
      } else {
        publishCartUpdate(body, parsedState);
        renderCartSections(cartNotificationEl, parsedState);
      }

      notifyCartMutation({
        source: 'subscription-remove',
        forceFresh: false,
        coalesce: false,
        cartData: parsedState,
      });
      window.dispatchEvent(new Event('authentic:membership-removed'));
      return parsedState;
    } catch (error) {
      console.error('[Authentic] Error removing subscription product:', error);
      throw error;
    }
  },

  async fixQuantity(line) {
    const cartNotificationEl = getCartNotificationElement();
    const body = { id: line.key, quantity: 1, ...buildSectionsBody(cartNotificationEl) };

    try {
      const res = await fetch('/cart/change.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error(`Cart update failed: ${res.status}`);
      const parsedState = await res.json();

      if (!cartNotificationEl || !parsedState?.sections) {
        if (window.authenticRedirectToCart) window.location.href = '/cart';
      } else {
        publishCartUpdate(body, parsedState);
        renderCartSections(cartNotificationEl, parsedState);
      }

      notifyCartMutation({
        source: 'subscription-quantity-fix',
        forceFresh: false,
        coalesce: false,
        cartData: parsedState,
      });
    } catch (error) {
      console.error('[Authentic] Error fixing quantity:', error);
      throw error;
    }
  },

  async updateAttribute(productId) {
    const cartNotificationEl = getCartNotificationElement();
    const body = {
      attributes: { 'authentic-product-id': `gid://shopify/Product/${productId}` },
    };
    if (cartNotificationEl && typeof cartNotificationEl.getSectionsToRender === 'function') {
      body.sections = cartNotificationEl.getSectionsToRender().map((section) => section.section);
      body.sections_url = window.location.pathname;
    }

    suppressPerformanceObserverCount++;
    try {
      const res = await fetch('/cart/update.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error(`Failed to update cart: ${res.status}`);
      const parsedState = await res.json();

      if (cartNotificationEl && parsedState.sections) {
        publishCartUpdate(body, parsedState);
        renderCartSections(cartNotificationEl, parsedState);
      }

      const resolvedCartData = getResolvedCartData(parsedState);
      if (resolvedCartData) {
        cartCache.data = resolvedCartData;
        cartCache.timestamp = Date.now();
        window._shopifyCartData = resolvedCartData;
      }
    } catch (error) {
      console.warn('[Authentic] Error updating cart product attribute:', error);
      throw error;
    } finally {
      setTimeout(() => { suppressPerformanceObserverCount = Math.max(0, suppressPerformanceObserverCount - 1); }, 600);
    }
  },

  disableAdditionalButtons() {
    authenticGlobal.enableAdditionalButtons();

    const defaultPaySelectors = [
      '[data-testid=GooglePay-button]',
      '[data-testid=ApplePay-button]',
      '[data-testid=ShopifyPay-button]',
    ];
    const defaultProductSelectors = ['[data-testid="sheet-open-button"]'];

    const paySelectors = window.additionalPaymentButtonSelectors
      ? window.additionalPaymentButtonSelectors.split(',').map((s) => s.trim()).concat(defaultPaySelectors)
      : defaultPaySelectors;

    const productSelectors = window.additionalPaymentButtonSelectorsProduct
      ? window.additionalPaymentButtonSelectorsProduct.split(',').map((s) => s.trim()).concat(defaultProductSelectors)
      : defaultProductSelectors;

    const selectors = [...paySelectors, ...productSelectors].join(', ');

    document.body.insertAdjacentHTML(
      'beforeend',
      `<div class="authentic-additional-payment-style">
        <style>${selectors} { cursor: not-allowed; pointer-events: none; opacity: 0.4; }</style>
      </div>`
    );

    document.body
      .querySelector('.cart__dynamic-checkout-buttons')
      ?.insertAdjacentHTML(
        'afterbegin',
        `<p class="authentic-additional-payment-message">Check out with Shop Pay to activate your Authentic Membership free trial</p>`
      );
  },

  enableAdditionalButtons() {
    document.querySelectorAll('.authentic-additional-payment-style').forEach((el) => {
      el?.remove();
    });

    document.querySelectorAll('.authentic-additional-payment-message').forEach((el) => {
      el?.remove();
    });
  },

  async toggleAdditionalButtons(options = {}) {
    const product_id = this.getSubscriptionProductId();
    const cartData =
      getResolvedCartData(options.cartData) ||
      this.getCartSync?.() ||
      (options.forceFresh === true ? await this.getCart({ forceFresh: true }) : null);
    const subscriptionData =
      options.subscriptionData ?? await this.getSubscriptionDetails({ forceFresh: options.forceFresh === true });

    const subscriptionLineItem = cartData?.items?.find(
      (item) => item.product_id?.toString() === product_id?.toString()
    );

    if (subscriptionLineItem || subscriptionData?.subscribed) {
      authenticGlobal.disableAdditionalButtons();
    } else if (cartData) {
      authenticGlobal.enableAdditionalButtons();
    }
  },

  async upsertCartAttribute(key, value, options = {}) {
    const shouldNotifyCartMutation =
      options.notifyCartMutation ?? key === 'authentic-member';
    const normalizedValue = String(value ?? '');
    const writeKey = `${key}::${normalizedValue}`;
    const now = Date.now();

    const pendingWrite = this._cartAttributeWritePending.get(writeKey);
    if (pendingWrite) {
      return pendingWrite;
    }

    const lastSuccessfulWriteAt = this._cartAttributeWriteTimestamps.get(writeKey) || 0;
    if (
      options.forceWrite !== true &&
      now - lastSuccessfulWriteAt < CART_ATTRIBUTE_WRITE_COOLDOWN_MS
    ) {
      const syncCart = this.getCartSync?.();
      const currentAttrValue = String(syncCart?.attributes?.[key] ?? '');
      if (currentAttrValue === normalizedValue) {
        return syncCart || null;
      }

      // If sync cart is unavailable/stale during cooldown, verify against a fresh read
      // before issuing another write.
      if (!syncCart) {
        try {
          const freshCart = await this.getCart({ forceFresh: true });
          const freshAttrValue = String(freshCart?.attributes?.[key] ?? '');
          if (freshAttrValue === normalizedValue) {
            return freshCart || null;
          }
        } catch (_) {
          // If fresh read fails, proceed to write so tracking state can self-heal.
        }
      }
    }

    var formData = new FormData();
    formData.append(`attributes[${key}]`, normalizedValue);

    let resolvePendingWrite;
    let rejectPendingWrite;
    const writePromise = new Promise((resolve, reject) => {
      resolvePendingWrite = resolve;
      rejectPendingWrite = reject;
    });
    this._cartAttributeWritePending.set(writeKey, writePromise);

    void (async () => {
      // Suppress PerformanceObserver for attribute-only writes — they don't
      // change cart items so re-fetching the cart is unnecessary.
      suppressPerformanceObserverCount++;
      try {
        const response = await fetch((window.Shopify?.routes?.root || '/') + 'cart/update.js', {
          method: 'POST',
          body: formData,
        });
        if (!response.ok) {
          throw new Error(`Failed to update cart attribute: ${response.status}`);
        }
        const result = await response.json();

        // Keep shared cache aligned with attribute writes to avoid stale read/rewrites.
        if (result && typeof result === 'object' && Array.isArray(result.items)) {
          cartCache.data = result;
          cartCache.timestamp = Date.now();
          window._shopifyCartData = result;
        }

        this._cartAttributeWriteTimestamps.set(writeKey, Date.now());
        if (shouldNotifyCartMutation) {
          notifyCartMutationDirectlyIfNeeded();
        }
        resolvePendingWrite(result);
      } catch (error) {
        console.warn('[Authentic] Error upserting cart attribute:', error);
        rejectPendingWrite(error);
      } finally {
        this._cartAttributeWritePending.delete(writeKey);
        setTimeout(() => { suppressPerformanceObserverCount = Math.max(0, suppressPerformanceObserverCount - 1); }, 600);
      }
    })();

    return writePromise;
  },

  async setMembershipStatusAttribute() {
    try {
      const cart = await this.getCart();
      const currentCartStatus = cart.attributes['authentic-member'];

      const subscription = await this.getSubscriptionDetails();
      const currentStatus = subscription?.subscribed ? 'true' : 'false';

      if (currentCartStatus && currentCartStatus === currentStatus) {
        return console.log('Membership status already set to', currentStatus);
      }

      const attrData = await this.upsertCartAttribute('authentic-member', currentStatus);
      console.log('Added membership status cart attribute', attrData);
    } catch (error) {
      console.log('Failed to update membership status cart attribute', error);
    }
  },

  _subscriptionDetailsPending: null,
  _subscriptionDetailsPendingEmail: null,
  _subscriptionDetailsPendingByEmail: new Map(),

  async getSubscriptionDetails(options = {}) {
    const userEmail = resolveUserEmail();
    if (!userEmail) return null;
    const forceFresh = options.forceFresh === true;

    if (!window._authenticSubscriptionCache) {
      window._authenticSubscriptionCache = {
        data: null, timestamp: 0, email: null, maxAge: CACHE_TTL.subscription,
      };
    }

    const cache = window._authenticSubscriptionCache;
    if (
      !forceFresh &&
      cache.data &&
      cache.email === userEmail &&
      Date.now() - cache.timestamp < cache.maxAge
    ) {
      return cache.data;
    }

    if (!forceFresh) {
      const pendingForEmail = this._subscriptionDetailsPendingByEmail.get(userEmail);
      if (pendingForEmail) {
        return pendingForEmail;
      }
    }

    this._subscriptionDetailsPendingEmail = userEmail;
    const pendingPromise = (async () => {
      try {
        const urlSafeEmail = encodeURIComponent(userEmail);
        const rawSubDetails = await fetch(
          `/apps/authentic/public/is-customer-subscribed?email=${urlSafeEmail}`
        ).then((res) => (res.ok ? res.json() : null));
        const subDetails =
          rawSubDetails && rawSubDetails.subscribed === null ? null : rawSubDetails;

        cache.data = subDetails;
        cache.timestamp = Date.now();
        cache.email = userEmail;

        return subDetails;
      } catch (error) {
        console.error('Error fetching subscription details:', error);
        return null;
      } finally {
        this._subscriptionDetailsPendingByEmail.delete(userEmail);
        if (this._subscriptionDetailsPending === pendingPromise) {
          this._subscriptionDetailsPending = null;
        }
        if (this._subscriptionDetailsPendingEmail === userEmail) {
          this._subscriptionDetailsPendingEmail = null;
        }
      }
    })();

    this._subscriptionDetailsPending = pendingPromise;
    this._subscriptionDetailsPendingByEmail.set(userEmail, pendingPromise);

    return pendingPromise;
  },

  _subscriptionProductCache: null,
  _subscriptionProductPromise: null,

  async getSubscriptionProduct() {
    if (this._subscriptionProductCache) return this._subscriptionProductCache;
    if (this._subscriptionProductPromise) return this._subscriptionProductPromise;

    this._subscriptionProductPromise = (async () => {
      try {
        const response = await fetch('/products/authentic-subscription-product-handle.js');
        if (!response.ok) {
          console.warn(
            '[Authentic] Failed to load subscription product handle:',
            response.status
          );
          return null;
        }

        const product = await response.json();
        const variant = product?.variants?.[0];
        const sellingPlanAllocations = variant?.selling_plan_allocations || [];
        const trialSellingPlan = sellingPlanAllocations[0]?.selling_plan_id;
        const secondarySellingPlan = sellingPlanAllocations[1]?.selling_plan_id || null;
        const noTrialSellingPlan =
          secondarySellingPlan && secondarySellingPlan !== trialSellingPlan
            ? secondarySellingPlan
            : null;

        if (!product?.id || !variant?.id || !trialSellingPlan) {
          console.warn('[Authentic] Invalid subscription product response shape');
          return null;
        }

        this._subscriptionProductCache = {
          trial: {
            id: variant.id,
            selling_plan: trialSellingPlan,
            quantity: 1,
          },
          noTrial: noTrialSellingPlan
            ? {
                id: variant.id,
                selling_plan: noTrialSellingPlan,
                quantity: 1,
              }
            : null,
          productId: product.id,
        };

        return this._subscriptionProductCache;
      } catch (error) {
        console.warn('[Authentic] Error loading subscription product:', error);
        return null;
      } finally {
        this._subscriptionProductPromise = null;
      }
    })();

    return this._subscriptionProductPromise;
  },

  getSubscriptionProductId() {
    if (!window.authenticSubProductId) return null;
    return Number(window.authenticSubProductId.replace('gid://shopify/Product/', ''));
  },

  async getCart(options = {}) {
    const cart = await cartCache.getCart(options);

    const authenticProductId = this.getSubscriptionProductId();
    const items = cart?.items || [];
    window._authentic_membershipInCart = items.some(
      (item) => item.product_id?.toString() === authenticProductId?.toString()
    );

    return cart;
  },

  getSectionInnerHTML(html, selector = '.shopify-section') {
    try {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const el = selector ? doc.querySelector(selector) : doc.querySelector('.shopify-section');
      return el ? el.innerHTML : html;
    } catch (e) {
      return html;
    }
  },

  async toggleSubProduct(email, options = {}) {
    this.customerEmail = email;
    try {
      const subscriptionData = await this.getSubscriptionDetails({ forceFresh: !!email });
      let cartData =
        getResolvedCartData(options.cartData) ||
        this.getCartSync?.() ||
        await this.getCart({ forceFresh: options.forceFreshCart === true });

      if (subscriptionData?.subscribed === true) {
        if (getCartMembershipState(cartData).subProductInCart) {
          cartData = await this.removeSubscriptionProduct({
            cartData,
            forceFresh: options.forceFreshCart === true,
          });

          if (getCartMembershipState(cartData).subProductInCart) {
            cartData = await this.removeSubscriptionProduct({
              cartData,
              forceFresh: true,
            });
          }
        }
      }

      await this.setMembershipStatusAttribute();

      window.dispatchEvent(new Event('authentic:subscription-toggled'));
      return { subscriptionData, cartData };
    } catch (error) {
      console.error('Error toggling subscription product:', error);
      throw error;
    }
  },
};

window.authenticGlobal = authenticGlobal || {};
document.addEventListener(
  'DOMContentLoaded',
  window.authenticGlobal.init.bind(window.authenticGlobal)
);

// global cart cache system
const cartCache = {
  data: null,
  timestamp: 0,
  pendingPromise: null,
  freshPendingPromise: null,
  maxAge: CACHE_TTL.cartGlobal,

  async getCart(options = {}) {
    const forceFresh = options?.forceFresh === true;
    if (forceFresh && this.freshPendingPromise) return this.freshPendingPromise;
    if (!forceFresh && this.pendingPromise) return this.pendingPromise;

    if (!forceFresh && this.data && Date.now() - this.timestamp < this.maxAge) {
      return this.data;
    }

    try {
      const requestPromise = fetch('/cart.js', {
        method: 'GET',
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      }).then(async (res) => {
        if (!res.ok) throw new Error(`Failed to fetch cart: ${res.status}`);
        return res.json();
      });

      if (forceFresh) {
        this.freshPendingPromise = requestPromise;
      } else {
        this.pendingPromise = requestPromise;
      }

      this.data = await requestPromise;
      this.timestamp = Date.now();
      window._shopifyCartData = this.data;
      return this.data;
    } catch (error) {
      console.error('Error fetching cart:', error);
      throw error;
    } finally {
      if (forceFresh) {
        this.freshPendingPromise = null;
      } else {
        this.pendingPromise = null;
      }
    }
  },

  invalidate() {
    this.data = null;
    this.timestamp = 0;

    try {
      sessionStorage.removeItem(CACHE_KEYS.cart);
    } catch (_) {}

    if (window._authenticSavingsCache) {
      window._authenticSavingsCache = {};
    }
  },

  clearEligibilityCaches() {
    try {
      const keysToRemove = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith(CACHE_KEYS.eligibilityPrefix)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => sessionStorage.removeItem(key));
    } catch (_) {}
  },

  preload(options = {}) {
    scheduleIdleTask(() => this.getCart(), 100);
    if (!options.deferShipping) {
      scheduleIdleTask(() => this.preloadShippingData(), 200);
    }
  },

  async preloadShippingData() {
    try {
      await this.getShippingAmount();
    } catch (error) {
      console.log('Shipping preload failed:', error);
    }
  },

  async preloadEligibilityData(cartData) {
    if (!cartData?.items?.length) return;

    try {
      const promises = cartData.items.slice(0, 3).map(async (item) => {
        const cacheKey = `${CACHE_KEYS.eligibilityPrefix}${item.product_id}_${item.price}`;

        if (readSessionCache(cacheKey, CACHE_TTL.eligibility)) return;

        try {
          const response = await fetch(
            `/apps/authentic/public/products/${item.product_id}/member-price?price=${item.price}`
          );
          const data = await response.json();
          writeSessionCache(cacheKey, data);
        } catch (error) {
          console.log('Eligibility preload failed for product:', item.product_id);
        }
      });

      Promise.all(promises).catch((error) => {
        console.log('Eligibility preload failed:', error);
      });
    } catch (error) {
      console.log('Eligibility preload failed:', error);
    }
  },

  async getShippingAmount() {
    const cached = readSessionCache(CACHE_KEYS.shippingMethods, CACHE_TTL.shippingMethods);
    if (cached !== null) return cached;

    try {
      const [methodsRes, selectedRes] = await Promise.all([
        fetch('/apps/authentic/public/shipping-methods'),
        fetch('/apps/authentic/public/shipping-methods/selected'),
      ]);
      if (!methodsRes.ok || !selectedRes.ok) return 0;

      const [getAllMethods, getSelectedMethods] = await Promise.all([
        methodsRes.json(),
        selectedRes.json(),
      ]);

      const selectedMethodNames = new Set(getSelectedMethods);
      const selectedMethods = getAllMethods.filter((m) => selectedMethodNames.has(m.name));
      if (selectedMethods.length === 0) return 0;

      let lowestPriceMethod = selectedMethods[0];
      let lowestPrice = Math.min(...lowestPriceMethod.prices);

      for (let i = 1; i < selectedMethods.length; i++) {
        const price = Math.min(...selectedMethods[i].prices);
        if (price < lowestPrice) {
          lowestPrice = price;
          lowestPriceMethod = selectedMethods[i];
        }
      }

      let finalPrice = lowestPrice;

      if (/\((\d+) Location(s?)\)$/i.test(lowestPriceMethod.name)) {
        const baseName = lowestPriceMethod.name.replace(/\(\d+ Location(s?)\)$/i, '');
        const singleLocMethod = selectedMethods.find((m) => m.name === `${baseName}(1 Location)`);
        if (singleLocMethod) {
          finalPrice = Math.min(...singleLocMethod.prices);
        }
      }

      writeSessionCache(CACHE_KEYS.shippingMethods, finalPrice);
      return finalPrice;
    } catch (error) {
      console.log('Error fetching shipping amount:', error);
      return 0;
    }
  },
};

/**
 * Track cart changes and update authentic membership status
 */
function cartUpdateTracker() {
  if (isCartUpdateTrackerInitialized || typeof PerformanceObserver === 'undefined') return;

  let debounceTimeout;
  const cartObserver = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      const isValidRequestType = ['xmlhttprequest', 'fetch'].includes(entry.initiatorType);
      const isCartChangeRequest = /\/cart\/(add|update|change|clear)(?:\.js)?(?:[/?#]|$)/.test(
        entry.name
      );
      if (isValidRequestType && isCartChangeRequest && suppressPerformanceObserverCount === 0) {
        if (debounceTimeout) clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(() => {
          if (cartCache.data && Date.now() - cartCache.timestamp < 2000) return;
          notifyCartMutation({ source: 'performance-observer', forceFresh: true, coalesce: false });
        }, 500);
      }
    });
  });
  try {
    cartObserver.observe({ entryTypes: ['resource'] });
    isCartUpdateTrackerInitialized = true;
  } catch (error) {
    console.warn('PerformanceObserver unavailable for cart tracking:', error);
  }
}

function initializeGlobalCartHooks() {
  initializeCartCacheSync();
  cartUpdateTracker();
}

/**
 * Returns modal HTML content
 * @param {HTMLElement} self - The banner element
 * @returns {string} - Modal HTML content
 */
function getModalHtml(self) {
  return `
    <div class='authentic-popup-area'>
      <div class='authentic-popup-overlay'></div>
      <div class='authentic-popup-container'>
        <div class='shop-abg-header'>
          <button type='button' class='authentic-modal-close-button' aria-label='Close'>
            ${SVG_CLOSE_ICON}
          </button>
          <div class="shop-abg-modal-header-image">
            <img src="${AUTHENTIC_PILL_URL}" style="width: 100%; max-width: 250px;">
          </div>
          <div class='shop-abg-header-description'>
            <div class='shop-abg-text' style="text-align: center;">
              <b>Unlock 10% Off & Free Shipping</b><br>
              <span class="shop-abg-text-detail">on every purchase at 20+ Participating Brands</span>
            </div>
          </div>
        </div>
        <div class='shop-abg-brands'>
          <div class="brands-scroll-container">
            <div class="brands-scroll-hint">
              <span>Scroll for more brands</span>
              <span class="brands-scroll-hint-svg">${SVG_SCROLL_ARROW}</span>
            </div>
            <div class="brands-grid"></div>
          </div>
        </div>
        <div class='shop-abg-content'>
          <div class='shop-abg'>
            <button class='shop-abg-start-free-trial-button'>${self.trialButtonInnerText}</button>
          </div>
          <div class='shop-abg-legal'>
            Authentic Membership renews for $5/month after your 30 day free trial. Cancel anytime via the
            <a href="https://member.authentic.com/login" target="_blank">Authentic Membership Portal.</a>
          </div>
          <div class="shop-abg-member-login">
            <strong>&nbsp;Already a member? <a href="#" class="shop-abg-member-link"><span>Login</span></a></strong>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Returns banner HTML for PDP
 * @param {HTMLElement} self - The banner element
 * @param {Object} data - Banner data
 * @returns {string} - PDP banner HTML
 */
function getBannerHtml(self, data) {
  const { isRecognizedMember, cartHasPdpProduct, savedAmount, tooltipText } = data;

  const hasSavingsTooltip = self.savedLineAmount > 0 || self.savedShippingAmount > 0;
  const tooltipHtml = `<span class="authentic-savings-help" role="button" aria-label="Show savings details" tabindex="0">?<span class="authentic-tooltiptext">${tooltipText}</span></span>`;

  let headingText;
  if (isRecognizedMember) {
    headingText = generateRecognizedMemberMessage(self, {
      cartHasPdpProduct,
      savedAmountText: savedAmount,
      tooltipText,
    });
  } else {
    headingText = !cartHasPdpProduct
      ? `Save with Authentic Membership ${hasSavingsTooltip ? tooltipHtml : ''}`
      : `Save ${savedAmount} with Authentic Membership ${self.savedLineAmount > 0 ? tooltipHtml : ''}`;
  }

  const checkboxHtml = !isRecognizedMember
    ? `<div class='authentic-banner-checkbox-container'>
        <input type="checkbox" name="authentic_membership_banner" class="authentic-membership-checkbox">
        <div class="checkbox-loader"></div>
      </div>`
    : '';

  const trialHtml = !isRecognizedMember
    ? `<p class='authentic-banner-description'>
        Free 30 day ${cartHasPdpProduct ? 'Membership' : ''} trial, then $5/mo. | <a href="#" class="abg-opener-links abg-shop-login-opener"><span>Log In</span></a>
      </p>`
    : '';

  return `<div class='authentic-banner popup-banner-pdp'>
    ${checkboxHtml}
      <div class='authentic-banner-text-block'>
        <p class='authentic-banner-heading authentic-savings-text'>${headingText}</p>
        <p class='authentic-banner-description'>10% Off & Free Shipping</p>
        ${trialHtml}
      </div>
      <div class='authentic-banner-image'>
        <img src="${AUTHENTIC_LOGO_URL}" alt="authentic" loading="lazy">
      </div>
    </div>`;
}

/**
 * Returns banner HTML for Cart
 * @param {HTMLElement} self - The banner element
 * @param {Object} data - Banner data
 * @returns {string} - Cart banner HTML
 */
function getCartBannerHtml(self, data) {
  const { isRecognizedMember, subProductInCart, savedAmount, tooltipText, lineAmountText, shippingAmountText } = data;
  const isMemberOrHasSub = subProductInCart || isRecognizedMember;
  const showTooltip = lineAmountText && lineAmountText !== '$0' && lineAmountText !== '10%';

  let bannerHeading;
  if (!isMemberOrHasSub) {
    bannerHeading = 'Members Get 10% Off & Free Shipping';
  } else if (savedAmount) {
    const tooltipSpan = showTooltip
      ? `<span class="authentic-savings-help" role="button" aria-label="Show savings details" tabindex="0">?<span class="authentic-tooltiptext">${tooltipText}</span></span>`
      : '';
    bannerHeading = `You're Saving ${savedAmount} ${tooltipSpan}`;
  } else {
    bannerHeading = "You're Saving with Authentic";
  }

  const descriptionHtml = isMemberOrHasSub
    ? `<p class='authentic-banner-description'>10% Off & Free Shipping</p>`
    : `<p class='authentic-banner-description'>
        Renews for $5/month after 30 day free trial. &nbsp;<a href="#" class="abg-opener-links abg-shop-login-opener"><span>Log In</span></a> | <button type="button" class="abg-opener-links abg-see-details-opener"><span>See Details</span>${SVG_ARROW_ICON}</button>
      </p>`;

  const infoIconHtml = !isRecognizedMember
    ? `<a href="#" class="abg-opener-links abg-try-modal-opener">${SVG_INFO_ICON}</a>`
    : '';

  const seeDetailsHtml = !isMemberOrHasSub
    ? `<div class="see-details-dropdown">
        <div class="see-details-dropdown-content">
          <div class="see-details-item">
            <div class="see-details-icon">${SVG_SAVINGS_ICON}</div>
            <div class="see-details-text">
              <strong>Get ${savedAmount || '$0'} off this order</strong>
              <p>${lineAmountText || '$0'} discount with ${shippingAmountText || '$0'} free shipping—stackable with promos.</p>
            </div>
          </div>
          <div class="see-details-item">
            <div class="see-details-icon">${SVG_SHIPPING_ICON}</div>
            <div class="see-details-text">
              <div class="see-details-text-header">
                <strong>Works across 20+ brands</strong>
                ${infoIconHtml}
              </div>
              <p>Ongoing savings and delivery perks with every purchase.</p>
            </div>
          </div>
          <div class="see-details-item">
            <div class="see-details-icon">${SVG_CALENDAR_ICON}</div>
            <div class="see-details-text">
              <strong>Your first month's on us</strong>
              <p>Cancel anytime.</p>
            </div>
          </div>
        </div>
      </div>`
    : '';

  return `<div class='authentic-banner popup-banner-cart cart-banner'>
    <div class='authentic-banner-main-content'>
      <div class='authentic-banner-text-block'>
        <p class='authentic-banner-heading'>${bannerHeading}</p>
        ${descriptionHtml}
      </div>
      <div class='authentic-banner-image'>
        <img src="${AUTHENTIC_LOGO_URL}" alt="authentic" loading="lazy">
      </div>
    </div>
    ${seeDetailsHtml}
  </div>`;
}

/**
 * Authentic membership analytics tracker
 * @param {string} event - event name
 * @param {any} data - event data
 */
function authentic_trackEventAnalytics(event, ...data) {
  if (window._authentic_analytics) {
    setTimeout(() => {
      window._authentic_trackEvent(event, ...data);
    }, 0);
  }
}

if (!customElements.get('authentic-banner')) {
  class AuthenticBanner extends HTMLElement {
    constructor() {
      super();

      if (isB2BCustomer()) {
        queueMicrotask(() => {
          if (this.isConnected) {
            this.remove();
          }
        });
        return;
      }

      // Initialize core properties immediately
      this.popupViewed = false;
      this.isTransitioning = false;
      this.placement = this.getAttribute('placement') || 'cart';
      this.trialButtonInnerText = '<span>Add Free Trial to Cart</span>';
      this.currentSaving = 0;
      this.renderAborted = false;
      this.pdpPrice = this.getAttribute('price');
      this.isRendering = false;
      this.pid = this.getAttribute('pid') || '';

      this.previousState = {
        isRecognizedMember: false,
        subProductInCart: false,
        subDiscountApplied: false,
        cartHasPdpProduct: false,
        savedAmount: 0,
        cartItemCount: 0,
        pdpPrice: this.pdpPrice,
        pid: this.pid,
      };

      this.savedAmount = '';
      this.savedLineAmount = 0;
      this.savedShippingAmount = 0;

      this.debouncedRenderFn = debounce(this.render.bind(this), DEBOUNCE_MS.render);

      // Bind handlers once for reuse across setupEventListeners / ensureModalInjected
      this._boundHandleTryModalClick = this.handleTryModalClick.bind(this);
      this._boundHandleShopLoginClick = this.handleShopLoginClick.bind(this);
      this._boundHandleSeeDetailsToggle = this.handleSeeDetailsToggle.bind(this);
      this._boundHandleShopModalClick = this.handleShopModalClick.bind(this);
      this._boundHandlePopupClose = this.handlePopupClose.bind(this);
      this._boundHandleTrialButtonClick = this.handleTrialButtonClick.bind(this);
      this.preventScroll = this.preventScroll.bind(this);

      this._handleMembershipPriceChange = (e) => {
        if (this.placement !== 'pdp') return;
        this.pdpPrice = e.detail.pdpPrice;
        this.debouncedRenderFn();
      };
      this._handleMembershipParentIdChange = (e) => {
        if (this.pid !== e.detail.pid) {
          this.pid = e.detail.pid;
          this.debouncedRenderFn();
        }
      };
      this._handleMemberLogin = () => {
        this._pendingForceFreshCart = true;
        if (this._memberLoginTimeout) clearTimeout(this._memberLoginTimeout);
        this._memberLoginTimeout = setTimeout(() => this.debouncedRenderFn(), DEBOUNCE_MS.loginDelay);
      };
      this._handleResize = () => {
        if (!this.popupArea || !this.popupArea.isConnected) {
          return;
        }
        this.setupBrandsScroll();
        this.handleScroll();
      };

      if (cartCache && typeof cartCache.preload === 'function') {
        scheduleIdleTask(() => cartCache.preload({ deferShipping: this.placement === 'pdp' }));
      }

      // Performance tracking
      this.performanceMarks = {
        start: performance.now(),
        initialized: null,
        rendered: null,
      };
      this.isPerfDebug = window.location.search.includes('debug_perf=true');
      this._deferredPdpRefreshScheduled = false;
      this._memberPriceObserverRetryCount = 0;
      this._earlyEligibilityPromise = null;
      this._pendingForceFreshCart = false;
      this._lastCartFingerprint = '';
      this._lastCartMutationId = null;
      this._nextRenderCartData = null;
      this._pendingCartUpdate = null;

      // Install global cart hooks lazily only when at least one banner instance exists.
      initializeGlobalCartHooks();

      // Pre-fetch eligibility for current PDP product so the data is in-flight
      // before initializeBanner/calculateSavings needs it.
      if (this.placement === 'pdp' && this.pid && this.pdpPrice) {
        const ek = `${CACHE_KEYS.eligibilityPrefix}${this.pid}_${this.pdpPrice}`;
        if (!readSessionCache(ek, CACHE_TTL.eligibility)) {
          this._earlyEligibilityPromise = fetch(
            `/apps/authentic/public/products/${this.pid}/member-price?price=${this.pdpPrice}`
          ).then((res) => res.json()).then((data) => {
            writeSessionCache(ek, data);
            return data;
          }).catch(() => null);
        }
      }
      if (this.placement !== 'pdp') {
        this.classList.add('loading-transition');
        this.showMinimalBanner();
      }

      queueMicrotask(() => this.initializeBanner());
    }

    showMinimalBanner() {
      this.innerHTML = `
        <section class="authentic-banner-section">
          <div class="authentic-banner">
            <div class='authentic-banner-text-block'>
              <p class='authentic-banner-heading authentic-savings-text'>Loading...</p>
              <p class='authentic-banner-description'>10% Off & Free Shipping</p>
            </div>
            <div class='authentic-banner-image'>
              <img src="${AUTHENTIC_LOGO_URL}" alt="authentic" loading="lazy">
            </div>
          </div>
        </section>`;
    }

    async initializeBanner() {
      try {
        const isPdpInitialLoad = this.placement === 'pdp';
        const renderMode = isPdpInitialLoad ? 'initial' : 'full';

        // Defer heavy operations to idle time
        const deferredOperations = () => {
          this.loadShopLoginScript();
          this.checkUTMParam();
          this.popupAnalyticsEvents();
          if (this.placement === 'pdp') {
            this.observeMemberPriceElement();
          }
        };

        // Fire cart fetch eagerly for PDP so it's in-flight during initial render.
        const cartPromise = isPdpInitialLoad ? authenticGlobal.getCart() : null;

        // Always start subscription check early -- it doesn't depend on cart
        // data and the result is needed for accurate member recognition on PDP.
        const subscriptionPromise = authenticGlobal.getSubscriptionDetails();

        // Skip blocking cart fetch for initial PDP render.
        const cartData = isPdpInitialLoad ? null : await authenticGlobal.getCart();

        // Load essential content first using lightweight PDP path when possible.
        const initialBannerData = await this.calculateBannerData(cartData, {
          mode: renderMode,
          subscriptionPromise,
        });
        const { section } = await AuthenticPopupSectionHtml(this, cartData, initialBannerData);

        this.innerHTML = section;
        this.performanceMarks.initialized = performance.now();

        // Initialize core elements immediately
        this.initializeElements();
        this.bindTooltipEvents();
        this.setupEventListeners();
        this.handleBannerCheckbox(cartData);
        this.setupCartChangeListener();

        // Fire deferred PDP refresh immediately -- don't wait for idle.
        if (isPdpInitialLoad) {
          this.refreshPdpBannerWithDeferredData(cartPromise, subscriptionPromise);
        }

        scheduleIdleTask(deferredOperations, 100);

        this.performanceMarks.rendered = performance.now();
        if (this.isPerfDebug) {
          console.log(
            '[Authentic][Perf] initializeBanner ms:',
            Math.round(this.performanceMarks.rendered - this.performanceMarks.start)
          );
        }
      } catch (error) {
        console.error('Error initializing banner:', error);
      } finally {
        this.classList.remove('loading-transition');
      }
    }

    async refreshPdpBannerWithDeferredData(cartPromise, existingSubscriptionPromise) {
      if (this.placement !== 'pdp' || this._deferredPdpRefreshScheduled) {
        return;
      }

      this._deferredPdpRefreshScheduled = true;

      try {
        if (!this.isConnected || this.renderAborted) {
          return;
        }

        const subscriptionPromise = existingSubscriptionPromise || authenticGlobal.getSubscriptionDetails();
        const cartData = await (cartPromise || authenticGlobal.getCart());
        const fullBannerData = await this.calculateBannerData(cartData, {
          mode: 'full',
          subscriptionPromise,
        });
        const { section } = await AuthenticPopupSectionHtml(this, cartData, fullBannerData);

        if (!this.isConnected || this.renderAborted) {
          return;
        }

        if (section !== this.innerHTML) {
          this.innerHTML = section;
          this.initializeElements();
          this.bindTooltipEvents();
          this.handleBannerCheckbox(cartData);
          this.setupEventListeners();
        }
      } catch (error) {
        console.warn('Deferred PDP banner refresh failed:', error);
      }
    }

    initializeElements() {
      // Cache DOM queries for better performance
      const selectors = [
        ['brandsJson', '#brand-json'],
        ['popupSection', '.authentic-banner'],
        ['tryModalOpener', '.abg-try-modal-opener'],
        ['tryModalOpenerTooltip', '.abg-try-modal-opener-tooltip'],
        ['shopLoginOpener', '.abg-shop-login-opener'],
        ['shopModalOpener', '.abg-shop-modal-opener'],
      ];

      // Batch DOM queries for better performance
      selectors.forEach(([prop, selector]) => {
        this[prop] = this.querySelector(selector);
      });

      this.bannerCheckboxes = this.querySelectorAll('input[name="authentic_membership_banner"]');
    }

    setupEventListeners() {
      if (this._windowAbort) this._windowAbort.abort();
      this._windowAbort = new AbortController();
      const wSig = { signal: this._windowAbort.signal };

      window.addEventListener('authentic:membership-price-change', this._handleMembershipPriceChange, wSig);
      window.addEventListener('authentic:membership-parent-id-change', this._handleMembershipParentIdChange, wSig);
      window.addEventListener('authentic:member-login', this._handleMemberLogin, wSig);
      window.addEventListener('resize', this._handleResize, wSig);

      if (this._elementAbort) this._elementAbort.abort();
      this._elementAbort = new AbortController();
      const eSig = { signal: this._elementAbort.signal };

      this.tryModalOpener?.addEventListener('click', this._boundHandleTryModalClick, eSig);
      this.shopLoginOpener?.addEventListener('click', this._boundHandleShopLoginClick, eSig);

      const seeDetailsOpener = this.querySelector('.abg-see-details-opener');
      seeDetailsOpener?.addEventListener('click', this._boundHandleSeeDetailsToggle, eSig);
    }

    debouncedRender() {
      this.debouncedRenderFn();
    }

    handleSeeDetailsToggle(e) {
      e.preventDefault();
      e.stopPropagation();

      const button = e.currentTarget;
      const dropdown = this.querySelector('.see-details-dropdown');

      if (!dropdown) return;

      const isOpen = dropdown.classList.contains('open');

      if (isOpen) {
        dropdown.classList.remove('open');
        button.classList.remove('active');
      } else {
        dropdown.classList.add('open');
        button.classList.add('active');
      }
    }

    async render() {
      if (this.isRendering) return;
      this.isRendering = true;
      this.renderAborted = false;

      let cartData;

      try {
        const preFetchedCart = this._nextRenderCartData;
        this._nextRenderCartData = null;

        // Keep cart placement behavior fresh by default; event-driven flag can also request it.
        const shouldForceFreshCart =
          !preFetchedCart && (this.placement === 'cart' || this._pendingForceFreshCart === true);
        this._pendingForceFreshCart = false;

        const cartPromise = preFetchedCart
          ? Promise.resolve(preFetchedCart)
          : authenticGlobal.getCart({ forceFresh: shouldForceFreshCart });

        const [fetchedCart, subscriptionData] = await Promise.all([
          cartPromise,
          authenticGlobal.getSubscriptionDetails(),
        ]);
        cartData = fetchedCart;
        const { subProductInCart, subDiscountApplied } = getCartMembershipState(cartData);
        const cartItemCount = cartData.items.length;
        const cartHasPdpProduct = cartData.items.some(
          (item) => item.product_id.toString() === this.pid
        );

        if (this.placement !== 'pdp') {
          scheduleIdleTask(() => cartCache.preloadEligibilityData(cartData), 100);
        }

        const isRecognizedMember =
          (subscriptionData !== null && subscriptionData.subscribed === true) ||
          (subscriptionData === null && subDiscountApplied && !subProductInCart);

        if (subProductInCart || subDiscountApplied || isRecognizedMember) {
          await this.calculateSavings(cartData);
        }

        this._lastCartFingerprint = buildCartFingerprint(cartData);
        const currentState = {
          isRecognizedMember,
          subProductInCart,
          subDiscountApplied,
          cartHasPdpProduct,
          savedAmount: this.savedAmount,
          cartItemCount,
          cartFingerprint: this._lastCartFingerprint,
          pdpPrice: this.pdpPrice,
          pid: this.pid,
        };

        if (!shallowEqual(this.previousState, currentState)) {
          this.previousState = { ...currentState };

          let newHtml = '';
          if (subProductInCart || subDiscountApplied || isRecognizedMember) {
            this.updateSubscriptionVerbiage(cartData);
            if (!this.renderAborted) {
              const preComputedData = this.buildBannerTemplateData({
                cartData,
                isRecognizedMember,
                subProductInCart,
                cartHasPdpProduct,
              });
              newHtml = await this.getSavingsHTML(cartData, preComputedData);
            }
          } else {
            const { section } = await AuthenticPopupSectionHtml(this, cartData);
            newHtml = section;
          }

          if (newHtml && !this.renderAborted) {
            this.innerHTML = newHtml;
            this.initializeElements();
            this.bindTooltipEvents();
            this.handleBannerCheckbox(cartData);
            this.setupEventListeners();
          }
        }
      } catch (error) {
        console.error('Error rendering savings:', error);
        try {
          const fallbackCart = cartData || authenticGlobal.getCartSync() || { items: [], cart_level_discount_applications: [] };
          const { section } = await AuthenticPopupSectionHtml(this, fallbackCart);
          this.innerHTML = section;
        } catch (fallbackError) {
          console.error('Fallback render failed:', fallbackError);
          this.innerHTML = '<div class="authentic-banner-error">Unable to load banner</div>';
        }
        this.initializeElements();
        this.bindTooltipEvents();
        this.handleBannerCheckbox();
        this.setupEventListeners();
      } finally {
        this.isRendering = false;
        requestAnimationFrame(() => this.classList.remove('loading-transition'));
      }
    }

    async show() {
      if (this.isPopupMode) {
        this.style.display = 'block';
      } else {
        await this.render();
        this.style.display = 'block';
      }
    }

    hide() {
      if (this.isPopupMode) {
        this.closePopup();
        this.style.display = 'none';
      } else {
        this.style.display = 'none';
      }
    }

    updateSubscriptionVerbiage(cartData) {
      if (!cartData) return;

      const { subProductInCart, subDiscountApplied } = getCartMembershipState(cartData);
      const cache = window._authenticSubscriptionCache;
      const subscriptionData = cache?.data || null;

      const showTrialVerbiage =
        (subscriptionData === null && !subDiscountApplied && !subProductInCart) ||
        (subscriptionData !== null && subscriptionData.subscribed === false) ||
        (subscriptionData === null && subProductInCart);

      // Elements exist after innerHTML assignment in render(), query directly
      const verbiageElements = this.querySelectorAll('.free-trial-verbiage');
      verbiageElements.forEach((el) => {
        el.style.display = showTrialVerbiage ? 'block' : 'none';
      });
    }

    async calculateSavings(cartData) {
      const savingsStartTime = this.isPerfDebug ? performance.now() : null;

      // Create cache key based on cart items (removed variant dependency)
      const cartItems =
        this.placement !== 'pdp'
          ? cartData.items
          : [
              {
                price: this.pdpPrice,
                product_id: this.pid,
              },
            ];

      const cacheKey = `${CACHE_KEYS.savingsPrefix}${cartItems.map((item) => `${item.product_id}_${item.price}_${item.quantity || 1}`).join('_')}`;

      if (window._authenticSavingsCache && window._authenticSavingsCache[cacheKey]) {
        const cachedResult = window._authenticSavingsCache[cacheKey];
        if (Date.now() - cachedResult.timestamp < CACHE_TTL.savings) {
          this.savedAmount = cachedResult.data.savedAmount;
          this.savedLineAmount = cachedResult.data.savedLineAmount;
          this.savedShippingAmount = cachedResult.data.savedShippingAmount;
          return;
        }
      }

      const cartHasPdpProduct = cartData.items.some(
        (item) => item.product_id.toString() === this.pid
      );

      try {
        // Resolve eligibility first; shipping is requested only if needed.
        const eligibilityData = await this.getOptimizedEligibilityData(cartItems);

        // Calculate savings (simplified logic)
        const savedLineAmount = eligibilityData.reduce((acc, data, i) => {
          if (this.placement !== 'pdp') {
            return acc + (data.discount / 100) * cartItems[i].quantity;
          } else {
            return cartHasPdpProduct ? acc + data.discount / 100 : acc;
          }
        }, 0);

        const shippingAmount = savedLineAmount > 0 ? await this.getCachedShippingAmount() : 0;

        if (shippingAmount) {
          this.savedAmount = savedLineAmount > 0 ? savedLineAmount + shippingAmount : '';
        } else {
          this.savedAmount = savedLineAmount;
          this.savedShippingAmount = 0;
        }

        this.savedLineAmount = savedLineAmount;
        this.savedShippingAmount = savedLineAmount > 0 ? shippingAmount : 0;

        // Cache the result
        if (!window._authenticSavingsCache) window._authenticSavingsCache = {};
        window._authenticSavingsCache[cacheKey] = {
          timestamp: Date.now(),
          data: {
            savedAmount: this.savedAmount,
            savedLineAmount: this.savedLineAmount,
            savedShippingAmount: this.savedShippingAmount,
          },
        };

        if (this.isPerfDebug && savingsStartTime !== null) {
          console.log(
            '[Authentic][Perf] calculateSavings ms:',
            Math.round(performance.now() - savingsStartTime)
          );
        }
      } catch (error) {
        console.error('Error calculating savings:', error);
        this.savedAmount = '';
        this.savedLineAmount = 0;
        this.savedShippingAmount = 0;
      }
    }

    async getOptimizedEligibilityData(cartItems) {
      if (!window._authenticEligibilityInFlight) {
        window._authenticEligibilityInFlight = new Map();
      }

      const eligibilityPromises = cartItems.map(async (item) => {
        const cacheKey = `${CACHE_KEYS.eligibilityPrefix}${item.product_id}_${item.price}`;
        const cached = readSessionCache(cacheKey, CACHE_TTL.eligibility);
        if (cached) return cached;

        if (
          this._earlyEligibilityPromise &&
          item.product_id?.toString() === this.pid?.toString() &&
          item.price?.toString() === this.pdpPrice?.toString()
        ) {
          const earlyResult = await this._earlyEligibilityPromise;
          this._earlyEligibilityPromise = null;
          if (earlyResult) return earlyResult;
        }

        const inFlight = window._authenticEligibilityInFlight.get(cacheKey);
        if (inFlight) return inFlight;

        const requestPromise = fetch(
          `/apps/authentic/public/products/${item.product_id}/member-price?price=${item.price}`
        )
          .then((response) => response.json())
          .then((data) => {
            writeSessionCache(cacheKey, data);
            return data;
          })
          .finally(() => {
            window._authenticEligibilityInFlight.delete(cacheKey);
          });

        window._authenticEligibilityInFlight.set(cacheKey, requestPromise);
        return requestPromise;
      });

      return Promise.all(eligibilityPromises);
    }

    async getCachedShippingAmount() {
      const cachedShipping = readSessionCache(CACHE_KEYS.shipping, CACHE_TTL.shipping);
      if (cachedShipping !== null) return cachedShipping;

      const shippingAmount = await cartCache.getShippingAmount();
      if (shippingAmount) {
        writeSessionCache(CACHE_KEYS.shipping, shippingAmount);
      }

      return shippingAmount;
    }

    handleShopModalClick(e) {
      e.preventDefault();
      this.handleShopLogin();
      authentic_trackEventAnalytics('click_already_a_member', { placement: this.placement });
    }

    handleTryModalClick(e) {
      e.preventDefault();
      // if (!window.matchMedia('(max-width: 600px)').matches) {
      this.openPopup();
      // }
      authentic_trackEventAnalytics('click_try_for_free', { placement: this.placement });
      authentic_trackEventAnalytics('view_modal', { placement: this.placement });
    }

    handleShopLoginClick(e) {
      e.preventDefault();
      this.handleShopLogin();
      authentic_trackEventAnalytics('click_log_in', { placement: this.placement });
    }

    handlePopupClose() {
      this.closePopup();
      authentic_trackEventAnalytics('close_modal', { placement: this.placement });
    }

    async getSavingsHTML(cartData, preComputedData = null) {
      const bannerData = preComputedData || (await this.calculateBannerData(cartData));

      const templateData = {
        showMembershipBanner: true,
        isRecognizedMember: bannerData.isRecognizedMember,
        savingsMessage: bannerData.savingsMessage,
        tooltipText: bannerData.tooltipText,
        savedAmountText: bannerData.savedAmountText,
        cartHasPdpProduct: bannerData.cartHasPdpProduct,
        subProductInCart: bannerData.subProductInCart,
        savedAmount: bannerData.savedAmountText,
      };

      if (this.placement === 'cart') {
        return getSavingsCartHtml(this, templateData);
      }

      return getBannerSavingsHtml(this, templateData);
    }

    async handleTrialButtonClick() {
      const modalPlacement =
        this.popupArea.getAttribute('data-opened-by-placement') || this.placement;
      try {
        this.setTrialButtonLoadingState(true);
        const customerEmail =
          resolveUserEmail() || authenticGlobal.customerEmail || window.shopCustomerEmail || null;
        const addedCart = await authenticGlobal.addSubscriptionProduct();
        const { subscriptionData, cartData } = await authenticGlobal.toggleSubProduct(customerEmail, {
          cartData: addedCart,
        });
        await authenticGlobal.toggleAdditionalButtons({
          cartData: cartData || addedCart,
          subscriptionData,
          forceFresh: !!customerEmail,
        });
        this.closePopup();
        authentic_trackEventAnalytics('add_membership', {
          placement: modalPlacement,
          source: 'trial_modal',
          widgetType: modalPlacement === 'pdp' ? 'pdp_modal' : 'cart_modal',
        });
      } catch (error) {
        console.error('Error adding subscription:', error);
      } finally {
        this.setTrialButtonLoadingState(false);
      }
    }

    setTrialButtonLoadingState(state) {
      const checkboxContainers = this.querySelectorAll('.authentic-banner-checkbox-container');
      checkboxContainers.forEach((container) => {
        if (state) {
          container.classList.add('is-loading');
          const loader = container.querySelector('.checkbox-loader');
          if (loader) {
            loader.style.display = 'block';
          }
        } else {
          container.classList.remove('is-loading');
          const loader = container.querySelector('.checkbox-loader');
          if (loader) {
            loader.style.display = 'none';
          }
        }
      });

      if (this.trialButton) {
        if (state) {
          this.trialButton.innerHTML = '<div class="authentic__loader"></div>';
          this.trialButton.disabled = true;
        } else {
          this.trialButton.innerHTML = this.trialButtonInnerText;
          this.trialButton.disabled = false;
        }
      }
    }

    setCheckboxLoadingState(checkbox, state) {
      if (!checkbox) return;

      const container = checkbox.closest('.authentic-banner-checkbox-container');
      if (!container) return;

      const loader = container.querySelector('.checkbox-loader');
      if (!loader) return;

      if (state) {
        container.classList.add('is-loading');
        loader.style.display = 'block';
      } else {
        container.classList.remove('is-loading');
        loader.style.display = 'none';
      }
    }

    handleShopLogin() {
      this.shopLogin = document.body.querySelector('shop-login-button');
      if (!this._shopLoginBound) {
        this.shopLoginEvents();
      }

      setTimeout(() => {
        this.shopLogin.requestShow();
      }, 0);
    }

    shopLoginEvents() {
      this._shopLoginBound = true;
      const authenticEL = this;

      this.shopLogin.addEventListener('userfound', (event) => {
        console.log('shop user found!', event.detail);
      });

      this.shopLogin.addEventListener('usernotfound', () => {
        console.log('shop user not found!');
      });

      this.shopLogin.addEventListener('shopusermatched', (event) => {
        console.log('shop user matched!', event.detail);
      });

      this.shopLogin.addEventListener('completed', async (event) => {
        authenticEL.closePopup();
        console.log('🔐 [LOGIN] Shop login completed!', event.detail);
        const email = event.detail?.email;
        const now = new Date();
        const expirationDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        document.cookie = `${EMAIL_COOKIE_KEY}=${email}; expires=${expirationDate.toUTCString()}; path=/`;

        // Clear subscription cache to ensure fresh membership status after login
        if (window._authenticSubscriptionCache) {
          window._authenticSubscriptionCache = {
            data: null,
            timestamp: 0,
            email: null,
            maxAge: 60 * 1000,
          };
        }
        authenticGlobal._subscriptionDetailsPending = null;
        authenticGlobal._subscriptionDetailsPendingEmail = null;
        authenticGlobal._subscriptionDetailsPendingByEmail.clear();

        if (email) {
          window.shopCustomerEmail = email;
          try {
            await authenticGlobal.toggleSubProduct(email);
          } catch (error) {
            console.warn('[Authentic] Post-login membership sync failed:', error);
          }
        }
        window.dispatchEvent(new Event('authentic:member-login'));
      });

      this.shopLogin.addEventListener('error', (event) => {
        authenticEL.handleError(event.detail.code);
      });
    }

    ensureModalInjected() {
      if (this._modalInjected) return;
      if (document.body.querySelector('.authentic-popup-area')) {
        this._modalInjected = true;
        this.popupArea = document.body.querySelector('.authentic-popup-area');
      } else {
        document.body.insertAdjacentHTML('beforeend', getModalHtml(this));
        this.popupArea = document.body.querySelector('.authentic-popup-area');
        this._modalInjected = true;
      }

      this.shopModalOpenerMobile = this.popupArea.querySelector('.shop-abg-member-link');
      this.popupClose = this.popupArea.querySelector('.authentic-modal-close-button');
      this.popupOverlay = this.popupArea.querySelector('.authentic-popup-overlay');
      this.brandsSection = this.popupArea.querySelector('.shop-abg-brands');
      this.trialButton = this.popupArea.querySelector('.shop-abg-start-free-trial-button');
      this.scrollContainer = this.popupArea.querySelector('.brands-scroll-container');
      this.scrollHint = this.popupArea.querySelector('.brands-scroll-hint');
      this.errorErrorText = this.popupArea.querySelector('.error-error-text');

      if (this._elementAbort) {
        const eSig = { signal: this._elementAbort.signal };
        this.shopModalOpenerMobile?.addEventListener('click', this._boundHandleShopModalClick, eSig);
        this.popupClose?.addEventListener('click', this._boundHandlePopupClose, eSig);
        this.popupOverlay?.addEventListener('click', this._boundHandlePopupClose, eSig);
        this.trialButton?.addEventListener('click', this._boundHandleTrialButtonClick, eSig);
      }
    }

    async openPopup() {
      this.ensureModalInjected();

      if (
        'onBeforeAuthenticPopupOpen' in authenticGlobal &&
        typeof authenticGlobal.onBeforeAuthenticPopupOpen === 'function'
      ) {
        authenticGlobal.onBeforeAuthenticPopupOpen();
      }

      this.popupArea.setAttribute('data-opened-by-placement', this.placement);

      this.popupArea.classList.add('active');
      document.body.classList.add('authentic-modal-active');

      this.scrollPosition = window.scrollY;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${this.scrollPosition}px`;
      document.body.style.width = '100%';

      await this.loadBrands();

      this.popupOverlay.addEventListener('wheel', this.preventScroll, { passive: false });
      this.popupOverlay.addEventListener(
        'touchstart',
        (e) => {
          if (e.target === this.popupOverlay) {
            e.preventDefault();
          }
        },
        { passive: false }
      );
    }

    closePopup() {
      if (!this.popupArea) return;

      if (
        'onBeforeAuthenticPopupClose' in authenticGlobal &&
        typeof authenticGlobal.onBeforeAuthenticPopupClose === 'function'
      ) {
        authenticGlobal.onBeforeAuthenticPopupClose();
      }

      this.popupArea.removeAttribute('data-opened-by-placement');

      this.popupArea.classList.remove('active');
      document.body.classList.remove('authentic-modal-active');

      document.body.style.removeProperty('overflow');
      document.body.style.removeProperty('position');
      document.body.style.removeProperty('top');
      document.body.style.removeProperty('width');
      window.scrollTo(0, this.scrollPosition);

      if (this.popupOverlay) {
        this.popupOverlay.removeEventListener('wheel', this.preventScroll);
        this.popupOverlay.removeEventListener('touchstart', this.preventScroll);
      }
    }

    handleError(errorCode) {
      let errorMessage = '';
      if (errorCode == 'user_blocked') errorMessage = 'User Blocked!';
      if (errorCode == 'no_discount_received') errorMessage = 'No discount available!';

      if (!this.errorErrorText) {
        this.errorErrorText = document.createElement('div');
        this.errorErrorText.className = 'error-error-text';
        this.popupArea.querySelector('.shop-abg-content').appendChild(this.errorErrorText);
      }

      this.errorErrorText.innerText = errorMessage;
      this.errorErrorText.style.display = 'block';

      setTimeout(() => {
        this.errorErrorText.style.display = 'none';
      }, 5000);
    }

    loadShopLoginScript() {
      if (authenticGlobal.isRecognizedMember()) return;

      AuthenticBanner.loadNewScript('https://cdn.shopify.com/shopifycloud/shop-js/client.js').then(
        () => {
          const settings = {
            title: `Save with Authentic Membership`,
            description: `Log in or sign up to activate 10% off and free shipping`,
            logo: `https://cdn.shopify.com/s/files/1/0807/3166/8801/files/authentic-rounded.png?v=1700194279`,
          };
          const shopDiscountAuth = `<shop-login-button action="default" version="2" analytics-context="loginWithShop" hide-button="true" modal-title="${settings.title}" modal-description="${settings.description}" modal-logo-src="${settings.logo}" api-key="41548e3e4f38641616ff433ce6f66af2"></shop-login-button>`;
          document.body.insertAdjacentHTML('beforeend', shopDiscountAuth);
        }
      );
    }

    static loadNewScript(url, attr = {}) {
      return new Promise((resolve, reject) => {
        const script = window.document.createElement('script');
        script.src = url;
        script.async = true;
        script.crossOrigin = 'anonymous';

        for (const attrName in attr) {
          script[attrName] = attr[attrName];
        }

        script.addEventListener('load', () => resolve(script), false);
        script.addEventListener('error', () => reject(script), false);

        window.document.body.appendChild(script);
      });
    }

    popupAnalyticsEvents() {
      if (this.popupViewed || this._viewObserver) return;

      this._viewObserver = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (entry.isIntersecting && !this.popupViewed) {
            this.popupViewed = true;
            authentic_trackEventAnalytics('view_widget', {
              placement: this.placement,
              widgetType: this.placement === 'pdp' ? 'pdp_modal' : 'cart_modal',
            });
            this._viewObserver.disconnect();
            this._viewObserver = null;
          }
        },
        { threshold: 0.1 }
      );

      this._viewObserver.observe(this);
    }

    handleScroll = () => {
      if (!this.scrollContainer || !this.scrollHint) {
        return;
      }
      if (this.scrollTimeout) {
        clearTimeout(this.scrollTimeout);
      }
      const isAtStart = this.scrollContainer.scrollLeft === 0;
      this.scrollHint.classList.toggle('brands-scroll-hint--hidden', !isAtStart);
    };

    setupBrandsScroll() {
      this.cleanupBrandsScroll();
      if (this.scrollContainer && this.scrollHint) {
        this.scrollHint.classList.remove('brands-scroll-hint--hidden');
        this.scrollContainer.addEventListener('scroll', this.handleScroll);
        this.scrollContainer.addEventListener('wheel', this.handleBrandsWheel, { passive: false });
      }
    }

    cleanupBrandsScroll() {
      if (this.scrollContainer) {
        this.scrollContainer.removeEventListener('scroll', this.handleScroll);
        this.scrollContainer.removeEventListener('wheel', this.handleBrandsWheel);
        if (this.scrollTimeout) {
          clearTimeout(this.scrollTimeout);
        }
      }
    }

    preventScroll(event) {
      if (!event.target.closest('.brands-scroll-container')) {
        event.preventDefault();
      }
    }

    handleBrandsWheel = (e) => {
      if (!this.scrollContainer) {
        return;
      }
      if (e.deltaY !== 0) {
        e.preventDefault();
        this.scrollContainer.scrollLeft += e.deltaY;
      }
    };

    disconnectedCallback() {
      // Abort all managed event listeners
      if (this._windowAbort) this._windowAbort.abort();
      if (this._elementAbort) this._elementAbort.abort();
      if (this._cartUpdateAbort) this._cartUpdateAbort.abort();

      if (this.cleanupBrandsScroll) this.cleanupBrandsScroll();

      clearTimeout(this.renderTimeout);
      if (this._memberLoginTimeout) clearTimeout(this._memberLoginTimeout);

      if (this._viewObserver) {
        this._viewObserver.disconnect();
        this._viewObserver = null;
      }

      if (this.priceObserver) this.priceObserver.disconnect();
      if (this.visibilityObserver) this.visibilityObserver.disconnect();

      this.renderAborted = true;
      this.isRendering = false;
    }

    getShippingAmount() {
      return cartCache.getShippingAmount();
    }

    async loadBrands() {
      try {
        const brandsGrid = this.popupArea.querySelector('.brands-grid');
        if (!brandsGrid) return;

        brandsGrid.innerHTML = '';
        brandsGrid.classList.add('loading');

        const placeholderHtml = Array(6)
          .fill()
          .map(
            () => `
          <div class="brand-view">
            <div class="brand-block-stack">
              <div class="brand-link">
                <div class="placeholder"></div>
              </div>
              <div class="brand-link">
                <div class="placeholder"></div>
              </div>
            </div>
          </div>
        `
          )
          .join('');

        brandsGrid.innerHTML = placeholderHtml;

        const now = Date.now();
        const cache = AuthenticBanner.brandsCache;
        let allBrands;

        if (cache.data && cache.timestamp && now - cache.timestamp < CACHE_TTL.brands) {
          allBrands = cache.data;
        } else {
          const response = await fetch('/apps/authentic/public/brands/all');
          allBrands = await response.json();
          cache.data = allBrands;
          cache.timestamp = now;
        }

        if (!allBrands || !Array.isArray(allBrands)) {
          console.error('Invalid brands data received');
          return;
        }

        const seenUrls = new Set();
        const uniqueBrands = allBrands.filter((brand) => {
          if (seenUrls.has(brand.brand_url)) return false;
          seenUrls.add(brand.brand_url);
          return true;
        });

        const brandPairs = [];
        for (let i = 0; i < uniqueBrands.length; i += 2) {
          brandPairs.push(uniqueBrands.slice(i, i + 2));
        }

        const brandLink = (brand) => `
          <a href="${brand.brand_url}" target="_blank" class="brand-link">
            <img src="${brand.brand_logo_url}" alt="${brand.name}" loading="lazy">
          </a>`;

        brandsGrid.innerHTML = brandPairs
          .map(([first, second]) => `
            <div class="brand-view">
              <div class="brand-block-stack">
                ${first ? brandLink(first) : ''}
                ${second ? brandLink(second) : ''}
              </div>
            </div>`)
          .join('');

        const images = brandsGrid.querySelectorAll('img');
        const imagePromises = Array.from(images).map((img) => {
          return new Promise((resolve) => {
            if (img.complete) {
              img.classList.add('loaded');
              resolve();
            } else {
              img.onload = () => {
                img.classList.add('loaded');
                resolve();
              };
              img.onerror = () => {
                resolve();
              };
            }
          });
        });

        await Promise.all(imagePromises);
        brandsGrid.classList.remove('loading');
        this.setupBrandsScroll();
      } catch (error) {
        console.error('Error loading brands:', error);
        const brandsGrid = this.popupArea.querySelector('.brands-grid');
        if (brandsGrid) {
          brandsGrid.classList.remove('loading');
        }
      }
    }

    checkUTMParam() {
      const urlParams = new URLSearchParams(window.location.search);

      const param = urlParams.get('membership_modal');
      if (param === '1') {
        this.openPopup();
      }

      const utmSource = urlParams.get('utm_source');
      const utmMedium = urlParams.get('utm_medium');
      const utmCampaign = urlParams.get('utm_campaign');

      if (utmSource === 'authentic' && utmMedium === 'email' && utmCampaign === 'welcome') {
        setTimeout(() => {
          if (!window.matchMedia('(max-width: 600px)').matches) {
            this.openPopup();
          }
          authentic_trackEventAnalytics('view_modal', { placement: this.placement });
        }, 1000);
      }
    }

    handleBannerCheckbox(cartData) {
      this.bannerCheckboxes = this.querySelectorAll('input[name="authentic_membership_banner"]');
      if (!this.bannerCheckboxes.length) return;

      this.bannerCheckboxes.forEach((checkbox) => {
        let newState;
        checkbox.addEventListener('change', async (event) => {
          try {
            newState = event.target.checked;
            this.setCheckboxLoadingState(checkbox, true);

            if (!newState) {
              const currentCart =
                authenticGlobal.getCartSync?.() ||
                await authenticGlobal.getCart({ forceFresh: true });
              const cartItems = Array.isArray(currentCart?.items) ? currentCart.items : [];
              const { subProductId } = getCartMembershipState(currentCart);
              const subscriptionLineItem = cartItems.find(
                (item) => item.product_id.toString() === subProductId?.toString()
              );

              if (!subscriptionLineItem?.key) {
                window._authentic_membershipInCart = false;
                await this.render();
                return;
              }

              const response = await fetch('/cart/change.js', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  id: subscriptionLineItem.key,
                  quantity: 0,
                }),
              });

              if (!response.ok) {
                const errorText = await response.text();
                throw new Error(
                  `Failed to remove membership from cart: ${response.status} ${errorText}`
                );
              }

              const parsedState = await response.json();
              notifyCartMutation({
                source: 'banner-checkbox-remove',
                forceFresh: false,
                coalesce: false,
                cartData: parsedState,
              });
              window._authentic_membershipInCart = false;
              window.dispatchEvent(new Event('authentic:membership-removed'));
              authentic_trackEventAnalytics('remove_membership', {
                placement: this.placement,
                source: 'banner_checkbox',
                widgetType: this.placement === 'pdp' ? 'pdp_checkbox' : 'cart_checkbox',
              });
            } else {
              await authenticGlobal.addSubscriptionProduct();
              window._authentic_membershipInCart = true;
              authentic_trackEventAnalytics('add_membership', {
                placement: this.placement,
                source: 'banner_checkbox',
                widgetType: this.placement === 'pdp' ? 'pdp_checkbox' : 'cart_checkbox',
              });
            }
            await this.render();
          } catch (error) {
            console.error('Error handling banner checkbox:', error);
            this.bannerCheckboxes.forEach((cb) => {
              cb.checked = !newState;
            });
          } finally {
            this.setCheckboxLoadingState(checkbox, false);
          }
        });

        if (cartData) {
          checkbox.checked = getCartMembershipState(cartData).subProductInCart;
        } else {
          const syncCart = authenticGlobal.getCartSync();
          if (syncCart) {
            checkbox.checked = getCartMembershipState(syncCart).subProductInCart;
          }
        }
      });
    }

    setupCartChangeListener() {
      if (this._cartUpdateAbort) this._cartUpdateAbort.abort();
      this._cartUpdateAbort = new AbortController();
      const sig = { signal: this._cartUpdateAbort.signal };

      const toQueuedCartUpdate = (event) => ({
        type: event?.type || null,
        detail: {
          ...(event?.detail && typeof event.detail === 'object' ? event.detail : {}),
          ...(getCartDataFromEvent(event) ? { cartData: getCartDataFromEvent(event) } : {}),
        },
      });

      const processCartUpdate = async (event) => {
        let latestEvent = event;

        while (latestEvent) {
          this._pendingCartUpdate = null;

          if (!document.body.contains(this)) {
            return;
          }

          const eventCartData = getCartDataFromEvent(latestEvent);
          const forceFreshFromEvent =
            latestEvent?.detail?.forceFresh === true ||
            latestEvent?.type === 'theme:cart:change' ||
            latestEvent?.type === window.AUTHENTIC_PUB_SUB_EVENTS?.cartUpdate;
          const mutationId = latestEvent?.detail?.mutationId || null;
          let latestCart = eventCartData || await authenticGlobal.getCart({ forceFresh: forceFreshFromEvent });
          const latestFingerprint = buildCartFingerprint(latestCart);
          const isDuplicateMutation = mutationId && mutationId === this._lastCartMutationId;

          if (!isDuplicateMutation && latestFingerprint !== this._lastCartFingerprint) {
            this._nextRenderCartData = latestCart;
            this._pendingForceFreshCart = false;

            if (window._authenticSavingsCache) {
              window._authenticSavingsCache = {};
            }
            this.savedAmount = undefined;
            this.savedLineAmount = undefined;
            this.savedShippingAmount = undefined;
            await this.render();

            void authenticGlobal.toggleAdditionalButtons({ cartData: latestCart });

            if (mutationId) {
              this._lastCartMutationId = mutationId;
            }
            this._lastCartFingerprint = latestFingerprint;
          }

          latestEvent = this._pendingCartUpdate;
        }
      };

      const handleCartUpdate = debounce(async (event) => {
        if (this.isUpdatingCart) {
          this._pendingCartUpdate = toQueuedCartUpdate(event);
          return;
        }
        this.isUpdatingCart = true;

        try {
          await processCartUpdate(event);
        } catch (error) {
          console.error('Error in handleCartUpdate:', error);
        } finally {
          this.isUpdatingCart = false;
        }
      }, DEBOUNCE_MS.cartUpdate);

      window.addEventListener('authentic:cart-updated', handleCartUpdate, sig);
      window.addEventListener(window.AUTHENTIC_PUB_SUB_EVENTS.cartUpdate, handleCartUpdate, sig);
      window.addEventListener('theme:cart:change', handleCartUpdate, sig);
    }

    observeMemberPriceElement() {
      if (!localStorage.getItem('view_membership_price_tracked')) {
        let debounceTimeout;
        const priceContainer =
          this.querySelector('.member-price-container') ||
          document.querySelector('.member-price-container');

        // Avoid observing the whole document body on startup.
        if (!priceContainer) {
          if (this._memberPriceObserverRetryCount < 2) {
            this._memberPriceObserverRetryCount += 1;
            setTimeout(() => this.observeMemberPriceElement(), 300);
          }
          return;
        }

        const visibilityObserver = new MutationObserver(async (mutations, obs) => {
          if (debounceTimeout) {
            clearTimeout(debounceTimeout);
          }

          debounceTimeout = setTimeout(async () => {
            const memberPriceElement = document.querySelector('.member-price-ab-test-displayed');
            if (memberPriceElement) {
              try {
                const cart = await authenticGlobal.getCart();
                // Only update if attribute isn't already set
                if (!cart.attributes || !cart.attributes['_member_price_seen']) {
                  const attrData = await authenticGlobal.upsertCartAttribute(
                    '_member_price_seen',
                    true,
                    { notifyCartMutation: false }
                  );
                  console.log('Added member price seen cart attribute', attrData);
                  localStorage.setItem('view_membership_price_tracked', 'true');
                }
              } catch (error) {
                console.error('Error updating member price seen attribute:', error);
              } finally {
                obs.disconnect();
              }
            }
          }, 200);
        });

        visibilityObserver.observe(priceContainer, {
          childList: true,
          subtree: true,
          characterData: true,
        });
        this.visibilityObserver = visibilityObserver;
      }

      if (this.placement === 'pdp') {
        if (this.priceObserver) this.priceObserver.disconnect();

        const fallbackSelectors = window.authenticThemeConfig?.priceSelectors || [
          '.price__regular .price-item--regular',
          '.price .price-item--regular',
          '.price__sale ins',
          '.price__regular > span:not(.visually-hidden)',
          '.product__price .money',
          '[data-product-price]',
          '.product-single__price',
          '.product__price',
          '.price .money',
        ];

        // Try [data-member-price] first (global-theme), then fall back through selectors
        let watchedElement = document.querySelector('[data-member-price]');
        let usesDataAttr = !!watchedElement;
        let matchedSelector = null;

        if (!watchedElement) {
          for (const sel of fallbackSelectors) {
            watchedElement = document.querySelector(sel);
            if (watchedElement) {
              matchedSelector = sel;
              break;
            }
          }
        }

        if (watchedElement) {
          const priceObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
              if (mutation.type === 'childList' || mutation.type === 'characterData') {
                let price;
                if (usesDataAttr) {
                  const el = document.querySelector('[data-member-price]');
                  price = el?.getAttribute('data-member-price');
                } else {
                  const currentEl = document.querySelector(matchedSelector);
                  const text = currentEl?.textContent?.replace(/[^0-9.,]/g, '').trim();
                  if (text) {
                    let normalized;
                    const lastComma = text.lastIndexOf(',');
                    const lastDot = text.lastIndexOf('.');
                    if (lastComma > lastDot) {
                      normalized = text.replace(/\./g, '').replace(',', '.');
                    } else if (lastDot > lastComma) {
                      normalized = text.replace(/,/g, '');
                    } else {
                      normalized = text;
                    }
                    const dollars = parseFloat(normalized);
                    if (!isNaN(dollars)) price = Math.round(dollars * 100).toString();
                  }
                }

                if (price && price !== this.pdpPrice) {
                  window.dispatchEvent(
                    new CustomEvent('authentic:membership-price-change', {
                      detail: { pdpPrice: price },
                    })
                  );
                }
              }
            });
          });

          const container = watchedElement.closest('.price') || watchedElement.parentElement;
          if (container) {
            priceObserver.observe(container, {
              childList: true,
              characterData: true,
              subtree: true,
            });
          }

          this.priceObserver = priceObserver;
        }
      }
    }

    bindTooltipEvents() {
      const toggleTooltipVisibility = (tooltipText) => {
        const isVisible = tooltipText.style.visibility === 'visible';
        tooltipText.style.visibility = isVisible ? 'hidden' : 'visible';
        tooltipText.style.opacity = isVisible ? '0' : '1';
      };

      this.querySelectorAll('.authentic-savings-help').forEach((tooltip) => {
        const text = tooltip.querySelector('.authentic-tooltiptext');
        if (!text) return;

        tooltip.addEventListener('mouseenter', () => {
          text.style.visibility = 'visible';
          text.style.opacity = '1';
        });
        tooltip.addEventListener('mouseleave', () => {
          text.style.visibility = 'hidden';
          text.style.opacity = '0';
        });
        tooltip.addEventListener('touchstart', (e) => {
          e.preventDefault();
          toggleTooltipVisibility(text);
        });
        tooltip.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleTooltipVisibility(text);
          }
        });
      });

      const openerTooltip = this.querySelector('.abg-try-modal-opener-tooltip');
      if (openerTooltip) {
        openerTooltip.addEventListener('click', (e) => {
          e.preventDefault();
          this.handleTryModalClick(e);
        });
      }
    }

    async calculateBannerData(cartData, options = {}) {
      const mode = options.mode || 'full';
      const isInitialPdp = mode === 'initial' && this.placement === 'pdp';

      if (isInitialPdp) {
        cartData = cartData || authenticGlobal.getCartSync() || { items: [], cart_level_discount_applications: [] };
      } else {
        const shouldForceFreshCart = this.placement === 'cart' || options.forceFreshCart === true;
        cartData = cartData || (await authenticGlobal.getCart({ forceFresh: shouldForceFreshCart }));
      }

      const { subProductInCart, subDiscountApplied } = getCartMembershipState(cartData);
      const cartHasPdpProduct = cartData.items.some(
        (item) => item.product_id.toString() === this.pid
      );
      let isRecognizedMember = false;

      if (isInitialPdp) {
        const pdpCacheKey = `${CACHE_KEYS.savingsPrefix}${this.pid}_${this.pdpPrice}_1`;
        const cachedSavings = window._authenticSavingsCache?.[pdpCacheKey];
        if (cachedSavings && Date.now() - cachedSavings.timestamp < CACHE_TTL.savings) {
          this.savedAmount = cachedSavings.data.savedAmount;
          this.savedLineAmount = cachedSavings.data.savedLineAmount;
          this.savedShippingAmount = cachedSavings.data.savedShippingAmount;
        } else {
          this.savedAmount = '';
          this.savedLineAmount = 0;
          this.savedShippingAmount = 0;
        }
        isRecognizedMember =
          authenticGlobal.isRecognizedMember() || (subDiscountApplied && !subProductInCart);

        // If the synchronous cache check missed, fall back to the already
        // in-flight subscription promise so the first render is accurate.
        if (!isRecognizedMember && options.subscriptionPromise) {
          const subData = await options.subscriptionPromise;
          if (subData?.subscribed === true) {
            isRecognizedMember = true;
          }
        }
      } else {
        const subPromise = options.subscriptionPromise || authenticGlobal.getSubscriptionDetails();
        const [subscriptionData] = await Promise.all([
          subPromise,
          this.calculateSavings(cartData),
        ]);
        isRecognizedMember =
          (subscriptionData !== null && subscriptionData.subscribed === true) ||
          (subscriptionData === null && subDiscountApplied && !subProductInCart);
      }

      return this.buildBannerTemplateData({ cartData, isRecognizedMember, subProductInCart, cartHasPdpProduct });
    }

    buildBannerTemplateData({ cartData, isRecognizedMember, subProductInCart, cartHasPdpProduct }) {
      const cartItems = Array.isArray(cartData?.items) ? cartData.items : [];
      // Format amounts (keep same logic but extracted for clarity)
      const savedAmountText = this.formatSavedAmount();
      const lineAmountText = this.formatLineAmount();
      const shippingAmountText = this.formatShippingAmount();
      const tooltipText = `${lineAmountText} discount + ${shippingAmountText} free shipping value. Savings will show in checkout.`;

      const hasRegularProducts =
        cartItems.length > 0 && (cartItems.length > 1 || !subProductInCart);

      const messageData = {
        cartHasPdpProduct,
        savedAmountText,
        hasRegularProducts,
        tooltipText,
      };

      let savingsMessage;
      if (isRecognizedMember) {
        savingsMessage = generateRecognizedMemberMessage(this, messageData);
      } else if (subProductInCart) {
        // When membership is in cart, check if there are actual product savings
        if (hasRegularProducts && this.savedLineAmount > 0) {
          // Show savings amount with tooltip if there are regular products with savings
          savingsMessage = `You're Saving ${savedAmountText} with Authentic <span class="authentic-savings-help" role="button" aria-label="Show savings details" tabindex="0">?<span class="authentic-tooltiptext">${tooltipText}</span></span>`;
        } else {
          // When only membership item in cart OR no product savings - show generic message
          savingsMessage = "You're Saving with Authentic";
        }
      } else {
        // For non-recognized users without membership, use promotional messaging
        savingsMessage =
          this.savedLineAmount > 0 || this.savedShippingAmount > 0
            ? `Save with Authentic Membership <span class="authentic-savings-help" role="button" aria-label="Show savings details" tabindex="0">?<span class="authentic-tooltiptext">${tooltipText}</span></span>`
            : 'Save with Authentic Membership';
      }

      return {
        isRecognizedMember,
        subProductInCart,
        savedAmount: savedAmountText,
        savingsMessage,
        savedAmountText,
        tooltipText,
        cartHasPdpProduct,
        lineAmountText,
        shippingAmountText,
      };
    }

    formatSavedAmount() {
      return formatCurrency(this.savedAmount);
    }

    formatLineAmount() {
      return this.savedLineAmount > 0 ? formatCurrency(this.savedLineAmount) : '10%';
    }

    formatShippingAmount() {
      return this.savedShippingAmount ? formatCurrency(this.savedShippingAmount) : '$0';
    }
  }

  AuthenticBanner.brandsCache = { data: null, timestamp: null };

  customElements.define('authentic-banner', AuthenticBanner);
}

/**
 * Returns savings HTML with membership banner checkbox
 * @param {HTMLElement} self - The banner element
 * @param {Object} data - Savings data
 * @returns {string} - Banner savings HTML with checkbox
 */
function getBannerSavingsHtml(self, data) {
  const { showMembershipBanner, isRecognizedMember, savingsMessage, subProductInCart } = data;

  const showCheckbox = showMembershipBanner && !isRecognizedMember;
  const isChecked = subProductInCart;

  const checkboxHtml = showCheckbox
    ? `<div class='authentic-banner-checkbox-container'>
        <input type="checkbox" name="authentic_membership_banner" class="authentic-membership-checkbox"${isChecked ? ' checked="checked"' : ''}>
        <div class="checkbox-loader"></div>
      </div>`
    : '';

  const trialHtml = !isRecognizedMember
    ? `<p class="authentic-banner-description free-trial-verbiage">Free 30 day Membership trial, then $5/mo.</p>`
    : '';

  return `
    <section class="authentic-banner-section" style='margin-top: ${window.authenticPromotionalBannerMarginTop || 0}px; margin-bottom: ${window.authenticPromotionalBannerMarginBottom || 0}px;'>
      <div class="authentic-banner savings-banner">
        ${checkboxHtml}
        <div class='authentic-banner-text-block'>
          <p class='authentic-banner-heading authentic-savings-text'>${savingsMessage}</p>
          <p class='authentic-banner-description'>10% Off & Free Shipping</p>
          ${trialHtml}
        </div>
        <div class='authentic-banner-image'>
          <img src="${AUTHENTIC_LOGO_URL}" alt="authentic" loading="lazy">
        </div>
      </div>
    </section>`;
}

/**
 * Returns savings HTML for Cart placement
 * @param {HTMLElement} self - The banner element
 * @param {Object} data - Savings data
 * @returns {string} - Cart savings HTML
 */
function getSavingsCartHtml(self, data) {
  const { savedAmountText, savingsMessage } = data;

  let headingText;
  if (savedAmountText) {
    const tooltipMatch = savingsMessage?.match(
      /<span class="authentic-savings-help"[^>]*>[\s\S]*?<\/span><\/span>/
    );
    headingText = `You're Saving ${savedAmountText} ${tooltipMatch ? tooltipMatch[0] : ''}`;
  } else if (savingsMessage === "You're Saving with Authentic") {
    headingText = "You're Saving with Authentic";
  } else {
    headingText = savingsMessage?.replace(' with Authentic', '') || "You're Saving";
  }

  return `
    <section class="authentic-banner-section" style='margin-top: ${window.authenticPromotionalBannerMarginTop || 0}px; margin-bottom: ${window.authenticPromotionalBannerMarginBottom || 0}px;'>
      <div class="authentic-banner savings-banner cart-banner">
        <div class='authentic-banner-text-block'>
          <p class='authentic-banner-heading authentic-savings-text'>${headingText}</p>
          <p class='authentic-banner-description'>10% Off and Free Shipping</p>
        </div>
        <div class='authentic-banner-image'>
          <img src="${AUTHENTIC_LOGO_URL}" alt="authentic" loading="lazy">
        </div>
      </div>
    </section>`;
}

function buildSavingsTooltip(tooltipText) {
  return `<span class="authentic-savings-help" role="button" aria-label="Show savings details" tabindex="0">?<span class="authentic-tooltiptext">${tooltipText}</span></span>`;
}

function generateRecognizedMemberMessage(self, data) {
  const { cartHasPdpProduct, savedAmountText, tooltipText } = data;

  if ((self.placement === 'pdp' && !cartHasPdpProduct) || !savedAmountText) {
    return "You're Saving with Authentic";
  }

  return `You're Saving ${savedAmountText} with Authentic ${self.savedLineAmount > 0 ? buildSavingsTooltip(tooltipText) : ''}`;
}

function generateDefaultMessage(self, data) {
  const { savedAmountText, tooltipText } = data;

  if (!savedAmountText) return 'Save with Authentic Membership';

  return `You're Saving ${savedAmountText} with Authentic ${self.savedLineAmount > 0 ? buildSavingsTooltip(tooltipText) : ''}`;
}

function shallowEqual(obj1, obj2) {
  if (obj1 === obj2) return true;
  if (!obj1 || !obj2) return false;

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  if (keys1.length !== keys2.length) return false;

  for (const key of keys1) {
    if (obj1[key] !== obj2[key]) return false;
  }
  return true;
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Returns modal and section HTML content
 * @param {HTMLElement} self - The banner element
 * @param {Object} cartData - Cart data (optional)
 * @param {Object} preCalculatedData - Pre-calculated data (optional)
 * @param {Object} options - Render options
 * @param {boolean} options.includeModal - Whether to include modal HTML
 * @returns {Object} - Object containing modal and section HTML
 */
async function AuthenticPopupSectionHtml(self, cartData, preCalculatedData = null, options = {}) {
  const { includeModal = false } = options;
  const data = preCalculatedData || (await self.calculateBannerData(cartData));
  const content =
    self.placement === 'cart' ? getCartBannerHtml(self, data) : getBannerHtml(self, data);

  const section = `
    <section
      class='authentic-banner-section'
      data-display-membership-banner="true"
      style='
        margin-top: ${window.authenticPromotionalBannerMarginTop || 0}px;
        margin-bottom: ${window.authenticPromotionalBannerMarginBottom || 0}px;
      '
    >
      ${content}
      <div class="authentic__loader"></div>
    </section>
  `;

  return {
    section,
    modal: includeModal ? getModalHtml(self) : null,
  };
}
})();