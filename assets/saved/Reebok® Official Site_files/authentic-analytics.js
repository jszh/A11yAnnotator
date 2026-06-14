(function () {
const _authentic_LOGS_ENABLED = false;

const _authentic_analyticsEnabled = true;

function main() {
  analyticsLogger.log('Script is loaded!');

  if (_authentic_analyticsEnabled) {
    setTimeout(() => {
      _authentic_ensureAuthenticId().then(() => {
        window._authentic_analytics = true;
        _authentic_trackEvent('landed_on_page');
      });
    }, 0);
  }
}

// Call the main function with timeout to ensure that the script is loaded after the page is loaded
setTimeout(main, 0);

const analyticsLogger = {
  log: (...data) => {
    if (_authentic_analyticsEnabled && _authentic_LOGS_ENABLED) {
      console.log('[Authentic Analytics]', ...data);
    }
  },
  event: (...data) => {
    if (_authentic_analyticsEnabled && _authentic_LOGS_ENABLED) {
      console.log('[Authentic Analytics]', '[EVENT]', ...data);
    }
  },
  error: (...data) => {
    if (_authentic_analyticsEnabled && _authentic_LOGS_ENABLED) {
      console.error('[Authentic Analytics]', ...data);
    }
  },
};

async function _authentic_setCartAttribute(key, value) {
  if (!window.authenticGlobal?.upsertCartAttribute) {
    analyticsLogger.log('Skipping cart attribute sync: authenticGlobal unavailable');
    return null;
  }

  try {
    return await window.authenticGlobal.upsertCartAttribute(key, value, {
      notifyCartMutation: false,
    });
  } catch (error) {
    analyticsLogger.error('Failed to sync cart attribute', error);
    return null;
  }
}

async function _authentic_getSharedCart() {
  if (!window.authenticGlobal?.getCart) {
    return null;
  }

  try {
    const syncCart = window.authenticGlobal.getCartSync?.();
    if (syncCart) {
      return syncCart;
    }

    return await window.authenticGlobal.getCart();
  } catch (error) {
    analyticsLogger.error('Failed to load shared cart', error);
    return null;
  }
}

async function _authentic_ensureAuthenticId() {
  if (!window.Shopify) {
    analyticsLogger.error('Shopify object is not defined');
    return null;
  }

  const localAuthenticId = localStorage.getItem('_authentic_id');
  const cart = await _authentic_getSharedCart();
  const cartAuthenticId = cart?.attributes?._authentic_id || null;

  if (localAuthenticId && cartAuthenticId && localAuthenticId === cartAuthenticId) {
    analyticsLogger.log('Authentic id found:', localAuthenticId);
    return localAuthenticId;
  }
  analyticsLogger.log('Authentic id mismatch', {
    cartAuthenticId,
    localAuthenticId,
  });

  const authenticId = cartAuthenticId || localAuthenticId || _authentic_generateAuthenticId();
  analyticsLogger.log('Setting new authentic id:', authenticId);

  localStorage.setItem('_authentic_id', authenticId);

  if (cartAuthenticId !== authenticId) {
    await _authentic_setCartAttribute('_authentic_id', authenticId);
  }

  return authenticId;
}

function _authentic_generateAuthenticId() {
  return (
    'authentic_' +
    Date.now().toString(36) +
    Math.random().toString(36).substring(2) +
    Math.random().toString(36).substring(2) +
    Math.random().toString(36).substring(2)
  );
}

// ====== Analytics events handlers ======

const EventTypes = {
  View: 'view',
  Click: 'click',
};

const ActionTypes = {
  PageView: 'pageview',
  TryForFree: 'try_for_free',
  LogIn: 'log_in',
  AddMembership: 'add_membership',
  RemoveMembership: 'remove_membership',
  AlreadyAMember: 'already_a_member',
  CloseModal: 'close_modal',
  TermsAndConditions: 'terms_and_conditions',
  PrivacyPolicy: 'privacy_policy',
  PlaceOrder: 'place_order',
  ViewMembershipPrice: 'view_membership_price',
  BrandLogoClick: (brandName) =>
    `brand_${brandName}_click`
      .replace(/ /g, '_')
      .replace(/[^a-zA-Z0-9_]/g, '')
      .toLowerCase(),
};

const WidgetTypes = {
  PdpWidget: 'pdp_widget',
  CartWidget: 'cart_widget',
  PdpModal: 'pdp_modal',
  CartModal: 'cart_modal',
  PdpSavingsWidget: 'pdp_savings_widget',
  CartSavingsWidget: 'cart_savings_widget',
  CheckoutWidgetGuest: 'checkout_widget_guest',
  CheckoutWidgetShop: 'checkout_widget_shop',
};

window._authentic_getEventProperties = async () => {
  const cart = await _authentic_getSharedCart();

  let authenticId = cart?.attributes?._authentic_id || null;
  if (!authenticId) {
    authenticId = await _authentic_ensureAuthenticId();
  }

  let device = null;
  let browser = null;
  let os = null;
  if (typeof window.UAParser !== 'undefined') {
    const parser = new window.UAParser(window.navigator.userAgent);
    const result = parser.getResult();
    device = result.device?.model ?? null;
    browser = result.browser?.name ?? null;
    os = result.os?.name ?? null;
  }

  return {
    shop: window.Shopify.shop,
    brand_name: window.shopName,
    page_url: window.location.href,
    referrer_url: document.referrer,
    authentic_id: authenticId,
    cart_token: cart?.token || null,
    checkout_token: null,
    user_agent: window.navigator.userAgent,
    event_timestamp: new Date().toISOString(),
    cart_at_time_of_event: cart || null,
    purchase_conversion_event: false,
    event_type: null,
    action: null,
    widget_type: null,
    widget_version: null,
    first_trial_conversion_method: null,
    conversion_details: null,
    ab_test_data: null,
    device,
    browser,
    os,
  };
};

/**
 * Track an event
 * @param {string} event
 * @param  {...any} data
 */
window._authentic_trackEvent = async (event, data) => {
  try {
    if (!window.Shopify) return analyticsLogger.error('Shopify object is not defined');
    if (!_authentic_analyticsEnabled)
      return analyticsLogger.log('Shop not allowed for tracking authentic analytics:', shop);

    if (!event) throw new Error('Event type is a required parameter');
    if (event in _authentic_trackEventHandlers) {
      _authentic_trackEventHandlers[event](data);
    } else {
      throw new Error(`Event handler not found for event: ${event}`);
    }
  } catch (error) {
    analyticsLogger.error('Error tracking event', event, error);
  }
};

window._authentic_createAnalyticsEvent = async (event) => {
  // if event doesn't have authentic_id, skip sending the event
  if (!event.authentic_id) {
    analyticsLogger.error('Authentic id not found in event while creating event', event);
    return;
  }

  const res = await fetch('/apps/authentic/public/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event),
  });

  return res.json();
};

const _authentic_trackEventHandlers = {
  landed_on_page: async () => {
    analyticsLogger.event('Landed on page');

    const eventProperties = await window._authentic_getEventProperties();
    eventProperties.action = ActionTypes.PageView;

    analyticsLogger.log('Landed on page', eventProperties);
    await window._authentic_createAnalyticsEvent(eventProperties);
  },
  view_widget: async ({ placement, widgetVersion } = {}) => {
    analyticsLogger.event('Viewed widget');

    const eventProperties = await window._authentic_getEventProperties();

    eventProperties.event_type = EventTypes.View;
    eventProperties.widget_type =
      placement === 'pdp' ? WidgetTypes.PdpWidget : WidgetTypes.CartWidget;
    eventProperties.widget_version = widgetVersion || 'v1';

    analyticsLogger.log('Viewed widget', eventProperties);
    await window._authentic_createAnalyticsEvent(eventProperties);
  },
  view_membership_price: async ({ widgetVersion, shown = true } = {}) => {
    analyticsLogger.event('Viewed membership price', shown ? 'shown' : 'hidden');

    const eventProperties = await window._authentic_getEventProperties();

    eventProperties.event_type = EventTypes.View;
    eventProperties.action = ActionTypes.ViewMembershipPrice;
    eventProperties.widget_version = widgetVersion || 'v1';
    eventProperties.ab_test_data = { membership_price_shown: shown };

    analyticsLogger.log('Viewed membership price', eventProperties);
    await window._authentic_createAnalyticsEvent(eventProperties);
  },
  view_modal: async ({ placement, widgetVersion } = {}) => {
    analyticsLogger.event('Viewed modal');

    const eventProperties = await window._authentic_getEventProperties();

    eventProperties.event_type = EventTypes.View;
    eventProperties.widget_type =
      placement === 'pdp' ? WidgetTypes.PdpModal : WidgetTypes.CartModal;
    eventProperties.widget_version = widgetVersion || 'v1';

    analyticsLogger.log('Viewed modal', eventProperties);
    await window._authentic_createAnalyticsEvent(eventProperties);
  },
  click_try_for_free: async ({ placement, widgetVersion } = {}) => {
    analyticsLogger.event('Clicked try for free');

    const eventProperties = await window._authentic_getEventProperties();

    eventProperties.event_type = EventTypes.Click;
    eventProperties.action = ActionTypes.TryForFree;
    eventProperties.widget_type =
      placement === 'pdp' ? WidgetTypes.PdpWidget : WidgetTypes.CartWidget;
    eventProperties.widget_version = widgetVersion || 'v1';

    analyticsLogger.log('Clicked try for free', eventProperties);
    await window._authentic_createAnalyticsEvent(eventProperties);
  },
  click_log_in: async ({ placement, widgetVersion } = {}) => {
    analyticsLogger.event('Clicked log in');

    const eventProperties = await window._authentic_getEventProperties();

    eventProperties.event_type = EventTypes.Click;
    eventProperties.action = ActionTypes.LogIn;
    eventProperties.widget_type =
      placement === 'pdp' ? WidgetTypes.PdpWidget : WidgetTypes.CartWidget;
    eventProperties.widget_version = widgetVersion || 'v1';

    analyticsLogger.log('Clicked log in', eventProperties);
    await window._authentic_createAnalyticsEvent(eventProperties);
  },
  click_already_a_member: async ({ placement, widgetVersion } = {}) => {
    analyticsLogger.event('Clicked already a member');

    const eventProperties = await window._authentic_getEventProperties();

    eventProperties.event_type = EventTypes.Click;
    eventProperties.action = ActionTypes.AlreadyAMember;
    eventProperties.widget_type =
      placement === 'pdp' ? WidgetTypes.PdpModal : WidgetTypes.CartModal;
    eventProperties.widget_version = widgetVersion || 'v1';

    analyticsLogger.log('Clicked already a member', eventProperties);
    await window._authentic_createAnalyticsEvent(eventProperties);
  },
  close_modal: async ({ placement, widgetVersion } = {}) => {
    analyticsLogger.event('Closed modal');

    const eventProperties = await window._authentic_getEventProperties();

    eventProperties.event_type = EventTypes.Click;
    eventProperties.action = ActionTypes.CloseModal;
    eventProperties.widget_type =
      placement === 'pdp' ? WidgetTypes.PdpModal : WidgetTypes.CartModal;
    eventProperties.widget_version = widgetVersion || 'v1';

    analyticsLogger.log('Closed modal', eventProperties);
    await window._authentic_createAnalyticsEvent(eventProperties);
  },
  add_membership: async ({ placement, widgetVersion, source, widgetType } = {}) => {
    analyticsLogger.event('Added membership to cart');

    const eventProperties = await window._authentic_getEventProperties();

    eventProperties.event_type = EventTypes.Click;
    eventProperties.action = ActionTypes.AddMembership;
    eventProperties.widget_type =
      widgetType || (placement === 'pdp' ? WidgetTypes.PdpModal : WidgetTypes.CartModal);
    eventProperties.widget_version = widgetVersion || 'v1';

    eventProperties.ab_test_data = { source };

    analyticsLogger.log('Added membership to cart', eventProperties);
    await window._authentic_createAnalyticsEvent(eventProperties);
  },
  brand_logo_click: async ({ brandName, placement, widgetVersion } = {}) => {
    analyticsLogger.event('Clicked on brand logo', brandName);

    const eventProperties = await window._authentic_getEventProperties();

    eventProperties.event_type = EventTypes.Click;
    eventProperties.action = ActionTypes.BrandLogoClick(brandName);
    eventProperties.widget_type =
      placement === 'pdp' ? WidgetTypes.PdpModal : WidgetTypes.CartModal;
    eventProperties.widget_version = widgetVersion || 'v1';

    analyticsLogger.log('Clicked on brand logo', brandName, eventProperties);
    await window._authentic_createAnalyticsEvent(eventProperties);
  },
  view_savings_widget: async ({ placement, widgetVersion } = {}) => {
    analyticsLogger.event('Viewed savings widget');

    const eventProperties = await window._authentic_getEventProperties();

    eventProperties.event_type = EventTypes.View;
    eventProperties.widget_type =
      placement === 'pdp' ? WidgetTypes.PdpSavingsWidget : WidgetTypes.CartSavingsWidget;
    eventProperties.widget_version = widgetVersion || 'v1';

    analyticsLogger.log('Viewed savings widget', eventProperties);
    await window._authentic_createAnalyticsEvent(eventProperties);
  },
  // Dual Checkout AB Testing Events
  view_dual_checkout_button: async ({
    variant,
    dual_checkout_button_shown,
    widgetVersion,
  } = {}) => {
    analyticsLogger.event('Viewed dual checkout button', variant);

    const eventProperties = await window._authentic_getEventProperties();

    eventProperties.event_type = EventTypes.View;
    eventProperties.action = 'view_dual_checkout_button';
    eventProperties.widget_type = WidgetTypes.CartWidget;
    eventProperties.widget_version = widgetVersion || 'v1';
    eventProperties.ab_test_data = {
      dual_checkout_variant: variant,
      dual_checkout_button_shown: dual_checkout_button_shown || false,
    };

    analyticsLogger.log('Viewed dual checkout button', eventProperties);
    await window._authentic_createAnalyticsEvent(eventProperties);
  },
  click_dual_checkout_button: async ({ variant, widgetVersion } = {}) => {
    analyticsLogger.event('Clicked dual checkout button', variant);

    const eventProperties = await window._authentic_getEventProperties();

    eventProperties.event_type = EventTypes.Click;
    eventProperties.action = 'click_dual_checkout_button';
    eventProperties.widget_type = WidgetTypes.CartWidget;
    eventProperties.widget_version = widgetVersion || 'v1';
    eventProperties.ab_test_data = {
      dual_checkout_variant: variant,
      dual_checkout_button_clicked: true,
    };

    analyticsLogger.log('Clicked dual checkout button', eventProperties);
    await window._authentic_createAnalyticsEvent(eventProperties);
  },
  click_regular_checkout_button: async ({ variant, widgetVersion } = {}) => {
    analyticsLogger.event('Clicked regular checkout button', variant);

    const eventProperties = await window._authentic_getEventProperties();

    eventProperties.event_type = EventTypes.Click;
    eventProperties.action = 'click_regular_checkout_button';
    eventProperties.widget_type = WidgetTypes.CartWidget;
    eventProperties.widget_version = widgetVersion || 'v1';
    eventProperties.ab_test_data = {
      dual_checkout_variant: variant,
      regular_checkout_button_clicked: true,
    };

    analyticsLogger.log('Clicked regular checkout button', eventProperties);
    await window._authentic_createAnalyticsEvent(eventProperties);
  },
  dual_checkout_conversion: async ({ variant, widgetVersion, membershipAdded } = {}) => {
    analyticsLogger.event('Dual checkout conversion', { variant, membershipAdded });

    const eventProperties = await window._authentic_getEventProperties();

    eventProperties.event_type = EventTypes.Click;
    eventProperties.action = 'dual_checkout_conversion';
    eventProperties.widget_type = WidgetTypes.CartWidget;
    eventProperties.widget_version = widgetVersion || 'v1';
    eventProperties.purchase_conversion_event = true;
    eventProperties.ab_test_data = {
      dual_checkout_variant: variant,
      membership_added_to_cart: membershipAdded,
    };

    analyticsLogger.log('Dual checkout conversion', eventProperties);
    await window._authentic_createAnalyticsEvent(eventProperties);
  },
  dual_checkout_ab_test_assignment: async ({ variant, widgetVersion } = {}) => {
    analyticsLogger.event('Dual checkout A/B test assignment', variant);

    const eventProperties = await window._authentic_getEventProperties();

    eventProperties.event_type = EventTypes.View;
    eventProperties.action = 'dual_checkout_ab_test_assignment';
    eventProperties.widget_version = widgetVersion || 'v1';
    eventProperties.ab_test_data = {
      dual_checkout_variant: variant,
      ab_test_group_assigned: true,
    };

    analyticsLogger.log('Dual checkout A/B test assignment', eventProperties);
    await window._authentic_createAnalyticsEvent(eventProperties);
  },
};
})();
