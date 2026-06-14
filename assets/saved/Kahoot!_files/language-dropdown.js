jQuery(document).ready(function($) {

    const locale = document.querySelector('html').getAttribute('lang');
    
    var langs = new Map([
        // ['English (US)', 'en'] // default
    ]);
    
    const LangLabel = {
        'en':'English',
        'fr':'French',
        'de':'German',
        'it':'Italian',
        'nb':'Norwegian',
        'no':'Norwegian',
        'pl':'Polish',
        'es':'Spanish',
        'uk':'Ukrainian',
        'da':'Danish',
        'nl':'Dutch',
        'ja':'Japanese',
        'ko':'Korean',
        'pt-br':'Portuguese, Brazilian',
        'pt':'Portuguese, Brazilian',
        'sv':'Swedish',
        'tr':'Turkish',
        'zh-cn':'Chinese Simplified',
        'zh-tw':'Chinese Traditional',
        'ach':'Acoli',
        'vi':'Vietnamese',
        'id':'Indonesian',
        'th':'Thai',
        'ar':'Arabic'
    };
    
    $('link[rel="alternate"][hreflang]').each(function(){
        var $lang = $(this);
        langs.set( $lang.attr('data-lang-label'), $lang.attr('hreflang') );
    });
    
    function setLanguageSelectors(){
        var selectorWrap = $(".language-selector");
        var sel = $('<div class="language-selector-dropdown">');
    
        //Use lang attr to know if page is english
        var langAttr = $('html').attr('lang');
    
        if(langAttr != "en") {
            var current = locale ? locale : window.location.pathname.split('/')[1];
            current = current.toUpperCase();
        } else {
            current = "EN";
        }
        selectorWrap.html("");
        var langExists = false;
        //Check if language exists in langs map
        langs.forEach(function(value, key) { 
            if(value.toUpperCase() == current){
                langExists = true;
            }
        });
        if(langExists && langs.size > 1) {
            selectorWrap.append($("<button class='language-selector-toggle' aria-label='Open language dropdown, current: "+current+"'>").attr('data-action', 'openLanguageMenu').text(current));
            langs.forEach(function(value, key) { 
                    const langURL = $('[hreflang="'+value+'"]').attr('href');
                    const status = $('[hreflang="'+value+'"]').data('status');
                    const link = $("<a>").attr('data-value', value).attr("href", langURL).html(key + '<span class="lang">' + LangLabel[value.toLowerCase()]+'</span>').attr('data-status', status).attr("aria-label", "Switch language to " + key).addClass('lang-link');
                    if (value.toUpperCase() == current) {
                        link.addClass('active-lang');
                    }
                    sel.append(link);
            });
            selectorWrap.append(sel);
            if (langs.size > 9) {
                langScrollIndicator(sel);
            }
        } 
    }

    $(document).on('click', '.lang-link', function () {
        const selectedLang = $(this).data('value');
        if (selectedLang) {
            const expirationDate = new Date();
            expirationDate.setDate(expirationDate.getDate() + 30); // 30 days
            document.cookie = `preferred_lang=${selectedLang}; path=/; expires=${expirationDate.toUTCString()}`;
        }
    });

    function setBrowserLanguage() {
        var preferredLang = Cookies.get('preferred_lang')?.toLowerCase();
        const fullBrowserLang = ['pt-BR', 'zh-CN', 'zh-TW'];
        let browserLang = navigator.language || navigator.userLanguage;
        if(browserLang == 'pt' || browserLang == 'pt-PT') {browserLang = 'pt-BR';}
        if(browserLang == 'zh' || browserLang == 'zh-HK') {browserLang = 'zh-CN';}

        let processedBrowserLang = fullBrowserLang.includes(browserLang) ? browserLang.toLowerCase() : browserLang.split('-')[0].toLowerCase();
        const langAlternate = preferredLang ? $(`[hreflang="${preferredLang}"]`)[0] : $(`[hreflang="${processedBrowserLang}"]`)[0];

        if (preferredLang == null) {
            const expirationDate = new Date();
            expirationDate.setDate(expirationDate.getDate() + 30);
            document.cookie = `preferred_lang=${processedBrowserLang}; path=/; expires=${expirationDate.toUTCString()}`;
            preferredLang = processedBrowserLang; 
        }

        const currentLang = $('html').attr('lang').toLowerCase();
        if (currentLang === preferredLang) {
            return;
        }
        if (langAlternate && langAlternate.href && preferredLang != 'en') {
            window.location.href = langAlternate.href;
            return;
        }
    }
    
        function langScrollIndicator(el) {
            const arrowUp = $('<div class="lang-scroll lang-scroll-top" />').prependTo(el);
            const arrowDown = $('<div class="lang-scroll lang-scroll-bottom" />').appendTo(el);
            var scrollInterval;
    
            arrowDown.on('mouseenter', () => {
                scrollInterval = setInterval(() => {
                    if (el.scrollTop() + el.height() < el.prop('scrollHeight')) {
                        el.scrollTop(el.scrollTop() + 8);
                    }
                }, 16);
            }).on('mouseleave', () => clearInterval(scrollInterval));
    
            arrowUp.on('mouseenter', () => {
                scrollInterval = setInterval(() => {
                    if (el.scrollTop() > 0) {
                        el.scrollTop(el.scrollTop() - 8);
                    }
                }, 16);
            }).on('mouseleave', () => clearInterval(scrollInterval));
    
            el.on('scroll', () => {
                arrowUp.toggle(el.scrollTop() > 0);
                arrowDown.toggle(el.scrollTop() + el.height() < el.prop('scrollHeight'));
            });
    
            if (el.scrollTop() === 0) {
                arrowUp.hide();
            }
        }
    
        function addingLangParam(){
            var langAttr = $('html').attr('lang');
            var preferredLang = Cookies.get('preferred_lang');
            var lang = preferredLang && preferredLang !== 'en' ? preferredLang : langAttr;
            
            if(lang != 'en') {
                var hrefs = document.querySelectorAll('a[href*=kahoot], .logo-link');
                hrefs.forEach(element => {
                    var currentHref = element.getAttribute('href');
                    if (currentHref != null ){
                        var connector = /\?/.test(currentHref) ? '&' : '?';
                        if ( !/lang/.test(currentHref) ) {
                            element.setAttribute('href', currentHref+connector +'lang='+lang);
                        }
                    }	
                });
            } 
        }
    
        setBrowserLanguage();
        addingLangParam();
        checkForLanguageAttribute();
        setLanguageSelectors();
    
    
        function checkForLanguageAttribute() {
            const hostname = window.location.host;
            const rightMenuEnvironments = ['kahoot.com', 'qa2.kahoot.com', 'kahoot-qa.com', 'experimental.kahoot.com', 'kahoot-experimental.com', 'localhost:9000'];
            const leftMenuEnvironments = ['trust.kahoot.com', 'staging-trust.kahoost.com', 'localhost:9090', 'host.docker.internal:9090'];
        
            if ($('#header-menu').attr('data-translated') == true && $('#header-menu').find('.language-selector').length === 0) {
                if (rightMenuEnvironments.includes(hostname)) {
                    $('.header-menu-right').append("<li id='language-selector' class='language-selector'></li>");
                } else if (leftMenuEnvironments.includes(hostname)) {
                    $('.header-menu-left').after("<li id='language-selector' class='language-selector'></li>");
                }
            }
        }
    
	
        function hideDropdown(event) {
            const dropdown = $('.language-selector-dropdown');
            const toggle = $('.language-selector-toggle');
            if (dropdown.is(':visible') && !toggle.is(event.target)) {
            dropdown.hide();
            $(document).off('click', hideDropdown);
            }
        }
        
        $(document).on('click', '.language-selector-toggle', function() {
            const dropdown = $(this).parent().find('.language-selector-dropdown');
            dropdown.toggle();
            $(document).on('click', hideDropdown);
        });
    
        let langParam = new URLSearchParams(window.location.search).get('lang');
        const langAttr = document.querySelector('html').getAttribute('lang')
    
        if(langParam && langAttr != langParam) {
            if(langParam == 'pt') {
              langParam = 'pt-BR';
            }
            const langAlternate = $(`[hreflang="${langParam}"]`)[0];
            let url = new URL(window.location.href);
            url.searchParams.delete('lang');
            if (langAlternate) {
                window.location.href = langAlternate.href+url.search;
            }
        }

        

        $(document).on('click', '.translation-close-message', function() {
            document.getElementById('no-translation-message').style.display = 'none';
        });
    
    });