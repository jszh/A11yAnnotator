/**
 * Membership Checkout Button
 */

// Main global object
const membershipCheckoutGlobal = {
  version: '1.0.0',
  settings: window.membershipCheckoutSettings || {},
};

const ELIGIBILITY_CACHE_PREFIX = 'membership_checkout_eligibility_';
const ELIGIBILITY_CACHE_TTL_MS = 5 * 60 * 1000;
const DCB_CART_FRESH_REUSE_MS = 700;
const DCB_CART_STALE_REUSE_MS = 2000;
const DCB_CART_RATE_LIMIT_COOLDOWN_MS = 5000;

function buildCartFingerprint(cartData) {
  if (!cartData || !Array.isArray(cartData.items)) return 'empty';

  const itemPart = cartData.items
    .map(item => `${item.product_id}:${item.variant_id || ''}:${item.quantity || 0}:${item.price || 0}`)
    .sort()
    .join('|');

  const attrMember = cartData.attributes?.['authentic-member'] || '';
  const token = cartData.token || '';
  const total = cartData.total_price || 0;
  const count = cartData.item_count || cartData.items.length || 0;

  return `${token}::${count}::${total}::${attrMember}::${itemPart}`;
}

function isUsableCartSnapshot(cartData) {
  if (!cartData || typeof cartData !== 'object' || !Array.isArray(cartData.items)) {
    return false;
  }

  if (typeof cartData.total_price === 'undefined') {
    return false;
  }

  return cartData.items.every(item =>
    item &&
    typeof item === 'object' &&
    typeof item.product_id !== 'undefined' &&
    typeof item.quantity !== 'undefined' &&
    typeof item.price !== 'undefined' &&
    typeof item.line_price !== 'undefined'
  );
}

function getEventCartData(event) {
  const cartData = event?.detail?.cartData || event?.detail?.cart;
  return isUsableCartSnapshot(cartData)
    ? cartData
    : null;
}

function readEligibilityCache(cacheKey) {
  try {
    const raw = sessionStorage.getItem(cacheKey);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed?.timestamp || Date.now() - parsed.timestamp > ELIGIBILITY_CACHE_TTL_MS) {
      return null;
    }

    return parsed.data ?? null;
  } catch (_) {
    return null;
  }
}

function writeEligibilityCache(cacheKey, data) {
  try {
    sessionStorage.setItem(
      cacheKey,
      JSON.stringify({
        timestamp: Date.now(),
        data,
      })
    );
  } catch (_) {
    // Ignore storage failures.
  }
}

function getGlobalCartFetchState() {
  if (!window._dcbCartFetchState) {
    window._dcbCartFetchState = {
      pendingFresh: null,
      pendingStale: null,
      lastCart: null,
      lastFetchedAt: 0,
      cooldownUntil: 0,
    };
  }
  return window._dcbCartFetchState;
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

class MemberCheckoutButton extends HTMLElement {
  constructor() {
    super();
    this.isInitialized = false;
    this.isLoading = false;
    this.isCheckingOut = false;
    this.cachedMemberStatus = null;
    this._updatingPrice = false;
    this.checkoutFallbackActivated = false;
    this.cartFetchUnavailable = false;
    this.timeouts = new Set();
    this.priceUpdateTimeouts = new Set();
    this.eventHandlers = [];
    this._cartRequestPending = null;
    this._cartRequestPendingFresh = null;
    this._memberStatusPending = null;
    this._lastCartFingerprint = '';
    this._lastMemberStatusFingerprint = '';
    this._lastProcessedMutationIdBySource = {};
    this._lastFetchedCart = null;
    this._cartUpdateDebounceTimeout = null;
    this._lastCartEvent = null;

    // Stable instance ID used to scope preserved state so multiple
    // <member-checkout-button> elements on the same page don't collide.
    this._instanceId = this.id || `dcb-${Math.random().toString(36).slice(2, 9)}`;

    const stateMap = window._dcbPreservedState;
    const preserved = stateMap?.[this._instanceId];
    if (preserved && Date.now() - preserved.timestamp < 30000) {
      delete stateMap[this._instanceId];
      this._lastFetchedCart = preserved.lastFetchedCart;
      this.cachedMemberStatus = preserved.cachedMemberStatus;
      this._preservedShouldShow = preserved.shouldShow;
      this._restoredAt = Date.now();
    }
  }

  connectedCallback() {
    if (this.isInitialized) return;
    this.init();
  }

  init() {
    if (this.isInitialized) return;

    // Hide for confirmed non-US countries.
    try {
      const shopifyCountry = window?.Shopify?.country;
      if (shopifyCountry && shopifyCountry !== 'US') {
        this.isInitialized = true;
        this.style.display = 'none';
        return;
      }
    } catch (_) {}

    const settings = window.membershipCheckoutSettings || {};
    this.config = {
      showMembershipCheckoutButton: settings.show_membership_button ?? true,
      text: settings.default_button_text || 'CHECKOUT WITH MEMBERSHIP',
      memberDiscountPercentage: settings.default_member_discount_percentage || 10,
      buttonCustomClasses: (settings.button_custom_classes || '').trim(),
    };

    if (!this.config.showMembershipCheckoutButton) {
      this.isInitialized = true;
      this.style.display = 'none';
      return;
    }

    // If preserved state says the user was a recognized member, skip the
    // initial render to avoid flashing the button before the async check hides it.
    const wasMember = this._preservedShouldShow === false || this.cachedMemberStatus === true;
    if (wasMember) {
      this.shouldShow = false;
      this.setAttribute('data-is-member', 'true');
      this.style.display = 'none';
      this.isInitialized = true;
      queueMicrotask(() => this._backgroundInit());
      this._pageShowHandler = async (event) => {
        if (!event.persisted) return;
        try {
          const visibilityChanged = await this.checkVisibility({ forceFresh: true });
          if (visibilityChanged && !this.shouldShow) {
            this.style.display = 'none';
            this.innerHTML = '';
          } else if (visibilityChanged && this.shouldShow) {
            await this.render();
            this.setupCartListeners();
            this.setupRegularCheckoutListener();
          }
        } catch (_) {}
      };
      window.addEventListener('pageshow', this._pageShowHandler);
      return;
    }

    // Re-check membership when the browser restores this page from bfcache
    // (e.g. user clicked "Checkout with Membership", then pressed Back).
    // Registered unconditionally so a render failure doesn't orphan it.
    this._pageShowHandler = async (event) => {
      if (!event.persisted) return;
      try {
        const visibilityChanged = await this.checkVisibility({ forceFresh: true });
        if (visibilityChanged && !this.shouldShow) {
          this.style.display = 'none';
          this.innerHTML = '';
        }
      } catch (_) {}
    };
    window.addEventListener('pageshow', this._pageShowHandler);

    // Render immediately — the button is static, only the price is async.
    // Listeners are only registered when render() succeeds to prevent
    // duplicate cart handlers if render() throws.
    this.shouldShow = true;
    this.setAttribute('data-is-member', 'false');
    try {
      this.render();
      this.setupCartListeners();
      this.setupRegularCheckoutListener();
    } catch (error) {
      console.error('[DCB] Initial render failed:', error);
      this.style.display = 'none';
      this.isInitialized = true;
      return;
    }
    this.isInitialized = true;

    // Background: calculate price and verify membership status.
    // If the user turns out to be a recognized member, hide the button then.
    // Errors here never hide the button — worst case the price shows a shimmer.
    queueMicrotask(() => this._backgroundInit());
  }

  async _backgroundInit() {
    try {
      // Always forceFresh — the preserved cart (if any) was only for the
      // instant render; we need the real post-mutation cart for accurate price.
      const visibilityChanged = await this.checkVisibility({ forceFresh: true });

      if (visibilityChanged && !this.shouldShow) {
        this.style.display = 'none';
        this.innerHTML = '';
        return;
      }

      if (this.shouldShow) {
        const alreadyRendered = !!this.querySelector('[data-member-checkout-btn]');
        if (!alreadyRendered) {
          this.setAttribute('data-is-member', 'false');
          try {
            await this.render();
            this.setupCartListeners();
            this.setupRegularCheckoutListener();
          } catch (error) {
            console.error('[DCB] Background render failed:', error);
          }
        } else if (this._lastFetchedCart) {
          this.debouncedUpdateButtonPrice(this._lastFetchedCart, false);
        }
      }
    } catch (error) {
      console.warn('[DCB] Background member check failed:', error);
    }
  }

  disconnectedCallback() {
    if (this.isInitialized && this.config) {
      if (!window._dcbPreservedState) window._dcbPreservedState = {};
      window._dcbPreservedState[this._instanceId] = {
        config: { ...this.config },
        shouldShow: this.shouldShow,
        cachedMemberStatus: this.cachedMemberStatus,
        lastFetchedCart: this._lastFetchedCart,
        timestamp: Date.now(),
      };
    }

    this.timeouts.forEach(timeoutId => clearTimeout(timeoutId));
    this.timeouts.clear();

    this.priceUpdateTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
    this.priceUpdateTimeouts.clear();

    if (this._cartUpdateDebounceTimeout) {
      clearTimeout(this._cartUpdateDebounceTimeout);
      this._cartUpdateDebounceTimeout = null;
    }
    this._lastCartEvent = null;

    if (this._pageShowHandler) {
      window.removeEventListener('pageshow', this._pageShowHandler);
      this._pageShowHandler = null;
    }

    if (this.regularCheckoutHandler) {
      document.removeEventListener('submit', this.regularCheckoutHandler);
      this.regularCheckoutHandler = null;
    }

    if (this.eventHandlers) {
      this.eventHandlers.forEach(({ element, eventName, handler, capture }) => {
        element.removeEventListener(eventName, handler, capture || false);
      });
      this.eventHandlers = [];
    }

    this._cartListenersRegistered = false;
    this.isInitialized = false;
  }

  shouldRender() {
    return this.shouldShow;
  }

  async checkVisibility(options = {}) {
    if (!this.config.showMembershipCheckoutButton) {
      this.shouldShow = false;
      this.setAttribute('data-is-member', 'true');
      return true;
    }

    // Snapshot the cached value BEFORE the async call — getMemberStatus writes
    // to this.cachedMemberStatus internally, so comparing after the await would
    // always produce "no change" and the button would never be hidden.
    const prevMemberStatus = this.cachedMemberStatus;

    // Check member status if authenticGlobal exists
    const isRecognizedMember = window.authenticGlobal
      ? await this.getMemberStatus({
          forceFresh: options.forceFresh === true,
          mutationId: options.mutationId || null,
          cartData: options.cartData || null,
        })
      : false;

    // Only update if member status has changed
    if (prevMemberStatus !== isRecognizedMember) {
      this.cachedMemberStatus = isRecognizedMember;
      this.setAttribute('data-is-member', String(isRecognizedMember));

      if (isRecognizedMember) {
        this.shouldShow = false;
        this.innerHTML = '';
      } else {
        this.shouldShow = true;
      }

      return true;
    }

    return false;
  }

  formatPrice(priceInCents) {
    const dollarAmount = priceInCents / 100;
    const formattedAmount = dollarAmount.toLocaleString('en-US', {
      minimumFractionDigits: dollarAmount % 1 === 0 ? 0 : 2,
      maximumFractionDigits: dollarAmount % 1 === 0 ? 0 : 2,
    });
    return `$${formattedAmount}`;
  }

  async render() {
    try {
      if (!this.shouldShow) {
        this.style.display = 'none';
        return;
      }

      const buttonClasses = this.config.buttonCustomClasses ||
        'membership-checkout-button gt-btn__checkout btn btn--primary btn--large btn--full';

      this.innerHTML = `
        <div class="membership-checkout-wrapper">
          <div class="membership-checkout-button-container">
            <button
              id="membership-checkout-button"
              type="button"
              data-member-checkout-btn
              data-is-member="${this.getAttribute('data-is-member')}"
            >
              <span class="button-text"></span><span class="price-container"><span class="price-loading"></span></span>
            </button>
          </div>
        </div>
      `;

      const btn = this.querySelector('[data-member-checkout-btn]');
      if (btn) btn.setAttribute('class', buttonClasses);

      const textSpan = this.querySelector('.button-text');
      if (textSpan) textSpan.textContent = `${this.config.text} • `;
      this.style.display = '';
      this.classList.remove('hide');

      // Set up event listener after rendering
      this.setupEventListeners();

      setTimeout(() => {
        if (this._lastFetchedCart) {
          this.debouncedUpdateButtonPrice(this._lastFetchedCart, false);
        } else {
          this.debouncedUpdateButtonPrice(null, true);
        }
      }, 50);
    } catch (error) {
      console.error('Error rendering membership checkout button:', error);
      this.style.display = 'none';
    }
  }

  setupEventListeners() {
    const button = this.querySelector('[data-member-checkout-btn]');
    if (!button) return;

    if (!this.eventHandlers) {
      this.eventHandlers = [];
    }

    // Remove any listeners previously attached by this method so that
    // repeated render() calls don't stack duplicate handlers.
    this.eventHandlers = this.eventHandlers.filter(({ element, eventName, handler, _buttonScoped }) => {
      if (_buttonScoped) {
        element.removeEventListener(eventName, handler, true);
        element.removeEventListener(eventName, handler);
        return false;
      }
      return true;
    });

    // Button click handler
    const clickHandler = async e => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      // Track the dual checkout click
      this.trackDualCheckoutClick();

      if (this.isLoading || this.isCheckingOut) return;

      // Set checking out state before loading state to prevent price shimmer
      this.isCheckingOut = true;
      await this.setLoadingState(true);
      try {
        await this.handleCheckoutClick();
      } catch (error) {
        console.error('Checkout failed:', error);
        this.showError('Checkout failed. Please try again.');
        this.isCheckingOut = false; // Reset on error
      } finally {
        this.isCheckingOut = false;
        await this.setLoadingState(false);
      }
    };

    button.addEventListener('click', clickHandler, true);
    this.eventHandlers.push({ element: button, eventName: 'click', handler: clickHandler, _buttonScoped: true, capture: true });

    // Membership status change handler
    const debouncedCheck = event => {
      const timeoutId = setTimeout(async () => {
        const mutationId = event?.detail?.mutationId || null;
        if (
          mutationId &&
          mutationId === this._lastProcessedMutationIdBySource.membershipStatusChange
        ) {
          this.timeouts.delete(timeoutId);
          return;
        }
        if (mutationId) {
          this._lastProcessedMutationIdBySource.membershipStatusChange = mutationId;
        }
        await this.checkVisibility({
          forceFresh: event?.detail?.forceFresh === true,
          mutationId,
        });
        this.timeouts.delete(timeoutId);
      }, 1000);
      this.timeouts.add(timeoutId);
    };

    // Listen for membership-related events (cart updates handled in setupCartListeners)
    [
      'authentic:member-login',
      'authentic:refresh-membership-status',
    ].forEach(eventName => {
      window.addEventListener(eventName, debouncedCheck);
      this.eventHandlers.push({ element: window, eventName, handler: debouncedCheck, _buttonScoped: true });
    });
  }

  setupCartListeners() {
    if (this._cartListenersRegistered) return;
    this._cartListenersRegistered = true;

    const handleCartUpdate = async event => {
      if (this.isLoading || this.isCheckingOut) return;

      if (this._restoredAt && Date.now() - this._restoredAt < 1000) {
        this._restoredAt = null;
        return;
      }
      this._restoredAt = null;

      try {
        this._lastCartEvent = event;

        if (this._cartUpdateDebounceTimeout) {
          clearTimeout(this._cartUpdateDebounceTimeout);
          this._cartUpdateDebounceTimeout = null;
        }

        this._cartUpdateDebounceTimeout = setTimeout(async () => {
          const latestEvent = this._lastCartEvent;
          const eventCartData = getEventCartData(latestEvent);
          const mutationId = latestEvent?.detail?.mutationId || null;
          if (mutationId && mutationId === this._lastProcessedMutationIdBySource.cartUpdate) {
            return;
          }
          if (mutationId) {
            this._lastProcessedMutationIdBySource.cartUpdate = mutationId;
          }

          const visibilityChanged = await this.checkVisibility({
            forceFresh:
              latestEvent?.detail?.forceFresh === true ||
              (!eventCartData && latestEvent?.type === 'theme:cart:change'),
            mutationId,
            cartData: eventCartData,
          });

          if (visibilityChanged) {
            await this.render();
          } else if (this.shouldShow) {
            if (this._lastFetchedCart) {
              this.debouncedUpdateButtonPrice(this._lastFetchedCart, false);
            } else {
              this.debouncedUpdateButtonPrice(null, true);
            }
          }
        }, 350); // Coalesce bursty cart events into one update cycle
      } catch (error) {
        console.error('Error handling cart update:', error);
      }
    };

    const cartUpdateHandler = handleCartUpdate;
    const cartEvents = ['theme:cart:change', 'authentic:cart-updated'];
    cartEvents.forEach(eventName => {
      window.addEventListener(eventName, cartUpdateHandler, { passive: true });
      this.eventHandlers.push({ element: window, eventName, handler: cartUpdateHandler });
    });
  }

  setupRegularCheckoutListener() {
    if (this.regularCheckoutHandler) return;

    const handleCheckout = async e => {

      const cartForm = e.target.closest('form.cart, form[action*="cart"], form[action="/cart"]');
      if (!cartForm) {
        return;
      }

      // Only intercept if this is NOT the dual checkout button
      if (e.target.closest('[data-member-checkout-btn]')) {
        return;
      }

      // Only intercept actual checkout buttons, not other cart form elements
      if (!e.target.matches('button[name="add"], input[name="add"], button[type="submit"], input[type="submit"], .btn--checkout, [name="checkout"], #checkout-button')) {
        return;
      }

      // Dual checkout is always enabled (A/B testing removed)
      try {
        const cart = await this.getFreshCart({ forceFresh: true });
        if (!cart || !cart.items || cart.items.length === 0 || cart.total_price === 0) {
          console.warn('Not intercepting checkout - cart appears empty or invalid');
          return;
        }

        // Only intercept if user is not a member and membership is in cart
        const isMember = await this.getMemberStatus();
        const hasMembership = this.isMembershipProductInCart(cart);

        if (!isMember && hasMembership) {
          // Prevent default AFTER we verify we should intercept
          e.preventDefault();
          e.stopPropagation();

          try {
            await this.setLoadingState(true);
            await this.removeMembershipFromCart();

            // Add delay to ensure cart state is updated before checkout
            await new Promise(resolve => setTimeout(resolve, 500));

            window.location.href = '/checkout?payment=shop_pay';
          } catch (error) {
            console.error('Failed to remove membership product:', error);
            this.showError('Failed to update cart. Please try again.');
            await this.setLoadingState(false);
          }
        }
        // If we shouldn't intercept, let the normal checkout proceed
      } catch (error) {
        console.error('Error in checkout interception:', error);
        // On error, let normal checkout proceed to avoid breaking user experience
        return;
      }
    };

    // Store handler reference for cleanup
    this.regularCheckoutHandler = handleCheckout.bind(this);

    // Use more specific event binding to avoid interfering with other forms
    // Add listener to document but with more careful filtering
    document.addEventListener('submit', this.regularCheckoutHandler, { passive: false });
  }

  trackDualCheckoutClick() {
    // Track dual checkout button clicks
    if (window._authentic_trackEvent) {
      authentic_trackEventAnalytics('click_dual_checkout_button', {
        widgetVersion: 'dual-checkout-v1'
      });
    }
  }

  async handleCheckoutClick() {
    try {
      this.isCheckingOut = true;

      // Step 1: Check if membership is already in cart
      const cart = await this.getFreshCart({ forceFresh: true });
      const membershipAlreadyExists = this.hasMembershipInCart(cart);

      if (membershipAlreadyExists) {
        window.location.href = '/checkout?payment=shop_pay';
        return;
      }

      // Step 2: Add membership to cart using safe method
      await this.addMembershipToCartSafely();

      // Step 3: Wait for membership to appear in cart (simple polling)
      await this.waitForMembership();

      // Step 4: Go to checkout
      window.location.href = '/checkout?payment=shop_pay';
    } catch (error) {
      if (this.isCartFetchTerminalError(error)) {
        this.fallbackToStandardCheckout();
        return;
      }
      console.error('Dual checkout failed:', error);
      this.isCheckingOut = false;
      this.showError('Unable to add membership. Please try again.');
    }
  }

  // Fetch cart with shared in-flight dedupe; forceFresh is opt-in.
  async getFreshCart(options = {}) {
    const forceFresh = options.forceFresh === true;
    const cartFetchState = getGlobalCartFetchState();
    const now = Date.now();
    const cachedCart = cartFetchState.lastCart;
    const cachedAge = now - cartFetchState.lastFetchedAt;
    const pending = forceFresh ? cartFetchState.pendingFresh : cartFetchState.pendingStale;
    if (pending) return pending;

    // Prevent request storms immediately after store-level rate limiting.
    if (now < cartFetchState.cooldownUntil && cachedCart) {
      return cachedCart;
    }

    // Reuse very recent cart snapshots to collapse near-simultaneous callers.
    if (cachedCart) {
      if (forceFresh && cachedAge <= DCB_CART_FRESH_REUSE_MS) {
        return cachedCart;
      }
      if (!forceFresh && cachedAge <= DCB_CART_STALE_REUSE_MS) {
        return cachedCart;
      }
    }

    const getCartPromise = (async () => {
      const authenticGlobal = window.authenticGlobal;
      if (authenticGlobal?.getCart) {
        const cart = await authenticGlobal.getCart({ forceFresh });
        this._lastCartFingerprint = buildCartFingerprint(cart);
        cartFetchState.lastCart = cart;
        cartFetchState.lastFetchedAt = Date.now();
        cartFetchState.cooldownUntil = 0;
        return cart;
      }

    const maxRetries = 2;
    let lastError = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch('/cart.js', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const cartFetchError = new Error(`Cart fetch failed: ${response.status}`);
          cartFetchError.status = response.status;
          if (response.status === 403) {
            cartFetchError.code = 'CART_FETCH_FORBIDDEN';
          } else if (response.status === 429) {
            cartFetchError.code = 'CART_FETCH_RATE_LIMITED';
          } else {
            cartFetchError.code = 'CART_FETCH_HTTP_ERROR';
          }
          throw cartFetchError;
        }

        const cart = await response.json();

        // Validate cart data structure to prevent $0 issues
        if (!cart || typeof cart.total_price === 'undefined') {
          const invalidCartError = new Error('Invalid cart data structure');
          invalidCartError.code = 'CART_FETCH_INVALID_PAYLOAD';
          throw invalidCartError;
        }

        this._lastCartFingerprint = buildCartFingerprint(cart);
        cartFetchState.lastCart = cart;
        cartFetchState.lastFetchedAt = Date.now();
        cartFetchState.cooldownUntil = 0;
        return cart;
      } catch (error) {
        lastError = error;

        if (error?.code === 'CART_FETCH_FORBIDDEN') {
          throw error;
        }

        if (error?.code === 'CART_FETCH_RATE_LIMITED') {
          cartFetchState.cooldownUntil = Date.now() + DCB_CART_RATE_LIMIT_COOLDOWN_MS;
        }

        if (attempt === maxRetries) {
          const exhaustedError = new Error('Cart fetch failed after maximum retries');
          exhaustedError.code = 'CART_FETCH_EXHAUSTED';
          exhaustedError.status = error?.status ?? null;
          exhaustedError.cause = error;
          throw exhaustedError;
        }

        // Longer backoff for rate-limited requests
        const baseMs = error?.code === 'CART_FETCH_RATE_LIMITED' ? 1000 : 100;
        await new Promise(resolve => setTimeout(resolve, baseMs * Math.pow(2, attempt)));
      }
    }

    throw lastError || new Error('Cart fetch failed');
    })();

    const pendingKey = forceFresh ? 'pendingFresh' : 'pendingStale';
    cartFetchState[pendingKey] = getCartPromise;

    try {
      return await getCartPromise;
    } finally {
      // Only clear if this completion still owns the shared pending slot.
      if (cartFetchState[pendingKey] === getCartPromise) {
        cartFetchState[pendingKey] = null;
      }
    }
  }

  isCartFetchTerminalError(error) {
    return error?.code === 'CART_FETCH_EXHAUSTED' ||
           error?.code === 'CART_FETCH_FORBIDDEN';
  }

  handleCartUnavailable(reason = 'unknown') {
    console.warn(`[DCB] Cart unavailable: ${reason}`);
    this.cartFetchUnavailable = true;
    this.setAttribute('data-cart-unavailable', String(reason));
    // Button stays visible — only the price may be stale.
    // Never hide due to transient network/rate-limit errors.
  }

  fallbackToStandardCheckout() {
    console.warn('Membership checkout unavailable, falling back to standard checkout');
    this.checkoutFallbackActivated = true;
    this.isCheckingOut = false;
    const memberBtn = this.querySelector('[data-member-checkout-btn]');
    if (memberBtn) {
      memberBtn.disabled = true;
      memberBtn.setAttribute('aria-disabled', 'true');
    }
    window.location.href = '/checkout';
  }

  hasMembershipInCart(cart) {
    if (!cart?.items || !window.authenticSubProductId) {
      return false;
    }
    const membershipId = window.authenticSubProductId.split('/').pop();
    return cart.items.some(item => item.product_id.toString() === membershipId);
  }

  isMembershipProductInCart(cart) {
    return this.hasMembershipInCart(cart);
  }

  async addMembershipToCartSafely() {
    // CRITICAL: Use the safest method to add membership without DOM interference
    if (window.authenticGlobal?.addSubscriptionProduct) {
      // Use the existing method but ensure it's the safe version
      await window.authenticGlobal.addSubscriptionProduct();
    } else if (window.authenticSubProductId) {
      // Use manual method that avoids cart section manipulation
      await this.addMembershipProductDirectly();
    } else {
      throw new Error('Cannot add membership - no method available');
    }

    authentic_trackEventAnalytics('add_membership', {
      source: 'membership_checkout_button',
      widgetType: 'membership_checkout_button',
    });
  }

  async addMembershipToCart() {
    // Wrapper method for backward compatibility
    return this.addMembershipToCartSafely();
  }

  async waitForMembership() {
    const maxAttempts = 4;
    const baseDelay = 2000;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      // Fetch cart for polling with exponential backoff (no caching)
      try {
        const cart = await this.getFreshCart({ forceFresh: true });
        if (this.hasMembershipInCart(cart)) {
          // Add small delay to ensure theme has processed the change
          await new Promise(resolve => setTimeout(resolve, 500));
          return; // Success!
        }
      } catch (error) {
        if (this.isCartFetchTerminalError(error)) {
          throw error;
        }
        console.warn(`Cart fetch attempt ${attempt} failed:`, error);
      }

      if (attempt < maxAttempts) {
        // Exponential backoff to reduce server load
        const delay = baseDelay * Math.pow(1.5, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw new Error('Membership not found in cart after adding');
  }

  async addMembershipProductDirectly() {
    try {
      const membershipProductId = window.authenticSubProductId.split('/').pop();
      const variant = await this.getDefaultVariantForProduct(membershipProductId);
      const variantId = variant.id.split('/').pop();

      const requestBody = {
        items: [
          {
            id: variantId,
            quantity: 1,
          },
        ],
      };

      const response = await fetch(window.Shopify.routes.root + 'cart/add.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to add membership product: ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();

      await new Promise(resolve => setTimeout(resolve, 250));

      return result;
    } catch (error) {
      console.error('Error adding membership product directly:', error);
      throw error;
    }
  }

  async addMembershipProductManually() {
    return this.addMembershipProductDirectly();
  }

  async getDefaultVariantForProduct(productId) {
    const query = `
      query getProductVariant($productId: ID!) {
        product(id: $productId) {
          id
          title
          variants(first: 1) {
            edges {
              node {
                id
                title
                availableForSale
                priceV2 {
                  amount
                  currencyCode
                }
              }
            }
          }
        }
      }
    `;

    const response = await fetch('/api/2023-10/graphql.json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': window.storefrontToken,
      },
      body: JSON.stringify({
        query: query,
        variables: {
          productId: `gid://shopify/Product/${productId}`,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch product: ${response.statusText}`);
    }

    const result = await response.json();

    if (result.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
    }

    const product = result.data.product;
    if (!product || !product.variants.edges.length) {
      throw new Error(`Product or variants not found`);
    }

    return product.variants.edges[0].node;
  }

  async getMemberStatus(options = {}) {
    const forceFresh = options.forceFresh === true;
    const providedCartData = options.cartData || null;

    if (!forceFresh && !providedCartData && this._memberStatusPending) {
      return this._memberStatusPending;
    }

    const memberStatusPromise = (async () => {
    try {
      const authenticGlobal = window.authenticGlobal;
      if (!authenticGlobal) return false;

      // Use unified cache system for subscription details
      const subscriptionData = await authenticGlobal.getSubscriptionDetails();

      const cart = providedCartData || await this.getFreshCart({ forceFresh });
      this._lastFetchedCart = cart;
      const cartFingerprint = buildCartFingerprint(cart);
      if (
        !forceFresh &&
        this.cachedMemberStatus !== null &&
        this._lastMemberStatusFingerprint &&
        cartFingerprint === this._lastMemberStatusFingerprint
      ) {
        return this.cachedMemberStatus;
      }

      const subDiscountApplied = cart.cart_level_discount_applications?.some(disc => disc.title === 'AUTHENTIC');
      const subProductInCart = cart.items.some(
        item => item.product_id.toString() === window.authenticSubProductId.split('/').pop()
      );
      const currentCartStatus = cart.attributes?.['authentic-member'];

      const isRecognizedMember =
        (subscriptionData !== null && subscriptionData.subscribed === true) ||
        (subscriptionData === null && subDiscountApplied) ||
        subProductInCart ||
        currentCartStatus === 'true';

      this._lastMemberStatusFingerprint = cartFingerprint;
      this.cachedMemberStatus = isRecognizedMember;
      return isRecognizedMember;
    } catch (error) {

      if (error?.code) {
        this._lastFetchedCart = null;
      }
      if (this.isCartFetchTerminalError(error)) {
        console.warn('[DCB] Terminal cart error during member-status check:', error?.code, error?.message);
        this.handleCartUnavailable('member-status');
        return false;
      }
      console.error('Error checking member status:', error);
      return false;
    }
    })();

    if (!forceFresh && !providedCartData) {
      this._memberStatusPending = memberStatusPromise;
    }

    try {
      return await memberStatusPromise;
    } finally {
      if (!forceFresh && this._memberStatusPending === memberStatusPromise) {
        this._memberStatusPending = null;
      }
    }
  }

  updateButtonPriceDisplay(price) {
    const priceContainer = this.querySelector('.price-container');
    if (!priceContainer) {
      return;
    }

    const formattedPrice = this.formatPrice(price);
    // Update price container directly - no cart DOM manipulation
    priceContainer.innerHTML = `<span class="price-text">${formattedPrice}</span>`;
  }

  showPriceShimmer() {
    const priceContainer = this.querySelector('.price-container');
    if (!priceContainer) {
      return;
    }

    // Show shimmer only in the price container
    priceContainer.innerHTML = `<span class="price-loading"></span>`;
  }

  async updateButtonPrice(cartData = null, forceFresh = false) {
    if (this.cartFetchUnavailable) {
      return;
    }

    // Prevent concurrent price updates that could interfere with cart totals
    if (this._updatingPrice) {
      return;
    }

    const buttonTextElement = this.querySelector('.button-text');
    if (!buttonTextElement) {
      return;
    }

    try {
      this._updatingPrice = true;

      // Start calculation immediately, only show shimmer if it takes too long
      let shimmerTimeout;

      // Show shimmer only if calculation takes longer than 300ms
      shimmerTimeout = setTimeout(() => {
        this.showPriceShimmer();
      }, 300);

      // Calculate member price based on eligible items only
      const memberPrice = await this.calculateMemberPrice(cartData, forceFresh);

      // Clear shimmer timeout since we have the result
      clearTimeout(shimmerTimeout);

      // Update with calculated price
      this.updateButtonPriceDisplay(memberPrice);
    } catch (error) {
      if (this.isCartFetchTerminalError(error)) {
        this.handleCartUnavailable('price-calculation');
        return;
      }
      console.error('Error updating button price:', error);
      // Show error state briefly, then fallback price
      const priceContainer = this.querySelector('.price-container');
      if (priceContainer) {
        priceContainer.innerHTML = `<span class="price-error">Error</span>`;
        setTimeout(() => {
          try {
            this.updateButtonPriceDisplay(0);
          } catch (fallbackError) {
            console.error('Error with fallback price:', fallbackError);
            this.updateButtonPriceDisplay(0);
          }
        }, 1000);
      }
    } finally {
      this._updatingPrice = false;
    }
  }

  debouncedUpdateButtonPrice(cartData = null, forceFresh = false) {
    // Clear any existing price update timeouts to avoid multiple rapid updates
    this.priceUpdateTimeouts.forEach(timeoutId => {
      clearTimeout(timeoutId);
    });
    this.priceUpdateTimeouts.clear();

    const timeoutId = setTimeout(() => {
      this.updateButtonPrice(cartData, forceFresh);
      this.priceUpdateTimeouts.delete(timeoutId);
    }, 50); // Minimal delay to avoid flashing while preventing conflicts

    // Track this timeout for cleanup
    this.priceUpdateTimeouts.add(timeoutId);
  }

  async getAuthenticDiscount() {
    try {
      // Check if discount percentage is available in window
      if (window.authenticDiscountPercentage) {
        return window.authenticDiscountPercentage;
      }

      return this.config.memberDiscountPercentage;
    } catch (error) {
      console.error('Error fetching AUTHENTIC discount:', error);
      return this.config.memberDiscountPercentage;
    }
  }

  /**
   * Calculate the member price preview without mutating the cart.
   * @param {object|null} cartData - Optional cart object to read from (will be deep-cloned)
   * @param {boolean} forceFresh - Reserved for future use
   * @returns {Promise<number>} Member price in cents
   */
  async calculateMemberPrice(cartData = null, forceFresh = false) {
    // Don't calculate if component isn't properly initialized
    if (!this.isInitialized || !this.shouldShow || this.cartFetchUnavailable) {
      return 0;
    }

    // Always work on a deep-cloned snapshot to avoid mutating the real cart object
    const sourceCart = cartData || await this.getFreshCart({ forceFresh });
    const cart = JSON.parse(JSON.stringify(sourceCart));

    // Use fresh cart data directly instead of global variables
    const membershipProductId = window.authenticSubProductId ? window.authenticSubProductId.split('/').pop() : null;
    const membershipProductInCart =
      membershipProductId && cart.items.some(item => item.product_id.toString() === membershipProductId);

    if (membershipProductInCart) {
      // Calculate total excluding membership from fresh cart data
      let totalExcludingMembership = cart.total_price;
      cart.items.forEach(item => {
        if (item.product_id.toString() === membershipProductId) {
          totalExcludingMembership -= item.line_price;
        }
      });
      return Math.max(0, totalExcludingMembership);
    }

    // Get cart items excluding membership product from fresh cart data
    const cartItems = cart.items.filter(
      item => !membershipProductId || item.product_id.toString() !== membershipProductId
    );

    if (!cartItems.length) {
      return 0;
    }

    try {
      // Use unified cache system for eligibility requests if available
      let eligibilityResults;

      // Fallback to direct API calls
      if (!window._membershipCheckoutEligibilityInFlight) {
        window._membershipCheckoutEligibilityInFlight = new Map();
      }

      const fetchPromises = cartItems.map(item => {
        const cacheKey = `${ELIGIBILITY_CACHE_PREFIX}${item.product_id}_${item.price}`;
        const cached = readEligibilityCache(cacheKey);
        if (cached) return Promise.resolve(cached);

        const inFlight = window._membershipCheckoutEligibilityInFlight.get(cacheKey);
        if (inFlight) return inFlight;

        const requestPromise = fetch(
          `/apps/authentic/public/products/${item.product_id}/member-price?price=${item.price}`
        )
          .then(response => response.json())
          .then(data => {
            writeEligibilityCache(cacheKey, data);
            return data;
          })
          .catch(error => {
            console.error(`Error checking eligibility for product ${item.product_id}:`, error);
            return { eligible: false }; // Default to not eligible if API fails
          })
          .finally(() => {
            window._membershipCheckoutEligibilityInFlight.delete(cacheKey);
          });

        window._membershipCheckoutEligibilityInFlight.set(cacheKey, requestPromise);
        return requestPromise;
      });

      eligibilityResults = await Promise.all(fetchPromises);

      const authenticDiscountPercentage = await this.getAuthenticDiscount();

      let totalPrice = 0;

      cartItems.forEach((item, index) => {
        const eligibilityResult = eligibilityResults[index];

        if (eligibilityResult.eligible) {
          const discountAmount = Math.round(item.line_price * (authenticDiscountPercentage / 100));
          totalPrice += item.line_price - discountAmount;
        } else {
          totalPrice += item.line_price;
        }
      });

      return Math.max(0, totalPrice);
    } catch (error) {
      console.error('Error calculating member price:', error);
      return 0;
    }
  }

  async removeMembershipFromCart() {
    if (!window.authenticSubProductId) {
      return;
    }

    const membershipProductId = window.authenticSubProductId.split('/').pop();

    try {
      const cart = await this.getFreshCart({ forceFresh: true });

      // Find the cart item with the membership product
      const membershipItem = cart.items.find(item => item.product_id.toString() === membershipProductId);
      if (!membershipItem) {
        console.log('No membership product found in cart to remove');
        return;
      }

      console.log('Removing membership product from cart:', membershipItem.key);

      // Direct cart/change.js call without section manipulation to prevent cart total issues
      const response = await fetch('/cart/change.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest', // Indicate this is an AJAX request
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({
          id: membershipItem.key,
          quantity: 0,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to remove membership product: ${response.status} - ${errorText}`);
      }

      const result = await response.json();

      // Validate the result to ensure removal worked
      if (result && typeof result.total_price !== 'undefined') {

        await new Promise(resolve => setTimeout(resolve, 300));

        return result;
      } else {
        throw new Error('Invalid response from cart/change.js');
      }
    } catch (error) {
      console.error('Error removing membership product:', error);
      throw error;
    }
  }

  async setLoadingState(loading) {
    this.isLoading = loading;
    const button = this.querySelector('[data-member-checkout-btn]');
    if (!button) return;

    const shouldDisableButton = loading || this.checkoutFallbackActivated;
    button.disabled = shouldDisableButton;
    if (loading) {
      setTimeout(() => button.classList.add('loading'), 10);
      // Show loading state in price as well
      if (!this.isCheckingOut) {
        this.showPriceShimmer();
      }
    } else {
      button.classList.remove('loading');
      if (!this.isCheckingOut && !this.checkoutFallbackActivated) {
        // Update with fresh price calculation
        setTimeout(() => {
          this.updateButtonPrice(null, true);
        }, 100);
      }
    }
  }

  showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'membership-checkout-error';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);

    setTimeout(() => {
      if (document.body.contains(errorDiv)) {
        document.body.removeChild(errorDiv);
      }
    }, 5000);
  }
}

customElements.define('member-checkout-button', MemberCheckoutButton);

window.membershipCheckoutGlobal = membershipCheckoutGlobal;
window.MemberCheckoutButton = MemberCheckoutButton;
