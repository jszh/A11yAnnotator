/*jshint maxparams: 5 */

// Documentation for global site tag (gtag.js)
// https://developers.google.com/tag-platform/gtagjs
//
// Mitre Analytics uses Google Analytics under the hood
// to track client-side metrics asynchronously
//
// ===============
// Enable Tracking
// ===============
//
// Inserts Google Analytics code. Can also be used to do common setup
// boilerplate. It has sensitive defaults.
//
// Usage:
//
// .enable(options);
//
// Parameters:
//
// options                    (optional) <map>
// options.account            (optional) <string>
// options.domain             (optional) <string>
// options.speedSample        (optional) <int>    default: 25
// options.antiBounce         (optional) <bool>   default: true
// options.clickTracking      (optional) <bool>   default: true
// options.hashChangeTracking (optional) <bool>   default: true
//
// Example:
//
// Mitre.Analytics.enable({
//   account: 'UA-XXXXX-X',
//   domain: 'dividend.com',
//   speedSample: 15,
//   antiBounce: false,
//   clickTracking: false,
//   hashChangeTracking: false
// });
//
// ===============
// Account Setting
// ===============
//
// Sets the web property ID for the tracking object.
//
// Usage:
//
// .setAccount(accountID);
//
// Parameters:
//
// accountID (required) <string>
// The full web property ID (e.g. UA-65432-1) for the tracker object.
//
// Example:
//
// Mitre.Analytics.setAccount('UA-XXXXX-X');
//
// ===========
// Domain Name
// ===========
//
// Sets the domain name for the GATC cookies.
//
// Usage:
//
// .setDomainName(domain);
//
// Parameters:
//
// domain (required) <string>
// There are three modes to this method: ("auto" | "none" | [domain]).
// By default, the method is set to auto, which attempts to resolve the domain
// name based on the document.domain property in the DOM.
//
// Example:
//
// Mitre.Analytics.setDomainName("dividend.com");
//
// =================
// Speed Sample Rate
// =================
//
// Defines a new sample set size for Site Speed data collection. The
// setSiteSpeedSampleRate() method must be called prior to trackPageview() in
// order to be effective.
//
// Parameters:
//
// sampleRate (required) <int>
// Value between 0 - 100 to define the percentage of visitors to your site that
// will be measured for Site Speed purposes.
//
// Example:
//
// Mitre.Analytics.setSiteSpeedSampleRate(25);
//
// ================
// Custom Variables
// ================
//
// Sets a custom variable with the supplied name, value, and scope for the
// variable. There is a 128-byte character limit for the name and value
// combined.
//
// Usage:
//
// .setCustomVar(index, name, value, opt_scope);
//
// Parameters:
//
// index (required) <int>
// The slot used for the custom variable. Possible values are 1-5, inclusive.
//
// name (required) <string>
// The name for the custom variable.
//
// value (required) <string>
// The value for the custom variable.
//
// opt_scope (optional) <int>
// The scope used for the custom variable. Possible values are 1 for
// visitor-level, 2 for session-level, and 3 for page-level.
//
// Example:
//
// Mitre.Analytics.setCustomVar(2, 'Platform', 'Sather']);
//
// ==============
// Event Tracking
// ==============
//
// Usage:
//
// .trackEvent(category, action, opt_label, opt_value, opt_noninteraction);
//
// Parameters:
//
// category (required) <string>
// The name you supply for the group of objects you want to track.
//
// action (required) <string>
// A string that is uniquely paired with each category, and commonly used to
// define the type of user interaction for the web object.
//
// opt_label (optional) <string>
// An optional string to provide additional dimensions to the event data.
//
// opt_value (optional) <int>
// An integer that you can use to provide numerical data about the user event.
//
// opt_noninteraction (optional) <bool>
// A boolean that when set to true, indicates that the event hit will not be
// used in bounce-rate calculation.
//
// Example:
//
// $('btn').on('click', function() {
//   Mitre.Analytics.trackEvent('TLM', 'Play Video', 'iShares');
// });
//
// =================
// Pageview Tracking
// =================
//
// Usage:
//
// .trackPageview(opt_pageURL);
//
// Parameters:
//
// opt_pageURL (optional) <string>
// Optional parameter to indicate what page URL to track metrics under. When
// using this option, use a beginning slash (/) to indicate the page URL.
// If opt_pageURL is not present, then full page location will be used.
// .trackPageview(location.pathname + location.search  + location.hash);
//
// Example:
//
// $(document).on('ready', function() {
//   Mitre.Analytics.trackPageview('/home');
// });
//
// =======================
// Anti Page Bounce Events
// =======================
//
// Sends an event at 15, 30, 45 and 60 seconds to prevent users that read a
// single page to count as a bounce.
//
// Example:
//
// Mitre.Analytics.enableAntiBounce();
//
// =====================
// Click Tracking Events
// =====================
//
// Enables automatic tracking of any anchor clicking that has
// data-analytics-track-click. The data tag supports a JSON object with the 5
// parameters available for the trackEvent function.
//
// Usage:
//
// .enableClickTracking();
//
// Example:
//
//  <script>Mitre.Analytics.enableClickTracking();</script>
//
// <a href='http://example.com' data-analytics-track-click='{
//   "category": "TLM",
//   "action": "Play Video",
//   "label": "iShares",
//   "value": 10,
//   "noninteraction": true
// }'>
//
// =====================
// Impression Tracking Events
// =====================
//
// Enables automatic tracking of any element that is visible in the viewport and
// has data-analytics-track-impression. The data tag supports a JSON object with
// the 5 parameters available for the trackEvent function.
//
// Usage:
//
// .enableImpressionTracking();
//
// Example:
//
//  <script>Mitre.Analytics.enableImpressionTracking();</script>
//
// <div data-analytics-track-impression='{
//   "category": "Tools Module",
//   "action": "Viewed",
//   "label": "iShares",
//   "value": 10,
//   "noninteraction": true
// }'>
//
// =====================
// Hash Change Tracking
// =====================
//
// Enables hash change tracking on a page. Useful to generate virtual page views
// on tabbed content. Whenever a hash changed, sends a default trackPageView.
// Doesn't track empty hashes eq. href='#'
//
// Usage:
//
// .enableHashChangeTracking();
//
// =====================
// Content Groups
// =====================
//
// Groups content into custom categories.  Useful for comparing metrics
// on pageview for a collection of pages.
//
// Usage:
//
// .sendPageGroup(group_name);
//
// Example:
// Mitre.Analytics.sendPageGroup(page_pro_level);
//

;(function(window, document, undefined) {
  window.dataLayer = window.dataLayer || [];
  var Mitre = window.Mitre || {};
  var Analytics = {};
  Mitre.Analytics = Analytics;
  window.Mitre = Mitre;

  var DEFAULTS = {
    antiBounce: true,
    clickTracking: true,
    hashChangeTracking: true,
    impressionTracking: true,
    speedSample: 25
  };

  Analytics.urls = {};

  Analytics.enable = function(options) {
    options = defaults(options, DEFAULTS);
    for (var key in options) {
      if (!options.hasOwnProperty(key)) continue;
      var val = options[key];
      switch (key) {
        case 'account':
          Analytics.setAccount(val);
          break;
        case 'domain':
          Analytics.setDomainName(val);
          break;
        case 'antiBounce':
          if (val === true) Analytics.enableAntiBounce();
          break;
        case 'clickTracking':
          if (val === true) Analytics.enableClickTracking();
          break;
        case 'impressionTracking':
          if(val === true) Analytics.enableImpressionTracking();
          break;
        case 'hashChangeTracking':
          if (val === true) Analytics.enableHashChangeTracking();
          break;
      }
    }
  };

  Analytics.setAccount = function(accountID) {
    if (Analytics._enabled) return;
    var ga = document.createElement('script');
    ga.type = 'text/javascript';
    ga.async = true;
    ga.src = 'https://www.googletagmanager.com/gtag/js?id=' + accountID;
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(ga, s);

    gtag('js', new Date());

    gtag('config', accountID, {
      'send_page_view': false,
      'site_speed_sample_rate': DEFAULTS['speedSample']
    })
    Analytics._enabled = true;
  };

  Analytics.setDomainName = function(domain) {
    gtag('set', 'linker', {'domains': [domain]});
  };

  Analytics.setCustomVar = function(index, name, value, scope) {
    var cusVarHash = {};
    cusVarHash[name] = value;

    if (value !== undefined && value !== 'unknown') {
      gtag('set', 'user_properties', cusVarHash);
    }
  };

  Analytics.trackEvent = function(category, action, label, value, bounce) {
    gtag('event', action, { event_category: category, event_label: label, value: value, bounce: bounce });
  };

  Analytics.trackPageview = function(url) {
    url = url || location.href;
    if (typeof this.urls[url] == "undefined") {
      gtag('event', 'page_view', { page_location: url })
      this.urls[url] = 'visited';
    }
  };

  Analytics.enableAntiBounce = function() {
    if (Analytics._antiBounce) return;
    Analytics._antiBounce = [];
    var timers = [15];
    for (var i = 0; i < timers.length; i+=1) {
      var t = timers[i];
      Analytics._antiBounce.push(delayedEvent(t*1000, t+'_seconds', 'read'));
    }
  };

  Analytics.enableClickTracking = function() {
    if (Analytics._clickTracking) return;
    var DATA = 'data-analytics-track-click';
    var TAGS = ['A', 'BUTTON'];

    document.addEventListener('click', trackClick);
    document.addEventListener('auxclick', trackClick);

    function macro_var_exists(string) {
      found = string.match(/\[%VAR:(.*)\%]/);
      return found !== null;
    }

    function macro_var_replace(string) {
      found = string.match(/\[%VAR:(.*)\%]/);
      if(macro_var_exists(string) == false)
        return string;
      if(typeof window[found[1]] === undefined || typeof window[found[1]] === 'undefined')
        return string;
      return string.replace(found[0], window[found[1]]);
    }

    function trackClick(e) {
      var target = e.target;
      var tag = target.tagName;
      var el = target.closest('[' + DATA + ']');

      if (!el) return;

      el.setAttribute('data-analytics-track-click', el.getAttribute('data-analytics-track-click').replace("\n", ''))

      var data = JSON.parse(el.getAttribute(DATA));

      // If a label is not available, we grab the text content if the element
      // clicked is a link or button
      var label = data.label;
      if (label === undefined) {
        if (!matchTag(tag)) return;
        label = target.textContent.replace('...', '').replace('»', '').replace('›','').trim();
      }

      if(label == '[ETF_UID]') {
        label = getCookieValue('etf_uid');
      }

      Analytics.trackEvent(
          data.category,
          macro_var_replace(data.action),
          macro_var_replace(label),
          data.value,
          data.noninteraction);
    }

    function matchTag(tag) {
      for (var i = 0; i < TAGS.length; i+=1) {
        if (TAGS[i] === tag) return true;
      }
      return false;
    }

    Analytics._clickTracking = true;
  };

  Analytics.enableImpressionTracking = function() {
    if (Analytics._impressionTracking) return;
    var DATA = 'data-analytics-track-impression';
    var DELAY = 100; //milliseconds
    var next = 0;

    window.addEventListener('scroll', function() {
      var now = Date.now();

      if(now > next) {
        trackImpression();
        next = now + DELAY;
      }
    });

    document.addEventListener('DOMContentLoaded', trackImpression);

    function trackImpression() {
      var elements = document.querySelectorAll('[' + DATA + ']');

      for (var i = 0; i < elements.length; i+=1) {
        var el = elements[i];

        if (isVisible(el)) {
          var a = JSON.parse(el.getAttribute(DATA));

          Analytics.trackEvent(a.category, a.action, a.label, a.value);
          el.removeAttribute(DATA);
        }
      }
    }

    Analytics._impressionTracking = true;
  };

  Analytics.enableHashChangeTracking = function() {
    if (Analytics._hashChangeTracking) return;
    window.addEventListener('hashchange', function() {
      if (location.hash) {
        Analytics.trackPageview();
      }
    });
    Analytics._hashChangeTracking = true;
  };

  Analytics.sendPageGroup = function(group) {
    // if (Mitre.DEBUG) window.console.debug('Analytics content group', group);
    // window._gaq.push(['_setPageGroup', 1, group]); 
  };

  function gtag() {
    dataLayer.push(arguments);
  }

  function isVisible(element) {
    if (!element) return false;

    var rect = element.getBoundingClientRect();
    var doc = document.documentElement;

    return (
      rect.height >=  0 &&
      rect.width  >  0 &&
      rect.bottom >= 0 &&
      rect.right  >= 0 &&
      rect.top <= (window.innerHeight || doc.clientHeight) &&
      rect.left <= (window.innerWidth || doc.clientWidth)
    );
  }

  function track(event) {
    compact(event);
    if (Mitre.DEBUG) window.console.debug('Analytics track', event);

    if (typeof $can_enable_dfp === 'undefined'){
      setTimeout(function() {
        if(typeof $can_enable_dfp === 'undefined' || $can_enable_dfp === true) {
          window._gaq.push(event);
        }
      }, 1000);
    } else if ($can_enable_dfp === true) {
      window._gaq.push(event);
    }
  }

  function delayedEvent(timer, category, action) {
    return window.setTimeout(function () {
      Analytics.trackEvent(category, action);
    }, timer);
  }

  // Drop all array remaining elements if they are all undefined
  //
  // Example:
  // compact([1,2,3,undefined,undefined]) == [1,2,3]
  // compact([1,2,3,undefined,5]) == [1,2,3,undefined,5]
  function compact(list) {
    var j = -1;
    for (var i = 0, l = list.length; i < l; i += 1) {
      if (list[i] === undefined) {
        if (j < 0 ) j = i;
      } else {
        j = -1;
      }
    }
    if (j >= 0) list.length = j;
  }

  // Copies keys and values from source to destination if the key is undefined
  // at the destination.
  function defaults(dst, src) {
    dst = dst || {};
    for (var key in src) {
      if (!src.hasOwnProperty(key)) continue;
      var val = src[key];
      if (dst[key] === undefined) {
        dst[key] = val;
      }
    }
    return dst;
  }

  /* jshint ignore:start */
  // Remove jQuery dependency from Analytics:
  // https://plainjs.com/javascript/traversing/get-closest-element-by-selector-39/
  //
  // matches polyfill
  window.Element && function(ElementPrototype) {
    ElementPrototype.matches = ElementPrototype.matches ||
      ElementPrototype.matchesSelector ||
      ElementPrototype.webkitMatchesSelector ||
      ElementPrototype.msMatchesSelector ||
      function(selector) {
        var node = this, nodes = (node.parentNode || node.document).querySelectorAll(selector), i = -1;
        while (nodes[++i] && nodes[i] != node);
        return !!nodes[i];
      }
  }(window.Element.prototype);

  // closest polyfill
  window.Element && function(ElementPrototype) {
    ElementPrototype.closest = ElementPrototype.closest ||
      function(selector) {
        var el = this;
        while (el && el.matches && !el.matches(selector)) el = el.parentNode;
        return (el && el.matches) ? el : null;
      }
  }(window.Element.prototype);
  /* jshint ignore:end */

  // Read a cookie w/o jQuery
  function getCookieValue(a) {
    var b = document.cookie.match('(^|[^;]+)\\s*' + a + '\\s*=\\s*([^;]+)');
    return b ? b.pop() : '';
  }

}(window, document));
