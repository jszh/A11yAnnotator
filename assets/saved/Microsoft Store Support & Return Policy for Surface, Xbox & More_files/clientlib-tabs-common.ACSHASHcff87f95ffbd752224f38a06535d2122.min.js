    /**
     * Addresses common concerns with the Tabs-family components; coordinates initialization and nesting of multiple tabs on a page
     *
     * Supports:
     * - empty tab titles
     * - spaces in tab titles
     * - special characters in tab titles
     * 
     * When creating a new Tabs-based compoent, add a new selector to the "allTabTypes" array
     */

(function () {
    "use strict";

    var NS = "cmp";
    var IS;
    var selectors;

     /**
     * Tabs Configuration
     *
     * @typedef {Object} TabsConfig Represents a Tabs configuration
     * @property {HTMLElement} element The HTMLElement representing the Tabs
     * @property {Object} options The Tabs options
     */

    /**
     * Tabs
     *
     * @class Tabs
     * @classdesc An interactive Tabs component for navigating a list of tabs
     * @param {TabsConfig} config The Tabs configuration
     */
    function Tabs(config) {
        var that = this;

        if (config && config.element) {
            init(config);
        }

     	$(window).on('hashchange', function() {
            init(config);
         })

        /**
         * Initializes the Tabs
         *
         * @private
         * @param {TabsConfig} config The Tabs configuration
         */
        function init(config) {
            // prevents multiple initialization
            config.element.removeAttribute("data-" + NS + "-is");

            cacheElements(config.element);
            that._active = getActiveIndex(that._elements["tab"]);
            that._options = config.options;

            var pageURL = document.location.href;
            if (that._elements.tabpanel && (pageURL.split("#")[1] != "page-top")) {  
                refreshActive();
            }

            if (window.Granite && window.Granite.author && window.Granite.author.MessageChannel) {

                /*
                 * Editor message handling:
                 * - subscribe to "cmp.panelcontainer" message requests sent by the editor frame
                 * - check that the message data panel container type is correct and that the id (path) matches this specific Tabs component
                 * - if so, route the "navigate" operation to enact a navigation of the Tabs based on index data
                 */
                new window.Granite.author.MessageChannel("cqauthor", window).subscribeRequestMessage("cmp.panelcontainer", function (message) {
                    if (message.data && (message.data.type === "cmp-tabs" || message.data.type === "cmp-imagetabs") && message.data.id === that._elements.self.dataset["cmpPanelcontainerId"]) {
                        if (message.data.operation === "navigate") {
                            navigate(message.data.index);
                        }
                    }
                });
            }
        }

        /**
         * Returns the index of the active tab, if no tab is active returns 0
         *
         * @param {Array} tabs Tab elements
         * @returns {Number} Index of the active tab, 0 if none is active
         */
        function getActiveIndex(tabs) {
            let index1 = -1, index2 = -1;
            if (tabs) {
                index1 = tabs.findIndex((tab) => tab.classList.contains("active"));
                index2 = tabs.findIndex((tab) => tab.classList.contains(selectors.active.tab));
            }
            return index1 >= 0 ? index1 : index2 >= 0 ? index2 : 0;
        }

        /**
         * Caches the Tabs elements as defined via the {@code data-tabs-hook="ELEMENT_NAME"} markup API
         *
         * @private
         * @param {HTMLElement} wrapper The Tabs wrapper element
         */
        function cacheElements(wrapper) {
            that._elements = {};
            that._elements.self = wrapper;
            var hooks = that._elements.self.querySelectorAll("[data-" + NS + "-hook-" + IS + "]");

            for (var i = 0; i < hooks.length; i++) {
                var hook = hooks[i];
                if (hook.closest("." + NS + "-" + IS) === that._elements.self) { // only process own tab elements
                    var capitalized = IS;
                    capitalized = capitalized.charAt(0).toUpperCase() + capitalized.slice(1);
                    var key = hook.dataset[NS + "Hook" + capitalized];
                    if (that._elements[key]) {
                        that._elements[key].push(hook);
                    } else {
                        that._elements[key] = [hook];
                    }
                }
            }
        }

        /**
         * Refreshes the tab markup based on the current {@code Tabs#_active} index
         *
         * @private
         */
        function refreshActive() {

            var tabpanels = that._elements["tabpanel"];
            var tabs = that._elements["tab"];
            var order = that._options.order;

            if (tabpanels) {
                for (var i = 0; i < tabpanels.length; i++) {
                    const originalId = tabpanels[i].getAttribute("id");
                    let modifiedTabId = replaceInvalidChars(originalId, `${order}-${i+1}-tab`);
                    if (modifiedTabId.slice(-4) !== "-tab") modifiedTabId += "-tab";
                    const modifiedPanelId = replaceInvalidChars(originalId, `${order}-${i+1}`);

                    if (tabs && tabs[i]) {
                        tabs[i].setAttribute("id", modifiedTabId);
                        tabs[i].setAttribute("href", '#' + modifiedPanelId);
                        tabs[i].setAttribute("aria-controls", modifiedPanelId);
                    }
                    tabpanels[i].setAttribute("id", modifiedPanelId);
                    tabpanels[i].setAttribute("aria-labelledby", modifiedTabId);

                    if (i === parseInt(that._active)) {
                        tabpanels[i].classList.add(selectors.active.tabpanel);
                        tabpanels[i].classList.add("active");
                        tabpanels[i].classList.add("show");

                        if (tabs && tabs[i]) {
                            tabs[i].classList.add(selectors.active.tab);
                            tabs[i].setAttribute("aria-selected", true);
                            tabs[i].setAttribute("tabindex", "0");
                        }
                    } else {
                        tabpanels[i].classList.remove(selectors.active.tabpanel);
                        tabpanels[i].classList.remove("active");
                        tabpanels[i].classList.add("show");

                        if (tabs && tabs[i]) {
                            tabs[i].classList.remove(selectors.active.tab);
                            tabs[i].classList.remove("active");
                            tabs[i].setAttribute("aria-selected", false);
                            tabs[i].setAttribute("tabindex", "-1");
                        }
                    }
                }
            }
        }
        // Regex is based on the spec https://www.w3.org/TR/html4/types.html#type-id
        function replaceInvalidChars(item, defaultId) {
            item = decodeURIComponent(item)?.trim();
            //Replace them with dash in all id's
            item = item?.replace(/[^-_0-9a-zA-Z#]/g, "-");
            if ((!item || item==='null' || item==='-tab' || item.includes('--')) && defaultId) {
                item = defaultId;
            }


            //Set URL pattern as #<tabname>
            return item.toLowerCase(); 
        }

        /**
         * Navigates to the tab at the provided index
         *
         * @private
         * @param {Number} index The index of the tab to navigate to
         */
        function navigate(index) {
              
            that._active = index;
            refreshActive();
        }
        $("coral3-Tree-contentContainer").on('click', function(e) {
            if (
              $(e.target.closest("coral3-Tree-contentContainer"))
                .find(">coral-tree-item-content>span")
                .text() === "Image Tabs"
            ) {
                that._active = 1;
                refreshActive();
            }
        });
    }

    /**
     * Reads options data from the Tabs wrapper element, defined via {@code data-cmp-*} data attributes
     *
     * @private
     * @param {HTMLElement} element The Tabs element to read options data from
     * @returns {Object} The options read from the component data attributes
     */
    function readData(element) {
        var data = element.dataset;
        var options = [];
        var capitalized = IS;
        capitalized = capitalized.charAt(0).toUpperCase() + capitalized.slice(1);
        var reserved = ["is", "hook" + capitalized];

        for (var key in data) {
            if (data.hasOwnProperty(key)) {
                var value = data[key];

                if (key.indexOf(NS) === 0) {
                    key = key.slice(NS.length);
                    key = key.charAt(0).toLowerCase() + key.substring(1);

                    if (reserved.indexOf(key) === -1) {
                        options[key] = value;
                    }
                }
            }
        }

        return options;
    }

    /**
     * Document ready handler and DOM mutation observers. Initializes Tabs components as necessary.
     *
     * @private
     */
    function onDocumentReady() {
        const allTabTypes = ['tabs', 'imagetabs'];
        allTabTypes.forEach(function (type) {
            IS = type;
            selectors = {
                self: "[data-" + NS + '-is="' + IS + '"]',
                active: {
                    tab: `cmp-tabs__tab--active`,
                    tabpanel: `cmp-tabs__tabpanel--active`
                }
            };
            var elements = document.querySelectorAll(selectors.self);
            for (var i = 0; i < elements.length; i++) {
                new Tabs({
                    element: elements[i],
                    options: {...readData(elements[i]), order: `${type}${i+1}`}
                });
            }

            var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
            var body = document.querySelector("body");
            var observer = new MutationObserver(function (mutations) {
                mutations.forEach(function (mutation) {
                    // needed for IE
                    var nodesArray = [].slice.call(mutation.addedNodes);
                    if (nodesArray.length > 0) {
                        nodesArray.forEach(function (addedNode) {
                            if (addedNode.querySelectorAll) {
                                var elementsArray = [].slice.call(addedNode.querySelectorAll(selectors.self));
                                elementsArray.forEach(function (element) {
                                    new Tabs({
                                        element: element,
                                        options: readData(element)
                                    });
                                });
                            }
                        });
                    }
                });
            });

            observer.observe(body, {
                subtree: true,
                childList: true,
                characterData: true
            });
        });
    }
    if (document.readyState !== "loading") {
        onDocumentReady();
    } else {
        document.addEventListener("DOMContentLoaded", onDocumentReady);
    }
}());