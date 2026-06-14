(function () {
/**
 * Member Price Block Component
 */

// Simple cache for member price data only
const memberPriceCache = new Map();
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

// Track pending API requests to prevent duplicates
const pendingRequests = new Map();

// Expose cache clearing function globally
window._clearMemberPriceCache = function () {
  memberPriceCache.clear();
  pendingRequests.clear();
};

function getFromCache(key) {
  const cached = memberPriceCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_EXPIRY) {
    return cached.data;
  }
  if (cached) {
    memberPriceCache.delete(key);
  }
  return null;
}

function setInCache(key, data) {
  memberPriceCache.set(key, {
    data,
    timestamp: Date.now(),
  });
}

const instances = new Set();
const CART_UPDATE_DEBOUNCE_MS = 300;

function getCartDataFromEvent(event) {
  const cartData = event?.detail?.cartData || event?.detail?.cart;
  return cartData && typeof cartData === 'object' && Array.isArray(cartData.items)
    ? cartData
    : null;
}

function debounce(fn, wait = CART_UPDATE_DEBOUNCE_MS) {
  let timeoutId = null;
  return (...args) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      const result = fn(...args);
      if (result && typeof result.then === 'function') {
        void result.catch((error) => {
          console.warn('Error in debounced handler:', error);
        });
      }
    }, wait);
  };
}

class MemberPriceBlock extends HTMLElement {
  constructor() {
    super();
    this.state = {
      isLoading: false,
      memberPrice: null,
      isEligible: false,
    };

    // Generate unique instance ID for debugging
    this.instanceId = Math.random().toString(36).substr(2, 9);

    // Extract data from attributes - try multiple possible attribute names
    this.productId =
      this.getAttribute('product-id') ||
      this.getAttribute('data-product-id') ||
      this.getAttribute('pid') ||
      this.dataset.productId;

    this.originalPrice =
      this.getAttribute('original-price') ||
      this.getAttribute('price') ||
      this.getAttribute('data-original-price') ||
      this.getAttribute('data-price') ||
      this.dataset.price;

    // If no product ID found, try to get it from parent authentic-banner element
    if (!this.productId) {
      const bannerParent = this.closest('authentic-banner');
      if (bannerParent) {
        this.productId =
          bannerParent.getAttribute('pid') || bannerParent.getAttribute('product-id');
        this.originalPrice = this.originalPrice || bannerParent.getAttribute('price');
      }
    }

    this.price = parseFloat(this.originalPrice) / 100;
    this.isCartItem =
      this.hasAttribute('data-cart-item') || this.classList.contains('cart__items__member__price');
  }

  connectedCallback() {
    instances.add(this);

    if (!this.isMemberPricingEnabled()) {
      return;
    }

    const cacheKey = this.getCacheKey();
    let cached = getFromCache(cacheKey);

    // For cart items, check for related PDP cache immediately
    if (!cached && this.isCartItem) {
      // Try to find related PDP cache data
      const relatedKey = `pdp-${this.productId}-${this.originalPrice}`;
      const relatedData = getFromCache(relatedKey);
      if (relatedData && relatedData.discount > 0) {
        setInCache(cacheKey, relatedData);
        cached = relatedData;
      }
    }

    if (cached) {
      const syncMembershipStatus = this.getSyncMembershipStatus();

      if (syncMembershipStatus === false) {
        this.hide();
        return;
      }

      this.showPriceSync(cached, {
        // Only use member verbiage when sync cart/auth state confirms eligibility.
        // Unknown state should continue using MAP copy until async reconciliation finishes.
        forceRegularVerbiage: syncMembershipStatus === true,
      });

      // When cart state is not synchronously available, keep cached UI and reconcile asynchronously.
      if (syncMembershipStatus === null) {
        this.reconcileCachedVisibility();
      }
    } else {
      this.init();
    }
  }

  disconnectedCallback() {
    instances.delete(this);
  }

  isMemberPricingEnabled() {
    // Check the data-use-member-price attribute on the element
    const useMemberPrice = this.getAttribute('data-use-member-price');

    // If attribute is explicitly set to 'false', disable member pricing
    if (useMemberPrice === 'false') {
      return false;
    }

    // If attribute is explicitly set to 'true' or any other value, enable member pricing
    if (useMemberPrice !== null) {
      return useMemberPrice !== 'false';
    }

    // Default to enabled if attribute is not present (backwards compatibility)
    return true;
  }

  async init() {
    // Check if member pricing is disabled in theme settings
    if (!this.isMemberPricingEnabled()) {
      return;
    }

    // Skip if content already displayed by sync method
    if (this.innerHTML && this.innerHTML.includes('member__price')) {
      return;
    }

    if (!(await this.shouldShowPrice())) {
      return;
    }

    // Show loading placeholder now that we know the user is eligible and we'll fetch data
    // Only show loading if we don't already have content displayed
    if (!this.innerHTML || this.innerHTML.trim() === '') {
      this.showLoadingState();
    }

    // Add a small delay to make loading state visible (for testing)
    if (window.location.search.includes('debug_loading=true')) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    // Since cache is now handled in connectedCallback, just proceed to fetch
    this.updateDisplay();
  }

  async updateDisplay() {
    if (!this.isConnected) {
      return;
    }

    if (!(await this.shouldShowPrice())) {
      this.hide();
      return;
    }

    const cacheKey = this.getCacheKey();

    try {
      // Check if there's already a pending request for this product
      if (pendingRequests.has(this.productId)) {
        try {
          const memberPrice = await pendingRequests.get(this.productId);
          if (memberPrice && this.isConnected) {
            this.showPrice(memberPrice);
          } else if (this.isConnected) {
            this.hide();
          }
        } catch (error) {
          console.error('Error waiting for pending request:', error);
          if (this.isConnected) this.hide();
        }
        return;
      }

      // Create and store the pending request
      const requestPromise = this.fetchMemberPrice();
      pendingRequests.set(this.productId, requestPromise);

      const memberPrice = await requestPromise;

      // Clean up the pending request
      pendingRequests.delete(this.productId);

      if (memberPrice) {
        setInCache(cacheKey, memberPrice);

        // Update all connected instances of this product
        instances.forEach((instance) => {
          if (instance.productId === this.productId && instance.isConnected) {
            instance.showPrice(memberPrice);
          }
        });
      } else {
        instances.forEach((instance) => {
          if (instance.productId === this.productId && instance.isConnected) {
            instance.hide();
          }
        });
      }
    } catch (error) {
      console.error('Error fetching member price:', error);
      pendingRequests.delete(this.productId);
      instances.forEach((instance) => {
        if (instance.productId === this.productId && instance.isConnected) {
          instance.hide();
        }
      });
    }
  }

  getCacheKey() {
    const cacheKey = this.isCartItem
      ? `cart-${this.productId}`
      : `pdp-${this.productId}-${this.originalPrice}`;
    return cacheKey;
  }

  // Tri-state synchronous membership status:
  // - true: definitely eligible
  // - false: definitely not eligible
  // - null: unknown (cart/auth state not ready yet)
  getSyncMembershipStatus() {
    try {
      if (!window.authenticGlobal) {
        return null;
      }

      // Check if user is a recognized member
      const isRecognizedMember = window.authenticGlobal?.isRecognizedMember?.() || false;
      if (isRecognizedMember) {
        return true;
      }

      // Check if membership product is in cart (synchronous check)
      const subProductId = window.authenticGlobal?.getSubscriptionProductId?.();
      if (!subProductId) {
        return null;
      }

      // Try to get cart data from global state if available
      const cartData = window.authenticGlobal?.getCartSync?.() || null;
      if (cartData) {
        // Check for membership in cart
        const membershipInCart =
          cartData.items?.some((item) => item.product_id.toString() === subProductId.toString()) ||
          false;

        // Check for membership discount applied
        const membershipDiscountApplied =
          cartData.cart_level_discount_applications?.some((disc) => disc.title === 'AUTHENTIC') ||
          false;

        return membershipInCart || membershipDiscountApplied;
      }

      return null;
    } catch (error) {
      console.warn('Error checking membership status synchronously:', error);
      return null;
    }
  }

  // Synchronous check for membership status
  checkMembershipStatus() {
    try {
      const syncMembershipStatus = this.getSyncMembershipStatus();
      return syncMembershipStatus === true;
    } catch (error) {
      console.warn('Error checking membership status synchronously:', error);
      return false;
    }
  }

  async reconcileCachedVisibility() {
    try {
      const shouldShowPrice = await this.shouldShowPrice();
      if (!this.isConnected) {
        return;
      }

      if (!shouldShowPrice) {
        this.hide();
        return;
      }

      const cacheKey = this.getCacheKey();
      const cached = getFromCache(cacheKey);
      if (cached) {
        // Once async eligibility resolves true, ensure cached PDP text uses member verbiage.
        this.showPriceSync(cached, { forceRegularVerbiage: true });
      }
    } catch (error) {
      console.warn('Error reconciling cached member price visibility:', error);
    }
  }

  // Synchronous version for immediate cache restoration
  showPriceSync(priceData, options = {}) {
    if (!priceData || !priceData.discount || priceData.discount <= 0) {
      this.innerHTML = '';
      return;
    }

    // Check eligibility
    if (priceData.eligible === false) {
      this.innerHTML = '';

      // Emit event to tell Vue component to show regular price
      if (!this.isCartItem) {
        // Get the authentic banner element to check if we're on the right PDP
        const authenticBanner = document.querySelector('authentic-banner[placement="pdp"]');
        if (!authenticBanner) {
          return; // No PDP banner found, skip event
        }

        // Only emit if this product matches the current PDP product
        const currentPdpProductId = authenticBanner.getAttribute('pid');
        if (!currentPdpProductId || this.productId === currentPdpProductId) {
          window.dispatchEvent(
            new CustomEvent('membershipPriceUpdated', {
              detail: {
                formattedMembershipPrice: null,
                shouldShowMemberPrice: false,
                productId: this.productId,
              },
            })
          );
        }
      }

      // Track analytics for not shown
      if (typeof window.authentic_trackEventAnalytics === 'function') {
        setTimeout(() => {
          window.authentic_trackEventAnalytics('view_membership_price', { shown: false });
        }, 0);
      }
      return;
    }

    // Use the member price directly from the API response
    const memberPrice = priceData.price / 100; // API provides final member price in cents
    const discountInDollars = priceData.discount / 100; // API provides discount in cents

    const formattedMemberPrice = `$${memberPrice % 1 === 0 ? memberPrice.toFixed(0) : memberPrice.toFixed(2)}`;
    const formattedDiscount = `$${discountInDollars % 1 === 0 ? discountInDollars.toFixed(0) : discountInDollars.toFixed(2)}`;

    let displayText;

    // For cart items, use standard member price format only
    if (this.isCartItem) {
      if (priceData.member_price_copy) {
        displayText = priceData.member_price_copy.replace('${price}', formattedMemberPrice);
      } else {
        displayText = `${formattedMemberPrice} Member Price`;
      }
    } else {
      // For PDP, check if user is recognized member or has membership in cart
      const shouldUseRegularVerbiage =
        options?.forceRegularVerbiage ?? this.checkMembershipStatus();

      if (shouldUseRegularVerbiage) {
        // Use regular member price copy instead of MAP copy for members
        if (priceData.member_price_copy) {
          displayText = priceData.member_price_copy.replace('${price}', formattedMemberPrice);
        } else {
          displayText = `${formattedMemberPrice} Member Price`;
        }
      } else {
        // For non-members without membership, use MAP copy if available
        if (priceData.member_price_map_copy) {
          displayText = priceData.member_price_map_copy.replace('${discount}', formattedDiscount);
        } else if (priceData.member_price_copy) {
          displayText = priceData.member_price_copy.replace('${price}', formattedMemberPrice);
        } else {
          displayText = `${formattedMemberPrice} Member Price`;
        }
      }
    }

    // Direct content update
    this.innerHTML = `<div class="member__price">${displayText}</div>`;

    // Dispatch membership price change event
    if (!this.isCartItem) {
      // Only for PDP items
      window.dispatchEvent(
        new CustomEvent('authentic:membership-price-change', {
          bubbles: true,
          detail: {
            pdpPrice: Number(this.originalPrice),
            memberPrice: priceData.price,
            discount: priceData.discount,
          },
        })
      );
    }

    // Track view_membership_price analytics
    if (typeof window.authentic_trackEventAnalytics === 'function') {
      setTimeout(() => {
        window.authentic_trackEventAnalytics('view_membership_price', { shown: true });
      }, 0);
    }

    // Emit membershipPriceUpdated event for Vue component compatibility
    this.emitMembershipPriceUpdated(priceData);
  }

  // Async version for new data fetching
  showPrice(priceData, options = {}) {
    if (!this.isConnected || !priceData) {
      return;
    }

    // Check if product is eligible for member pricing
    if (!priceData.discount || priceData.discount <= 0) {
      this.hide();
      return;
    }

    // Use the sync version for actual display
    this.showPriceSync(priceData, options);
  }

  showLoadingState() {
    // Match the old theme code pattern for cart loading
    if (this.isCartItem) {
      this.innerHTML = '<span class="cart__item__member__price__loading"></span>';
    } else {
      // For PDP, use the CSS structure that matches the stylesheet
      this.innerHTML =
        '<div class="member__price member-price-loading"><span class="loading-placeholder"></span></div>';
    }
  }

  hide() {
    this.innerHTML = '';

    // Only emit events for PDP member price blocks, not cart items
    if (this.isCartItem) {
      return;
    }

    // Get the authentic banner element to check if we're on the right PDP
    const authenticBanner = document.querySelector('authentic-banner[placement="pdp"]');
    if (!authenticBanner) {
      return; // No PDP banner found
    }

    // Only emit if this product matches the current PDP product
    const currentPdpProductId = authenticBanner.getAttribute('pid');
    if (!currentPdpProductId || this.productId === currentPdpProductId) {
      window.dispatchEvent(
        new CustomEvent('membershipPriceUpdated', {
          detail: {
            formattedMembershipPrice: null,
            shouldShowMemberPrice: false,
            productId: this.productId,
          },
        })
      );
    }
  }

  checkCartForMembership(cartData) {
    const subProductId = window.authenticGlobal.getSubscriptionProductId();

    const membershipInCart =
      cartData.items?.some((item) => item.product_id.toString() === subProductId?.toString()) ||
      false;

    const membershipDiscountApplied =
      cartData.cart_level_discount_applications?.some((disc) => disc.title === 'AUTHENTIC') ||
      false;

    const isRecognizedMember = window.authenticGlobal?.isRecognizedMember?.() || false;

    return membershipInCart || membershipDiscountApplied || isRecognizedMember;
  }

  async shouldShowPrice() {
    try {
      if (!this.isMemberPricingEnabled()) {
        return false;
      }

      if (!window.authenticGlobal) {
        return false;
      }

      try {
        const syncCart = window.authenticGlobal.getCartSync?.();
        if (syncCart) {
          return this.checkCartForMembership(syncCart);
        }

        const cartData = await window.authenticGlobal.getCart();
        return this.checkCartForMembership(cartData);
      } catch (cartError) {
        console.warn(
          'Cart fetch failed in shouldShowPrice, checking subscription only:',
          cartError
        );
        return window.authenticGlobal?.isRecognizedMember?.() || false;
      }
    } catch (error) {
      console.error('Error checking membership status:', error);
      return false;
    }
  }

  readBannerEligibilityCache() {
    try {
      const key = `eligibility_${this.productId}_${this.originalPrice}`;
      const raw = sessionStorage.getItem(key);
      if (raw) {
        const { data, timestamp } = JSON.parse(raw);
        if (Date.now() - timestamp < CACHE_EXPIRY) {
          return data;
        }
      }
    } catch (_) {}
    return null;
  }

  async fetchMemberPrice() {
    try {
      const bannerCached = this.readBannerEligibilityCache();

      const [memberPriceData, mapPriceResponse] = await Promise.all([
        bannerCached
          ? Promise.resolve(bannerCached)
          : fetch(
              `/apps/authentic/public/products/${this.productId}/member-price?price=${this.originalPrice}`
            ).then((res) => {
              if (!res.ok) throw new Error(`Member price API error! status: ${res.status}`);
              return res.json();
            }),
        fetch(`/apps/authentic/public/ab-test/member-pricing`),
      ]);

      // Handle map price data (may fail, that's OK)
      let mapPriceData = {};
      try {
        if (mapPriceResponse.ok) {
          mapPriceData = await mapPriceResponse.json();
        }
      } catch (mapError) {
        console.warn('Map price data unavailable:', mapError.message);
      }

      // Use map price copy from AB test response if available
      const finalData = {
        ...memberPriceData,
        ab_test_show: mapPriceData.ab_test_show || false,
      };

      // Prioritize member-pricing response for copy text
      if (mapPriceData.member_price_map_copy) {
        finalData.member_price_map_copy = mapPriceData.member_price_map_copy;
      }

      if (mapPriceData.member_price_copy) {
        finalData.member_price_copy = mapPriceData.member_price_copy;
      }

      return finalData;
    } catch (error) {
      console.error('Failed to fetch member price:', error);
      return null;
    }
  }

  emitMembershipPriceUpdated(priceData) {
    if (!priceData || !priceData.price) return;

    // Only emit events for PDP member price blocks, not cart items
    if (this.isCartItem) {
      return;
    }

    // Get the authentic banner element to check if we're on the right PDP
    const authenticBanner = document.querySelector('authentic-banner[placement="pdp"]');
    if (!authenticBanner) {
      return; // No PDP banner found
    }

    // Only emit if this product matches the current PDP product
    const currentPdpProductId = authenticBanner.getAttribute('pid');
    if (currentPdpProductId && this.productId !== currentPdpProductId) {
      return; // This is not the current PDP product
    }

    const membershipPrice = priceData.price / 100; // Convert cents to dollars
    const formattedMembershipPrice = `$${membershipPrice % 1 === 0 ? membershipPrice.toFixed(0) : membershipPrice.toFixed(2)}`;

    // If we're showing the member price, that means the user should see member pricing
    const shouldShowMemberPrice = true;

    window.dispatchEvent(
      new CustomEvent('membershipPriceUpdated', {
        detail: {
          formattedMembershipPrice: formattedMembershipPrice,
          shouldShowMemberPrice: shouldShowMemberPrice,
          productId: this.productId,
        },
      })
    );
  }
}

// Register the custom element
if (!customElements.get('member-price-block')) {
  customElements.define('member-price-block', MemberPriceBlock);
}

async function refreshMemberPriceInstances({ forceFresh = false, cartData: providedCartData = null } = {}) {
  const connectedInstances = Array.from(instances).filter((instance) => instance.isConnected);
  if (connectedInstances.length === 0) {
    return;
  }

  let cartData = providedCartData;
  try {
    if (cartData) {
      // Use the cart snapshot from the upstream event to avoid another cart read.
    } else if (forceFresh) {
      cartData = await window.authenticGlobal?.getCart?.({ forceFresh: true });
    } else {
      cartData = window.authenticGlobal?.getCartSync?.();
      if (!cartData) {
        cartData = await window.authenticGlobal?.getCart?.();
      }
    }
  } catch (error) {
    console.warn('Unable to load cart for member price refresh:', error);
  }

  for (const instance of connectedInstances) {
    if (!instance.isConnected) {
      continue;
    }

    try {
      const shouldShow = cartData
        ? (
            instance.isMemberPricingEnabled() &&
            !!window.authenticGlobal &&
            instance.checkCartForMembership(cartData)
          )
        : await instance.shouldShowPrice();

      if (shouldShow) {
        const cacheKey = instance.getCacheKey();
        const cached = getFromCache(cacheKey);
        if (cached) {
          instance.showPrice(cached, { forceRegularVerbiage: true });
        } else {
          instance.showLoadingState();
          await instance.updateDisplay();
        }
      } else {
        instance.hide();
      }
    } catch (error) {
      console.warn('Error refreshing member price instance:', error);
      instance.hide();
    }
  }
}

const handleCartUpdate = debounce(async (event) => {
  const eventCartData = getCartDataFromEvent(event);
  const forceFreshFromEvent =
    !eventCartData &&
    (
      event?.detail?.forceFresh === true ||
      event?.type === 'theme:cart:change' ||
      event?.type === window.AUTHENTIC_PUB_SUB_EVENTS?.cartUpdate
    );

  await refreshMemberPriceInstances({ forceFresh: forceFreshFromEvent, cartData: eventCartData });
});

window.addEventListener('authentic:cart-updated', handleCartUpdate);
window.addEventListener('theme:cart:change', handleCartUpdate);
// Fallback to canonical pub-sub event name even if globals initialize later.
window.addEventListener('cart-update', handleCartUpdate);

function registerPubSubCartUpdateListener() {
  const pubSubCartUpdateEvent = window.AUTHENTIC_PUB_SUB_EVENTS?.cartUpdate;
  if (pubSubCartUpdateEvent && pubSubCartUpdateEvent !== 'cart-update') {
    window.addEventListener(pubSubCartUpdateEvent, handleCartUpdate);
    return true;
  }
  return !!pubSubCartUpdateEvent;
}

if (!registerPubSubCartUpdateListener()) {
  let attempts = 0;
  const maxAttempts = 20;
  const intervalId = setInterval(() => {
    attempts += 1;
    if (registerPubSubCartUpdateListener() || attempts >= maxAttempts) {
      clearInterval(intervalId);
    }
  }, 250);
}

// Global event listeners
window.addEventListener('authentic:membership-added', () => {
  // Don't clear cache - just show member prices if we have them cached
  const tasks = [];
  for (const instance of instances) {
    if (instance.isConnected) {
      const cacheKey = instance.getCacheKey();
      const cached = getFromCache(cacheKey);
      if (cached) {
        instance.showPrice(cached, { forceRegularVerbiage: true });
      } else {
        // Only show loading and fetch if not cached
        instance.showLoadingState();
        tasks.push(
          instance.updateDisplay().catch((error) => {
            console.warn('Error updating member price after membership-added event:', error);
          })
        );
      }
    }
  }

  if (tasks.length > 0) {
    void Promise.allSettled(tasks);
  }
});

// Listen for membership status changes
window.addEventListener('authentic:membership-status-changed', (e) => {
  const shouldShowPrices = e.detail?.shouldShowPrices || false;
  const tasks = [];

  for (const instance of instances) {
    if (instance.isConnected) {
      if (shouldShowPrices) {
        // User is now eligible for member prices - check cache first
        const cacheKey = instance.getCacheKey();
        const cached = getFromCache(cacheKey);
        if (cached) {
          instance.showPrice(cached, { forceRegularVerbiage: true });
        } else {
          instance.showLoadingState();
          tasks.push(
            instance.updateDisplay().catch((error) => {
              console.warn(
                'Error updating member price after membership-status-changed event:',
                error
              );
            })
          );
        }
      } else {
        // User is no longer eligible - hide member prices immediately
        instance.hide();
      }
    }
  }

  if (tasks.length > 0) {
    void Promise.allSettled(tasks);
  }
});

// Listen for membership removal to immediately hide prices for non-members
window.addEventListener('authentic:membership-removed', async () => {
  // Clear member price cache when membership is removed
  memberPriceCache.clear();

  for (const instance of instances) {
    if (instance.isConnected) {
      // Check if user is a recognized member
      const isRecognizedMember = window.authenticGlobal?.isRecognizedMember?.() || false;

      // If not a recognized member, hide member prices immediately
      if (!isRecognizedMember) {
        instance.hide();
      }
    }
  }
});

// Listen for member login to update member prices
window.addEventListener('authentic:member-login', () => {
  // Clear cache and update all instances
  memberPriceCache.clear();
  void refreshMemberPriceInstances({ forceFresh: true }).catch((error) => {
    console.warn('Error updating member price after login:', error);
  });
});

// Variant price change handler with smart caching
window.addEventListener('authentic:variant-price-change', (e) => {
  if (e.detail?.variantPrice !== undefined) {
    instances.forEach((instance) => {
      if (!instance.isCartItem && instance.isConnected) {
        // Only update PDP instances
        const oldCacheKey = `pdp-${instance.productId}-${instance.originalPrice}`;
        const newPrice = (e.detail.variantPrice * 100).toString();
        const newCacheKey = `pdp-${instance.productId}-${newPrice}`;

        const existingData = getFromCache(newCacheKey);

        if (existingData) {
          instance.originalPrice = newPrice;
          instance.price = e.detail.variantPrice;
          instance.showPrice(existingData, { forceRegularVerbiage: true });
        } else {
          // No cached data for new variant - need to fetch
          instance.originalPrice = newPrice;
          instance.price = e.detail.variantPrice;
          // Don't show loading state if we already have a valid member price displayed
          // Only show loading if we have no content or are already in a loading state
          const hasValidPrice =
            instance.innerHTML &&
            instance.innerHTML.includes('member__price') &&
            !instance.innerHTML.includes('loading');
          if (!hasValidPrice) {
            instance.showLoadingState();
          }
          void instance.updateDisplay().catch((error) => {
            console.warn('Error updating member price after variant change:', error);
          });
        }
        memberPriceCache.delete(oldCacheKey); // Clean up old cache entry
      }
    });
  }
});
})();
