// Dual Checkout Analytics JavaScript v2.0
// This file should be included in the theme's cart page after membership-checkout.js

const DUAL_CHECKOUT_AB_TEST = {
  viewTracked: false,
  listenersSetup: false,
  // Click de-duplication
  clickThrottleMs: 800,
  _lastRegularClickTs: 0,
  _lastDualClickTs: 0,

  init: function () {
    this.waitForAuthenticAnalytics().then(() => {
      this.initializeDualCheckout();
    });
  },

  waitForAuthenticAnalytics: function () {
    return new Promise(resolve => {
      if (window._authentic_trackEvent) {
        resolve();
      } else {
        const checkInterval = setInterval(() => {
          if (window._authentic_trackEvent) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
      }
    });
  },

  initializeDualCheckout: function () {
    console.log('[DualCheckout] Initializing - always enabled');

    // Always show the dual checkout button
    this.showDualCheckoutButton();

    // Track visibility when button becomes visible
    this.checkAndTrackVisibility();

    // Setup event listeners
    if (!this.listenersSetup) {
      this.setupEventListeners();
      this.listenersSetup = true;
    }
  },

  showDualCheckoutButton: function () {
    const cartForm = document.querySelector('form.cart');
    if (cartForm) {
      cartForm.classList.add('dual-checkout-active');
    }

    // Try to find and show the button with retry logic
    this.findAndShowButton();

    // Re-run visibility tracking shortly after attempting to show the button
    setTimeout(() => {
      this.checkAndTrackVisibility();
    }, 100);
  },

  findAndShowButton: function (attempt = 0) {
    const memberButtons = document.querySelectorAll('member-checkout-button');

    if (memberButtons.length > 0) {
      memberButtons.forEach(button => {
        this.removeMemberButtonHideClass(button);
      });
      // Ensure visibility observer is attached once button(s) are present
      this.checkAndTrackVisibility();
      return; // Success - stop retrying
    }

    // No buttons found - retry with exponential backoff
    if (attempt < 8) {
      // Max 8 attempts (about 12 seconds total)
      const delay = Math.min(100 * Math.pow(1.5, attempt), 2000); // 100ms to 2s max

      setTimeout(() => {
        this.findAndShowButton(attempt + 1);
      }, delay);
    } else {
      console.warn('Could not find member-checkout-button elements after maximum attempts');
    }
  },

  removeMemberButtonHideClass: function (memberButton) {
    memberButton.classList.remove('hide');

    // Also explicitly set visibility to visible to override any CSS rules
    memberButton.style.visibility = 'visible';
    memberButton.style.display = 'block';

    // Set up observer to watch if something adds the hide class back
    this.watchForHideClassReaddition(memberButton);

    // Re-check visibility when the button is explicitly shown
    this.checkAndTrackVisibility();
  },

  watchForHideClassReaddition: function (memberButton) {
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          if (memberButton.classList.contains('hide')) {
            // Force remove it again
            memberButton.classList.remove('hide');
            memberButton.style.visibility = 'visible';
            memberButton.style.display = 'block';
          }
        }
      });
    });

    observer.observe(memberButton, {
      attributes: true,
      attributeFilter: ['class'],
      attributeOldValue: true,
    });

    // Stop observing after 10 seconds
    setTimeout(() => {
      observer.disconnect();
    }, 10000);
  },

  hideDualCheckoutButton: function () {
    const cartForm = document.querySelector('form.cart');
    if (cartForm) {
      cartForm.classList.remove('dual-checkout-active');
    }

    const memberButton = document.querySelector('member-checkout-button');

    if (memberButton) {
      memberButton.classList.add('hide');
    }
  },

  findCheckoutButton: function () {
    // Use the same comprehensive selector list as membership-checkout.js
    const selectors = [
      '#checkout-button',
      '[name="checkout"]',
      '.checkout-button',
      '.btn--checkout',
      'button[type="submit"]',
      'input[type="submit"]',
      '.checkout__button'
    ];

    for (const selector of selectors) {
      const button = document.querySelector(selector);
      if (button) {
        // Additional validation to ensure it's actually a checkout button
        // Check if it's within a cart form or has checkout-related text/attributes
        const isInCartForm = button.closest('form.cart, form[action*="cart"], form[action="/cart"]');
        const hasCheckoutText = button.textContent?.toLowerCase().includes('checkout') ||
                               button.value?.toLowerCase().includes('checkout') ||
                               button.getAttribute('name') === 'checkout';

        if (isInCartForm || hasCheckoutText) {
          return button;
        }
      }
    }

    return null;
  },

  elementIsVisible: function (el) {
    if (!el) return false;
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity) === 0) {
      return false;
    }
    const rect = el.getBoundingClientRect();
    const viewportH = window.innerHeight || document.documentElement.clientHeight;
    const viewportW = window.innerWidth || document.documentElement.clientWidth;
    return (
      rect.width > 0 &&
      rect.height > 0 &&
      rect.bottom > 0 &&
      rect.right > 0 &&
      rect.top < viewportH &&
      rect.left < viewportW
    );
  },

  checkAndTrackVisibility: function () {
    if (this.viewTracked) return;

    // Observe both the regular checkout button and the member button
    const regularButton = this.findCheckoutButton();
    const memberButtons = Array.from(document.querySelectorAll('member-checkout-button'));

    const observer = new IntersectionObserver(
      entries => {
        if (this.viewTracked) {
          observer.disconnect();
          return;
        }
        for (const entry of entries) {
          if (entry.isIntersecting) {
            this.trackDualCheckoutView();
            observer.disconnect();
            break;
          }
        }
      },
      {
        threshold: 0.1,
      }
    );

    let observedAny = false;
    if (regularButton) {
      observer.observe(regularButton);
      observedAny = true;
    }
    if (memberButtons.length > 0) {
      memberButtons.forEach(btn => observer.observe(btn));
      observedAny = true;
    }

    if (!observedAny) {
      // If nothing to observe, defer a bit and try again once DOM settles
      setTimeout(() => {
        if (!this.viewTracked) this.checkAndTrackVisibility();
      }, 250);
    }

    // Fallback: if observer misses (e.g., already in view), check visibility soon
    setTimeout(() => {
      if (this.viewTracked) return;
      const targetBtn = this.findCheckoutButton();
      const memberBtn = document.querySelector('member-checkout-button');
      if (this.elementIsVisible(targetBtn) || this.elementIsVisible(memberBtn)) {
        this.trackDualCheckoutView();
      }
    }, 1500);
  },

  trackDualCheckoutView: function () {
    if (this.viewTracked) {
      console.log('Dual checkout view already tracked');
      return; // Only track once
    }

    if (window._authentic_trackEvent) {
      const eventData = {
        dual_checkout_button_shown: true,
        widgetVersion: 'dual-checkout-v2',
      };

      console.log('Tracking dual checkout button view:', eventData);
      window._authentic_trackEvent('view_dual_checkout_button', eventData);
      this.viewTracked = true;
    } else {
      console.warn('_authentic_trackEvent not available');
    }
  },

  setupEventListeners: function () {
    // Track regular checkout button clicks using comprehensive selectors
    document.addEventListener('click', e => {
      if (this.isCheckoutButton(e.target)) {
        this.trackRegularCheckoutClick();
      }
    });
  },

  isCheckoutButton: function (element) {
    // Use the same comprehensive selector list for consistency
    const selectors = [
      '#checkout-button',
      '[name="checkout"]',
      '.checkout-button',
      '.btn--checkout',
      'button[type="submit"]',
      'input[type="submit"]',
      '.checkout__button'
    ];

    for (const selector of selectors) {
      if (element.matches(selector)) {
        // Additional validation to ensure it's actually a checkout button
        const isInCartForm = element.closest('form.cart, form[action*="cart"], form[action="/cart"]');
        const hasCheckoutText = element.textContent?.toLowerCase().includes('checkout') ||
                               element.value?.toLowerCase().includes('checkout') ||
                               element.getAttribute('name') === 'checkout';

        if (isInCartForm || hasCheckoutText) {
          return true;
        }
      }
    }

    return false;
  },

  trackRegularCheckoutClick: function () {
    const now = Date.now();
    if (now - this._lastRegularClickTs < this.clickThrottleMs) {
      return;
    }
    this._lastRegularClickTs = now;
    if (window._authentic_trackEvent) {
      const payload = { widgetVersion: 'dual-checkout-v2' };
      console.log('[DualCheckout] click_regular_checkout_button', payload);
      window._authentic_trackEvent('click_regular_checkout_button', payload);
    }
  },

  trackDualCheckoutClick: function () {
    const now = Date.now();
    if (now - this._lastDualClickTs < this.clickThrottleMs) {
      return;
    }
    this._lastDualClickTs = now;
    if (window._authentic_trackEvent) {
      const payload = { widgetVersion: 'dual-checkout-v2' };
      console.log('[DualCheckout] click_dual_checkout_button', payload);
      window._authentic_trackEvent('click_dual_checkout_button', payload);
    }
  },
};

// Make it globally available
window.DUAL_CHECKOUT_AB_TEST = DUAL_CHECKOUT_AB_TEST;

// Initialize when DOM is ready
try {
  const shopifyCountry = window && window.Shopify && window.Shopify.country;
  if (shopifyCountry !== 'US') {
    // Do not initialize dual checkout in Canada
    console.log('[DualCheckout] Skipping initialization - country is not US');
  } else {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => DUAL_CHECKOUT_AB_TEST.init());
    } else {
      DUAL_CHECKOUT_AB_TEST.init();
    }
  }
} catch (_) {
  // If Shopify object is unavailable, fall back to normal init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => DUAL_CHECKOUT_AB_TEST.init());
  } else {
    DUAL_CHECKOUT_AB_TEST.init();
  }
}
