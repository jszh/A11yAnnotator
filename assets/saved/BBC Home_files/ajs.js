
var _isWinTopRestrictedFrame = (function () {
	try {
	  window.top.location.href;
	} catch (e) {
	  return true;
	}
	return false;
})();


function ut_ccpa(callbackAjs) {
	try {
		
	if (window.ut && window.ut.ccpa && window.ut.ccpa.indexOf('REPLACE') === -1) {
		return callbackAjs(window.ut.ccpa);
	} else if (window.ut && window.ut.ccpa && window.ut.ccpa.indexOf('REPLACE') !== -1) {
		window.ut.ccpa = '';
	}

	function _getRequireWildcardCache() {
		if (typeof WeakMap !== "function") return null;
		var cache = new WeakMap();
		_getRequireWildcardCache = function _getRequireWildcardCache() {
			return cache;
		};
		return cache;
	}

	function _interopRequireWildcard(obj) {
		if (obj && obj.__esModule) {
			return obj;
		}
		if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") {
			return {
				default: obj
			};
		}
		var cache = _getRequireWildcardCache();
		if (cache && cache.has(obj)) {
			return cache.get(obj);
		}
		var newObj = {};
		var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
		for (var key in obj) {
			if (Object.prototype.hasOwnProperty.call(obj, key)) {
				var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
				if (desc && (desc.get || desc.set)) {
					Object.defineProperty(newObj, key, desc);
				} else {
					newObj[key] = obj[key];
				}
			}
		}
		newObj.default = obj;
		if (cache) {
			cache.set(obj, newObj);
		}
		return newObj;
	}

	function _typeof(obj) {
		if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
			_typeof = function _typeof(obj) {
				return typeof obj;
			};
		} else {
			_typeof = function _typeof(obj) {
				return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
			};
		}
		return _typeof(obj);
	}

	var tArr = 'Array';
	var tStr = 'String';
	var tFn = 'Function';
	var tNumb = 'Number';
	var tObject = 'Object';
	var tBoolean = 'Boolean';

	function isA(object, _t) {
		var toString = Object.prototype.toString;
		return toString.call(object) === '[object ' + _t + ']';
	}

	function isStr(object) {
		return isA(object, tStr);
	}

	function isNumber(object) {
		return isA(object, tNumb);
	}

	var DEFAULT_CONSENT_API = 'iab';
	var DEFAULT_CONSENT_TIMEOUT = 50;
	var USPAPI_VERSION = 1;
	var consentAPI = 'iab';
	var consentTimeout;
	var consentData;
	var addedConsentHook = false; // consent APIs
	var consentConfig = {};

	var uspCallMap = {
		'iab': lookupUspConsent
	};
	/**
	 * This function handles interacting with an USP compliant consent manager to obtain the consent information of the user.
	 * Given the async nature of the USP's API, we pass in acting success/error callback functions to exit this function
	 * based on the appropriate result.
	 * @param {function(string)} uspSuccess acts as a success callback when USPAPI returns a value; pass along consentObject (string) from UPSAPI
	 * @param {function(string)} uspError acts as an error callback while interacting with USPAPI; pass along an error message (string)
	 * @param {object} hookConfig contains module related variables (see comment in requestBidsHook function)
	 */

	function lookupUspConsent(uspSuccess, uspError, hookConfig) {
		function handleUspApiResponseCallbacks() {
			var uspResponse = {};

			function afterEach() {
				if (uspResponse.usPrivacy) {
					uspSuccess(uspResponse, hookConfig);
				} else {
					uspError('Unable to get USP consent string.', hookConfig);
				}
			}

			return {
				consentDataCallback: function consentDataCallback(consentResponse, success) {
					if (success && consentResponse.uspString) {
						uspResponse.usPrivacy = consentResponse.uspString;
					}

					afterEach();
				}
			};
		}

		var callbackHandler = handleUspApiResponseCallbacks();
		var uspapiCallbacks = {}; // to collect the consent information from the user, we perform a call to USPAPI
		// to collect the user's consent choices represented as a string (via getUSPData)
		// the following code also determines where the USPAPI is located and uses the proper workflow to communicate with it:
		// - use the USPAPI locator code to see if USP's located in the current window or an ancestor window. This works in friendly or cross domain iframes
		// - if USPAPI is not found, the iframe function will call the uspError exit callback to abort the rest of the USPAPI workflow
		// - try to call the __uspapi() function directly, otherwise use the postMessage() api
		// find the CMP frame/window

		var f = window;
		var uspapiFrame;

		while (!uspapiFrame) {
			try {
				if (f.frames['__uspapiLocator'] || f.frames['__uspapi']) uspapiFrame = f;
			} catch (e) {}

			if (f === window.top) break;
			f = f.parent;
		}

		if (!uspapiFrame) {
			if (window._isWinTopRestrictedFrame) {
			uspapiFrame = window.top;
			} else {
				return uspError('USP CMP not found.', hookConfig);
			}
		} 
		
		try {
			// try to call __uspapi directly
			uspapiFrame.__uspapi('getUSPData', USPAPI_VERSION, callbackHandler.consentDataCallback);
		} catch (e) {
			// must not have been accessible, try using postMessage() api
			callUspApiWhileInIframe('getUSPData', uspapiFrame, callbackHandler.consentDataCallback);
		}

		function callUspApiWhileInIframe(commandName, uspapiFrame, moduleCallback) {
			/* Setup up a __uspapi function to do the postMessage and stash the callback.
			  This function behaves, from the caller's perspective, identicially to the in-frame __uspapi call (although it is not synchronous) */
			window.__uspapi = function(cmd, ver, callback) {
				var callId = Math.random() + '';
				var msg = {
					__uspapiCall: {
						command: cmd,
						version: ver,
						callId: callId
					}
				};
				uspapiCallbacks[callId] = callback;
				uspapiFrame.postMessage(msg, '*');
			};
			/** when we get the return message, call the stashed callback */


			window.addEventListener('message', readPostMessageResponse, false); // call uspapi

			window.__uspapi(commandName, USPAPI_VERSION, uspapiCallback);

			function readPostMessageResponse(event) {
				var res = event && event.data && event.data.__uspapiReturn;

				if (res && res.callId) {
					if (typeof uspapiCallbacks[res.callId] !== 'undefined') {
						uspapiCallbacks[res.callId](res.returnValue, res.success);
						delete uspapiCallbacks[res.callId];
					}
				}
			}

			function uspapiCallback(consentObject, success) {
				window.removeEventListener('message', readPostMessageResponse, false);
				moduleCallback(consentObject, success);
			}
		}
	}
	/**
	 * If consentManagementUSP module is enabled (ie included in setConfig), this hook function will attempt to fetch the
	 * user's encoded consent string from the supported USPAPI. Once obtained, the module will store this
	 * data as part of a uspConsent object which gets transferred to adapterManager's uspDataHandler object.
	 * This information is later added into the bidRequest object for any supported adapters to read/pass along to their system.
	 * @param {object} reqBidsConfigObj required; This is the same param that's used in pbjs.requestBids.
	 * @param {function} fn required; The next function in the chain, used by hook.js
	 */


	function requestBidsHook(fn, reqBidsConfigObj) {
		// preserves all module related variables for the current auction instance (used primiarily for concurrent auctions)
		var hookConfig = {
			context: this,
			args: [reqBidsConfigObj],
			nextFn: fn,
			//adUnits: reqBidsConfigObj.adUnits || $$PREBID_GLOBAL$$.adUnits,
			bidsBackHandler: reqBidsConfigObj.bidsBackHandler,
			haveExited: false,
			timer: null
		}; // in case we already have consent (eg during bid refresh)

		if (consentData) {
			return exitModule(null, hookConfig);
		}

		if (!uspCallMap[consentAPI]) {
			//console.log("USP framework (" + consentAPI + ") is not a supported framework. Aborting consentManagement module and resuming auction.");
			return hookConfig.nextFn.apply(hookConfig.context, hookConfig.args);
		}

		uspCallMap[consentAPI].call(this, processUspData, uspapiFailed, hookConfig); // only let this code run if module is still active (ie if the callbacks used by USPs haven't already finished)

		if (!hookConfig.haveExited) {
			if (consentTimeout === 0) {
				processUspData(undefined, hookConfig);
			} else {
				hookConfig.timer = setTimeout(uspapiTimeout.bind(null, hookConfig), consentTimeout);
			}
		}
	}
	/**
	 * This function checks the consent data provided by USPAPI to ensure it's in an expected state.
	 * If it's bad, we exit the module depending on config settings.
	 * If it's good, then we store the value and exits the module.
	 * @param {object} consentObject required; object returned by USPAPI that contains user's consent choices
	 * @param {object} hookConfig contains module related variables (see comment in requestBidsHook function)
	 */


	function processUspData(consentObject, hookConfig) {
		var valid = !!(consentObject && consentObject.usPrivacy);

		if (!valid) {
			uspapiFailed("UPSAPI returned unexpected value during lookup process.", hookConfig, consentObject);
			return;
		}

		clearTimeout(hookConfig.timer);
		storeUspConsentData(consentObject);
		exitModule(null, hookConfig);
	}
	/**
	 * General timeout callback when interacting with USPAPI takes too long.
	 */


	function uspapiTimeout(hookConfig) {
		uspapiFailed('USPAPI workflow exceeded timeout threshold.', hookConfig);
	}
	/**
	 * This function contains the controlled steps to perform when there's a problem with USPAPI.
	 * @param {string} errMsg required; should be a short descriptive message for why the failure/issue happened.
	 * @param {object} hookConfig contains module related variables (see comment in requestBidsHook function)
	 * @param {object} extraArgs contains additional data that's passed along in the error/warning messages for easier debugging
	 */


	function uspapiFailed(errMsg, hookConfig, extraArgs) {
		clearTimeout(hookConfig.timer);
		exitModule(errMsg, hookConfig, extraArgs);
	}
	/**
	 * Stores USP data locally in module and then invokes uspDataHandler.setConsentData() to make information available in adaptermanger.js for later in the auction
	 * @param {object} cmpConsentObject required; an object representing user's consent choices (can be undefined in certain use-cases for this function only)
	 */


	function storeUspConsentData(consentObject) {
		if (consentObject && consentObject.usPrivacy) {
			consentData = consentObject.usPrivacy;
			//console.log("consentData " + consentData);
			//_adapterManager.uspDataHandler.setConsentData(consentData);
		}
	}
	/**
	 * This function handles the exit logic for the module.
	 * There are a couple paths in the module's logic to call this function and we only allow 1 of the 2 potential exits to happen before suppressing others.
	 *
	 * We prevent multiple exits to avoid conflicting messages in the console depending on certain scenarios.
	 * One scenario could be auction was canceled due to timeout with USPAPI being reached.
	 * While the timeout is the accepted exit and runs first, the USP's callback still tries to process the user's data (which normally leads to a good exit).
	 * In this case, the good exit will be suppressed since we already decided to cancel the auction.
	 *
	 * Three exit paths are:
	 * 1. good exit where auction runs (USPAPI data is processed normally).
	 * 2. bad exit but auction still continues (warning message is logged, USPAPI data is undefined and still passed along).
	 * @param {string} errMsg optional; only to be used when there was a 'bad' exit.  String is a descriptive message for the failure/issue encountered.
	 * @param {object} hookConfig contains module related variables (see comment in requestBidsHook function)
	 * @param {object} extraArgs contains additional data that's passed along in the error/warning messages for easier debugging
	 */


	function exitModule(errMsg, hookConfig, extraArgs) {
		if (hookConfig.haveExited === false) {
			hookConfig.haveExited = true;
			var context = hookConfig.context;
			var args = hookConfig.args;
			var nextFn = hookConfig.nextFn;

			if (errMsg) {
				//console.log(errMsg + ' Resuming auction without consent data as per consentManagement config.' + extraArgs);
			}

			nextFn.apply(context, args);
		}
	}




	/**
	 * A configuration function that initializes some module variables, as well as add a hook into the requestBids function
	 * @param {object} config required; consentManagementUSP module config settings; usp (string), timeout (int), allowAuctionWithoutConsent (boolean)
	 */


	function setConsentConfig(config) {
		//config = config.usp;

		if (!config || _typeof(config) !== 'object') {
			//console.log('consentManagement.usp config not defined, exiting usp consent manager');
			return;
		}

		if (isStr(config.cmpApi)) {
			consentAPI = config.cmpApi;
		} else {
			consentAPI = DEFAULT_CONSENT_API;
			//console.log("consentManagement.usp config did not specify cmpApi. Using system default setting (" + DEFAULT_CONSENT_API + ").");
		}

		if (isNumber(config.timeout)) {
			consentTimeout = config.timeout;
		} else {
			consentTimeout = DEFAULT_CONSENT_TIMEOUT;
			//console.log("consentManagement.usp config did not specify timeout. Using system default setting (" + DEFAULT_CONSENT_TIMEOUT + ").");
		}

		//console.log('USPAPI consentManagement module has been activated...');

		addedConsentHook = true;
		consentConfig = config;
	}


	setConsentConfig({
		cmp: 'iab',
		timeout: 50
	});


	} catch (e) {
		callbackAjs(consentData);
		return;
	}
	
	requestBidsHook(function() {
		didHookReturn = true;
		callbackAjs(consentData);
	}, consentConfig);
}

function ut_gpp(callbackAjs) {
	try {
		if (window.ut && window.ut.gpp && window.ut.gpp.indexOf('REPLACE') === -1) {
			return callbackAjs({gpp: window.ut.gpp, gpp_sid: window.ut.gpp_sid});
		} else if (window.ut && window.ut.gpp && window.ut.gpp.indexOf('REPLACE') !== -1) {
			window.ut.gpp = '';
			window.ut.gpp_sid = '';
		}

		if (window.__gpp) {
			__gpp('ping', function(data){
				if (data.gppString) {
					window.ut.gpp = data.gppString;
					window.ut.gpp_sid = data.sectionList;
				}
				return callbackAjs({gpp: window.ut.gpp, gpp_sid: window.ut.gpp_sid});
			});
		} else {
			return callbackAjs({gpp: window.ut.gpp, gpp_sid: window.ut.gpp_sid});
		}

	} catch (e) {
		callbackAjs({});
		return;
	}
}


/* Get (X,Y) coordinates of element in page */
function ut_pos(o) {
    var oo = o, l = 0, t = 0;
    if(o) {
        for(l = o.offsetLeft, t = o.offsetTop; o = o.offsetParent; l += o.offsetLeft, t += o.offsetTop);

        /* Find position of iframe relative to top document if possible */
        try {
            if(top.location != location && parent && parent.document) {

                /* Find iframe in parent document */
                var frames = parent.document.getElementsByTagName('iframe');

                for(i in frames) {
                    if((o = frames[i]).contentWindow == window) {

                        /* Caculate position */
                        for(l += o.offsetLeft, t += o.offsetTop; o = o.offsetParent; l += o.offsetLeft, t += o.offsetTop);
                        break;
                    }
                }
            }
        } catch(e) {
        }

        oo.innerHTML = '';
        oo.style.display = 'none';
    }
    return [l,t];
}

function ut_cheight() {
    var viewportheight;
    if (typeof ut_win.innerHeight != 'undefined') {
        viewportheight = ut_win.innerHeight;
    }
    else if (typeof ut_doc.documentElement != 'undefined' && typeof ut_doc.documentElement.clientWidth != 'undefined' && ut_doc.documentElement.clientWidth != 0) {
        viewportheight = ut_doc.documentElement.clientHeight;
    }
    else {
        viewportheight = ut_doc.getElementsByTagName('body')[0].clientHeight;
    }
    return viewportheight;
}

function ut_cwidth() {
    var viewportwidth;
    if (typeof ut_win.innerWidth != 'undefined') {
        viewportwidth = ut_win.innerWidth;
    }
    else if (typeof ut_doc.documentElement != 'undefined' && typeof ut_doc.documentElement.clientWidth != 'undefined' && ut_doc.documentElement.clientWidth != 0) {
        viewportwidth = ut_doc.documentElement.clientWidth;
    }
    else {
        viewportwidth = ut_doc.getElementsByTagName('body')[0].clientWidth;
    }
    return viewportwidth;
}


/* Helper function to get real width/height of client window */
function ut_val(a, b, c) {
    var r = a ? a : 0;

    if(r <= 0 || (b && b > 0)) {
        r = b;
    }

    return (r <= 0 || (c && c > 0)) ? c : r;
}

/* Append parameter to query string */
function ut_ap(n, v) {
    if(typeof(v) != "undefined") {
    	if (v && v.indexOf && v.indexOf('REPLACE') !== -1) {
		return;
	}
	if (v && v.indexOf && v.indexOf('http') !== -1) {
		ut_ju += "&" + n + "=" + encodeURIComponent(v);
	} else {
		ut_ju += "&" + n + "=" + escape(v);
	}
        
    }
}

/* JavaScript helper required to detect Flash Player PlugIn version information */
function ut_fv() {
    // NS/Opera version >= 3 check for Flash plugin in plugin array
    var flashVer = 0;
    var isIE = (navigator.appVersion.indexOf("MSIE") != -1) ? true : false;
    var isWin = (navigator.appVersion.toLowerCase().indexOf("win") != -1) ? true : false;
    var isOpera = (navigator.userAgent.indexOf("Opera") != -1) ? true : false;

    if (navigator.plugins != null && navigator.plugins.length > 0) {
        if (navigator.plugins["Shockwave Flash 2.0"] || navigator.plugins["Shockwave Flash"]) {
            var swVer2 = navigator.plugins["Shockwave Flash 2.0"] ? " 2.0" : "";
            var flashDescription = navigator.plugins["Shockwave Flash" + swVer2].description;
            flashVer = flashDescription.split(" ").slice(2).join(".");
        }
    }
    // MSN/WebTV 2.6 supports Flash 4
    else if (navigator.userAgent.toLowerCase().indexOf("webtv/2.6") != -1) flashVer = 4;
    // WebTV 2.5 supports Flash 3
    else if (navigator.userAgent.toLowerCase().indexOf("webtv/2.5") != -1) flashVer = 3;
    // older WebTV supports Flash 2
    else if (navigator.userAgent.toLowerCase().indexOf("webtv") != -1) flashVer = 2;
    else if ( isIE && isWin && !isOpera ) {
        var axo;
        var e;

        // NOTE : new ActiveXObject(strFoo) throws an exception if strFoo isn't in the registry

        try {
            // version will be set for 7.X or greater players
            axo = new ActiveXObject("ShockwaveFlash.ShockwaveFlash.7");
            flashVer = axo.GetVariable("$version");
        } catch (e) {
        }

        if (!flashVer) {
            try {
                // version will be set for 6.X players only
                axo = new ActiveXObject("ShockwaveFlash.ShockwaveFlash.6");

                // installed player is some revision of 6.0
                // GetVariable("$version") crashes for versions 6.0.22 through 6.0.29,
                // so we have to be careful.

                // default to the first public version
                flashVer = 6;

                // throws if AllowScripAccess does not exist (introduced in 6.0r47)
                axo.AllowScriptAccess = "always";

                // safe to call for 6.0r47 or greater
                flashVer = axo.GetVariable("$version");

            } catch (e) {
            }
        }

        if (!flashVer) {
            try {
                // version will be set for 4.X or 5.X player
                axo = new ActiveXObject("ShockwaveFlash.ShockwaveFlash.3");
                flashVer = axo.GetVariable("$version");
            } catch (e) {
            }
        }

        if (!flashVer) {
            try {
                // version will be set for 3.X player
                axo = new ActiveXObject("ShockwaveFlash.ShockwaveFlash.3");
                flashVer = 3;
            } catch (e) {
            }
        }

        if (!flashVer) {
            try {
                // version will be set for 2.X player
                axo = new ActiveXObject("ShockwaveFlash.ShockwaveFlash");
                flashVer = 2;
            } catch (e) {
                flashVer = 0;
            }
        }

        if(typeof(flashVer) == "string") {
            flashVer = flashVer.split(" ")[1].split(",").join(".");
        }
    }

    return flashVer;
}

function ut_ad_script() {
	ut_ju = ut_ju.replace(/^http:\/\//i, 'https://');
	if (ut_ju.substring(0, 2) === '//') {
		ut_ju = 'https:' + ut_ju;
	}	
	/* Ad request */
	if ('browsingTopics' in document && document.featurePolicy.allowsFeature('browsing-topics')){
			 fetch(ut_ju, {browsingTopics: true})
			  .then((response) => {
				return response.text();
			  })
			  .then((html) => {
				  if(html) {
					  if(window.top == window.self) {
						 var tmpIframe = document.createElement('iframe');
					            tmpIframe.width = "1";
					            tmpIframe.height = "1";
					            tmpIframe.style.border = "0";
					            document.body.appendChild(tmpIframe);
					            tmpIframe.contentWindow.document.open();
					            tmpIframe.contentWindow.document.write("<head><\/head><body><script>" + html + "<\/script><\/body>");
					            tmpIframe.contentWindow.document.close();
					  } else {
	    					var s = document.createElement('img');
						s.src = "data:image/png,undertone";
						s.style = "display:none";
						s.setAttribute("onerror", "document.open();"+html+"document.close();");
						document.body.appendChild(s);	
					  }		
				  }
			  });
	} else {
		    document.writeln("\n<"+"script type=\"text/javascript\" src=\""+ut_ju+"\"><"+"/script>\n");
	}
}

function ut_get_environment () {
	function __isUndefined (e) {
	  return typeof e === 'undefined';
	}
		  
	var _environment = 0;
	
      if (_environment != 0) return _environment;
      var _constants = {
        // UNDEFINED: 0,
        WEB: 100,
        SAFEFRAME: 200,
        FIF: 201,
        RESTRICTEDFRAME: 202,
        ORMMA: 300,
        MRAID10: 401,
        MRAID20: 402,
        MRAID30: 403,
        MRAIDVAST: 503,
        VAST: 500
      };
      try {        
        if (!__isUndefined(window.mraid) && !__isUndefined(mraid.addEventListener)) {
          _environment = _constants.MRAID10;
          // mraid.getVersion could not be available at this point
          if (!__isUndefined(mraid.getVersion) && mraid.getVersion() == '2.0') {
            _environment = _constants.MRAID20;
          } else if (!__isUndefined(mraid.getVersion) && mraid.getVersion() == '3.0') {
            _environment = _constants.MRAID30;
          }
        } else if (!__isUndefined(window.ormma) && !__isUndefined(ormma.addEventListener)) {
          _environment = _constants.ORMMA;
        } else if (!__isUndefined(window.sfAPI) || (!__isUndefined(window.$sf) && !__isUndefined($sf.ext))) {
          _environment = _constants.SAFEFRAME;
        } else if (!__isUndefined(window.inDapIF)) {
          _environment = _constants.FIF;
        } else if (!__isUndefined(window.getVPAIDAd)) { 
          _environment = _constants.VAST;        
        } else if (_isWinTopRestrictedFrame) {
          _environment = _constants.RESTRICTEDFRAME;
        } else {
          _environment = _constants.WEB;
        }
      } catch (e) {
      }
      return _environment;
}

var ut_doc,
    ut_win;
    
try {
    ut_doc = typeof(parent.document) != 'undefined' ? parent.document : document;
    ut_win = window.top,
    ut_operatest = ut_doc.ut_synched;
} catch(e) {
    ut_doc = document;
    ut_win = window;
}

/* Check if inside iframe and iframe buster URL is defined */
if(ut_doc == document && typeof(ut.ifurl) != "undefined" && top.location != location && (navigator.userAgent.indexOf("Opera") == -1)) {
    ut.ajurl = ut_ju; /* ad request URL */
    ut_ju = ut.ifurl;
}

/* Start query string */
ut_ju += "?";

/* Append all variables to query string */
for(var i in ut) {
    if(i != "ifurl") {
        ut_ap(i, ut[i]);
    }
}

/* Redirect to the iframe buster */
if(ut_doc == document && typeof(ut.ifurl) != "undefined" && top.location != location && (navigator.userAgent.indexOf("Opera") == -1)) {
    ut_ap("fb", "1");
    location.href = ut_ju;
}
else {
    if(ut_doc != document) {
        ut_ap("fb", "1");
    }
    /* Cache buster */
    ut_ap("cb", ut_cb = Math.floor(Math.random() * 99999999999));

    /* User local time */
    ut_ap("t", new Date().getTime() / 1000 - new Date().getTimezoneOffset() * 60);

    /* Detect flash version */
    try {
        ut_ap("fv", ut_fv());
    } catch(e) {
    }

    /* Page element to calculate position of ad in page */
    document.writeln("\n<"+"span id=\"ut"+ut_cb+"\" style=\"width:0px;height:0px;visibility:hidden;position:absolute;\"><"+"/span>\n");

    /* Get (X,Y) coordinates of ad relative to the top left corner of the page */
    try {
        var ut_p = ut_pos(document.getElementById("ut" + ut_cb));
        ut_ap("x", ut_p[0]);
        ut_ap("y", ut_p[1]);
    } catch(e) {
    }

    /* Get available screen width and height */
    try {
        ut_ap("sw", ut_win.screen.availWidth);
        ut_ap("sh", ut_win.screen.availHeight);
    } catch(e) {
    }

    /* Get client window width */
    try {
        ut_ap("cw", ut_cwidth());
    } catch(e) {
    }

    /* Get client window height */
    try {
        ut_ap("ch", ut_cheight());
    } catch(e) {
    }

    /* Detect if SWFObject was already loaded */
    if(document.mmm_fo) {
        ut_ap("fl", "1");
    }

    /* Detect if a synched ad was already displayed in the page and pass the campaign id to the request */
    if(typeof(ut_doc) != 'undefined' && typeof(ut_doc.ut_synched) != 'undefined' ) {
        ut_ap("cid", ut_doc.ut_synched);
    }

    try {
        /* try getting the top page canonical url */
		var canonicalLoc = ut_win.document.querySelector("link[rel='canonical']") ? ut_win.document.querySelector("link[rel='canonical']").href : null;
		
        /* Grab referrer URL and detect iframes */
        if(top.location == location) {
            ut_ap("loc", canonicalLoc || location.href);

        /* Inside iframe and have parent.document (friendly iframe)*/
        } else if(ut_doc != document) {
            ut_ap("loc", canonicalLoc || top.location.href);
            ut_ap("fr", "1");
        /* Inside iframe  (non-friendly iframe)*/
        } else {
            ut_ap("loc", document.referrer);
            ut_ap("fr", "1");
        }
    } catch(e) {
    }
	
    ut_ap("env", ut_get_environment());

    /* Pass third-party click tracking URL */
    if((typeof(document.MAX_ct0) != "undefined") && (document.MAX_ct0.substring(0, 4) == "http")) {
        ut_ap("ct0", document.MAX_ct0);
    }
	
    ut_ccpa(function (consentData) {
			ut_ap("ccpa", consentData);
			ut_gpp(function(gppData) {
				ut_ap("gpp", gppData.gpp);
				ut_ap("gpp_sid", gppData.gpp_sid);
				ut_ad_script();
			});
			// ut_ad_script();
		});
}
