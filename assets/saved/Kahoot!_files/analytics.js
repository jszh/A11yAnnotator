'use strict';
(function () {

    const sessionKey = 'sessionId';
    const SESSION_DURATION = 24 * 60 * 60 * 1000;
    const pageURL = window.location.href;
    const country = document.cookie.split('; ').find(row => row.startsWith('country_code='))?.split('=')[1] || null;


    const commonEventProps = {
        url: window.location.href,
        page_path: window.location.pathname,
        ui_language: document.documentElement.lang,
        logged_in: document.cookie.split('; ').some(cookie => cookie.startsWith('token=')) ? 'true' : 'false',
    };

    const consentMap = {
        C0001: 'necessary_cookies',
        C0002: 'performance_cookies',
        C0003: 'functional_cookies',
        C0004: 'targeting_cookies'
    };

    function generateUuid() {
        return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
            (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
        );
    }

    function getValidSession() {
        let sessionData = sessionStorage.getItem(sessionKey);
        let sessionId, sessionTimestamp;
        const now = Date.now();

        if (sessionData) {
            try {
                const parsed = JSON.parse(sessionData);
                sessionId = parsed.id;
                sessionTimestamp = parsed.ts;
            } catch {
                sessionId = null;
                sessionTimestamp = null;
            }
        }

        if (!sessionId || !sessionTimestamp || now - sessionTimestamp > SESSION_DURATION) {
            sessionId = generateUuid();
            sessionTimestamp = now;
            sessionStorage.setItem(sessionKey, JSON.stringify({ id: sessionId, ts: sessionTimestamp }));
        }

        return sessionId;
    }

    function getParameterByName(name, url) {
        if (!url) url = window.location.href;
        name = name.replace(/[\[\]]/g, "\\$&");
        let regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
            results = regex.exec(url);
        if (!results) return null;
        if (!results[2]) return '';
        return decodeURIComponent(results[2].replace(/\+/g, " "));
    }

    function buildPayload({ eventType, eventProperties = {} }) {
        let sessionId = getValidSession();
        return {
            api_key: 'cb17cf67d4d102828feb6a4e1df7aa3e',
            events: [
                {
                    user_id: sessionId,
                    device_id: sessionId,
                    event_type: eventType,
                    country: country,
                    event_properties: { ...commonEventProps, ...eventProperties },
                }
            ]
        };
    }

    async function postEvent(payload) {
        try {
            const response = await fetch('https://api2.amplitude.com/2/httpapi', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (response.status !== 200) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            if (data && data.events_ingested > 0) {
                return {
                    success: true,
                    code: data.code,
                    server_upload_time: data.server_upload_time,
                    payload_size_bytes: data.payload_size_bytes,
                    events_ingested: data.events_ingested
                };
            }
            return {
                success: false,
                code: data?.code || null,
                events_ingested: data?.events_ingested || 0,
                message: 'No events were ingested'
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                events_ingested: 0
            };
        }
    }

    function createEvent({ eventType, userId, eventProperties = {} }) {
        const payload = buildPayload({ eventType, eventProperties });
        postEvent(payload);
    }

    function getParentSelectors(e) {
        let result = [];
        for (let p = e && e.parentElement; p; p = p.parentElement) {
        let tag = p.tagName.toLowerCase();
        if (tag == 'body' || tag == 'html') { continue; }
        let selector = tag;
        p.classList.forEach(function (c) {
            selector += '.' + c
        });
        result.push(selector);
        }
        return result;
    }

    function getParentTags(e) {
        let result = [];
        for (let p = e && e.parentElement; p; p = p.parentElement) {
        let tag = p.tagName.toLowerCase();
        result.push(tag);
        }
        return result;
    }

    function getLinkContainer(e) {
        let result = null; 
        for (let p = e && e.parentElement; p; p = p.parentElement) {
        let container = p.getAttribute('data-amplitude-link-position');
        if (container) {
            result = container;
        }
        }
        return result;
    }     

    function waitForOneTrust(callback, interval = 100, maxAttempts = 50) {
        let attempts = 0;
        const timer = setInterval(() => {
            if (window.OneTrust && typeof OneTrust.OnConsentChanged === 'function') {
                clearInterval(timer);
                callback();
            } else if (++attempts >= maxAttempts) {
                clearInterval(timer);
                console.warn('OneTrust.OnConsentChanged not found after waiting.');
            }
        }, interval);
    }

    function getConsentFromCookie() {
        const cookieStr = document.cookie.split('; ').find(row => row.startsWith('OptanonConsent='));
        if (!cookieStr) return {};
        const decoded = decodeURIComponent(cookieStr.substring(cookieStr.indexOf('=') + 1));
        const groupsMatch = decoded.match(/groups=([^&;]+)/);
        if (!groupsMatch) return {};
        const groupsStr = groupsMatch[1]; // e.g. "C0001:1,C0002:1,C0003:0,C0004:1"
        const consentStatus = {};
        groupsStr.split(',').forEach(pair => {
            const [key, val] = pair.split(':');
            if (consentMap[key]) {
                consentStatus[consentMap[key]] = val === '1';
            }
        });
        return consentStatus;
    }

    const setClickEventType = (element) => (e) => {
        const clickId = element.id || '';
        let appProduct = null;
        let EventName = '[Website] Click Link';
        const clickURL = element.href || '';
        const clickParams = clickURL.split('?')[1] || '';
        let functionalSelector = element.getAttribute('data-functional-selector') || '';
        let parentSelectors = getParentSelectors(element);
        let parentTags = getParentTags(element);
        let linkPosition = getLinkContainer(element);
        let clickText = element.textContent.trim() || null;
        let eventProperties = {
            link_url: clickURL,
            link_params: clickParams,
            link_position: linkPosition,
            click_text: clickText,
        };

        if ( !clickText && element.querySelector('img') ) {
            eventProperties['click_text'] = element.querySelector('img').getAttribute('alt');
        }

        let buyTrialUpgradeBtn = false;
        if (element.tagName === 'BUTTON') { 
            EventName = '[Website] Click Button'; 
            if (element.classList.contains("save-preference-btn-handler")) {
                eventProperties['cookie_settings'] = "custom";
            }
            if (element.classList.contains("ot-pc-refuse-all-handler") || clickId == "onetrust-reject-all-handler") {
                eventProperties['cookie_settings'] = 'no_cookies';
            }
            if (clickId == "onetrust-accept-btn-handler" || clickId == "accept-recommended-btn-handler") {
                eventProperties['cookie_settings'] = 'all_cookies';
            }
        }

        if (/upgrade/.test(clickURL) || /register\/upgrade-free/.test(clickURL) || functionalSelector === 'pricing-page__free-btn') {
            EventName = '[Website] Click Buy Now';
            buyTrialUpgradeBtn = true;
            let plan_code = getParameterByName('plan', clickURL),
                plan_coupon = getParameterByName('coupon', clickURL),
                plan_cycle = /12/.test(plan_code) ? 'annually' : 'monthly',
                isTrial = (functionalSelector == 'pricing-page__trial-btn') ? true : /12t/.test(plan_code) || /t_/.test(plan_code) && !/student_/.test(plan_code) && !/start_/.test(plan_code) || /rial/.test(clickText) ? true : false,
                isBuyNow =  (functionalSelector == 'pricing-page__buy-btn') ? true : /upgrade\/confirm/.test(clickURL) ? true : false,
                isBasicFree = (functionalSelector == 'pricing-page__free-btn') ? true : /free_plan_business_web/.test(plan_code) || /register\/upgrade-free/.test(clickURL) ? true : false;

                eventProperties.plan_code = plan_code;
                eventProperties.plan_coupon = plan_coupon;
                eventProperties.plan_cycle = plan_cycle;

                if (isTrial) {
                    EventName = '[Website] Click Start Trial';
                } else if (isBuyNow) {
                    EventName = '[Website] Click Buy Now';
                } else if (isBasicFree) {
                    EventName = '[Website] Click Basic Free';
                }
            let plan_audience; // test plan codes or URL. 
                if ( /schools/.test(plan_code) || /schools/.test(pageURL) ) {
                    plan_audience = 'schools';
                } else if ( /highered/.test(plan_code) || /highered/.test(pageURL) ) {
                    plan_audience = 'highered';
                } else if ( /nonprofit/.test(plan_code) || /nonprofit/.test(pageURL) ) {
                    plan_audience = 'nonprofit';
                } else if (/social/.test(plan_code) || /family/.test(plan_code) || /personal/.test(plan_code)) {
                    plan_audience = 'social';
                } else if ( /student/.test(plan_code) || /student/.test(pageURL) ) {
                    plan_audience = 'student';
                } else if ( /360/.test(plan_code) || /business/.test(pageURL) ) {
                    plan_audience = 'business'; 
                }
            eventProperties.plan_audience = plan_audience;
        } // end transactional

        if ( linkPosition == 'hero' && !buyTrialUpgradeBtn ) { 
            EventName = '[Website] Click CTA Hero';
        }

        if (parentTags.indexOf('nav') != -1) {
            EventName = '[Website] Click Navigation';
            parentSelectors.forEach(function (selector, i) {
                if (selector.split('.')[0] == 'nav') {
                    eventProperties.link_position = parentSelectors[i].split('.')[1];
                }
            });
        }
       
        let appStore = /.apple/.test(clickURL) ? 'apple' : /play.google/.test(clickURL) ? 'google' : /appgallery.cloud.huawei.com/.test(clickURL) ? 'huawei' : false;
        if (appStore) {
            EventName = '[Website] Click Download App';
            appProduct = 'kahoot';
            if (/poio/.test(clickURL)) {
                appProduct = 'poio';
            } else if (/wewanttoknow/.test(clickURL)) {
                appProduct = 'dragonbox';
            }

            eventProperties['app_product'] = appProduct;
            eventProperties['platform_store'] = appStore;
            eventProperties['page_path'] = window.location.pathname;
        }
        
        if (/mailto:/.test(clickURL)) {
            EventName = '[Website] Click Contact Email';
        }

        if (/webinar\/register/.test(clickURL)) {
            EventName = '[Website] Click Webinar Sign Up';
        }
        
        if (element.classList.contains('collection-card-link')) {
            EventName = '[Website] Click Kahoots Collection';
            eventProperties['link_url'] = element.getAttribute('onclick').split("'")[1];
            eventProperties['modal_target'] = element.getAttribute('data-modal-target');
        }

        if (element.hasAttribute('data-modal-target')) {
            EventName = '[Website] Click Launch Modal';
            eventProperties['modal_target'] = element.getAttribute('data-modal-target');
        }
        if (/create.kahoot.it\/auth\/login/.test(clickURL) || element.getAttribute('data-tracking-id') == 'sign-in-top-bar') {
            EventName = '[Website] Click Log In';
        }

        if (/create.kahoot.it\/auth\/register/.test(clickURL)) {
            EventName = '[Website] Click Sign Up';
        }

        if (element.getAttribute('data-tracking-id') == 'play-top-bar') {
            EventName = '[Website] Click Play Top Bar';
        }
        createEvent({
            eventType: EventName,
            eventProperties
        });
    }

    window.addEventListener('error', function(event) {
        
        createEvent({
            eventType: '[Website] Javascript Error',
            eventProperties: {
                error_message: event.message,
                error_stack: event.error ? event.error.stack : '',
                error_source: event.filename,
                error_line: event.lineno,
                error_column: event.colno
            }
        });
    });

    const pageviewEvent = () => {
        createEvent({
            eventType: '[Website] Pageview',
            eventProperties: {
                consented_categories: getConsentFromCookie()
            }
        });
    };
    pageviewEvent();
    
    document.addEventListener('click', function(e) {
        let el = e.target.closest('a, button, input[type="button"], input[type="submit"]');
        if (el) {
            setClickEventType(el)(e);
        }
    });

    waitForOneTrust(() => {
        OneTrust.OnConsentChanged(function() {
           
            const consentStatus = {};
            Object.keys(consentMap).forEach(key => {
                consentStatus[consentMap[key]] = OnetrustActiveGroups.includes(`,${key},`);
            });
            createEvent({
                eventType: '[Website] Consent Change',
                eventProperties: {
                    consented_categories: consentStatus
                }
            });
        });
    });


}());