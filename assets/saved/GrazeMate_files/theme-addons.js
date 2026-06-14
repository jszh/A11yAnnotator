"use strict";
// Toggle/Accordion
function wglAccordionInit() {
    var items = jQuery('.wgl-accordion');

    items.each( function() {
        const $this = jQuery(this),
            header = $this.find('.wgl-accordion_header'),
            acc_type = $this.data('type'),
            acc_trigger = $this.data('trigger'),
            trigger = 'toggle' === acc_type && 'hover' === acc_trigger ? 'mouseenter click' : 'click',
            speed = 400;

        header.each( function() {
            const $panel = jQuery(this).parent().parent();
            if ($panel.data('default') === 'yes') {
                $panel.addClass('active').find('.wgl-accordion_content').slideDown(speed);
            }
        })

        header.on(trigger, function(e) {
            const $panel = jQuery(this).parent().parent();

            if ( 'accordion' === acc_type ) {
                $panel.toggleClass('active').find('.wgl-accordion_content').slideToggle(speed);
            } else if ( 'toggle' === acc_type ) {
                // Stop the animation on mouse enter
                $panel.siblings().find('.wgl-accordion_content').stop(true, false).slideUp(speed);

                $panel.addClass('active').find('.wgl-accordion_content').slideDown(speed);
                $panel.siblings().removeClass('active').find('.wgl-accordion_content').slideUp(speed);
            }
        })
    })
}

// Accordion Services
function wglServicesAccordionInit() {
    var widgetList = jQuery('.wgl-accordion-services');

    widgetList.each(function () {
        var itemClass = '.service__item';

        jQuery(this).find(itemClass + ':first-child').addClass('active');

        var item = jQuery(this).find(itemClass);
        item.on('mouseover', function () {
            jQuery(this).addClass('active').siblings().removeClass('active');
        });
    });
}

(function($) {
    jQuery(document).ready(function() {
        wglAjaxLoad();
    });

    function wglAjaxLoad() {
        var i, section;
        var sections = document.getElementsByClassName('wgl_cpt_section');
        for (i = 0; i < sections.length; i++) {
            section = sections[i];
            var infinity_item = section.getElementsByClassName('infinity_item');
            var load_more = section.getElementsByClassName('load_more_item');
            if (infinity_item.length || load_more.length) {
                wglAjaxInit(section);
            }
        }
    }

    var wait_load = false;
    var offset_items = 0;
    var js_offset;

    function wglAjaxQuery(grid, section, request_data) {
        if (wait_load) return;
        wait_load = true;
        request_data['offset_items'] = request_data.js_offset
            ? request_data.js_offset
            : offset_items;

        request_data['remainings_loading_btn_items_amount'] = request_data.remainings_loading_btn_items_amount;

        request_data['js_offset'] = request_data.js_offset
            ? request_data.js_offset
            : offset_items;

        // For the mode_security enabled, removed sql request
        if (request_data.query && request_data.query.request) {
            delete request_data.query.request;
        }

        $.post(
            wgl_core.ajaxurl,
            {
                action: 'wgl_ajax',
                data: request_data,
                nonce: wgl_core.nonce
            },
            function(response, status) {
                var resp, new_items, load_more_hidden, count_products;
                resp = document.createElement('div');
                resp.innerHTML = response;
                new_items = $('.item', resp);
                count_products = $('.woocommerce-result-count', resp);

                load_more_hidden = $('.hidden_load_more', resp);

                if (load_more_hidden.length) {
                    jQuery(section)
                        .find('.load_more_wrapper')
                        .fadeOut(300, function() {
                            $(this).remove();
                        });
                } else {
                    jQuery(section)
                        .find('.load_more_wrapper .load_more_item')
                        .removeClass('loading');
                }

                jQuery(section)
                    .find('.woocommerce-result-count')
                    .html(jQuery(count_products).html());

                if ($(grid).hasClass('carousel')) {
                    $(grid)
                        .find('.swiper-wrapper')
                        .append(new_items);
                    $(grid)
                        .find('.swiper-pagination')
                        .remove();
                    $(grid)
                        .find('.wgl-carousel_swiper')
                        .update();
                } else if ($(grid).hasClass('grid')) {
                    new_items = new_items.hide();
                    $(grid).append(new_items);
                    new_items.fadeIn('slow');
                    wglCursorInit();
                } else {
                    const $items = jQuery(new_items);
                    const $grid = jQuery(grid);
                    
                    $items.imagesLoaded(() => {
                        $grid.append($items)
                            .isotope('appended', $items)
                            .isotope('reloadItems');
                    
                        $grid.isotope('once', 'arrangeComplete', () => {
                            $grid.isotope('layout');
                        });

                        $grid.isotope('layout');

                        setTimeout(function () {
                            wglScrollAnimation();
                            updateFilter(grid);
                            updateCarousel(grid);
                            wglCursorInit();
                        }, 100);
                    });
                }

                // Call video background settings
                if (typeof jarallax === 'function') {
                    wglParallaxVideo();
                } else {
                    jQuery(grid)
                        .find('.parallax-video')
                        .each(function() {
                            jQuery(this).jarallax({
                                loop: true,
                                speed: 1,
                                videoSrc: jQuery(this).data('video'),
                                videoStartTime: jQuery(this).data('start'),
                                videoEndTime: jQuery(this).data('end')
                            });
                        });
                }

                // Call swiper settings
                updateCarousel(grid);

                wglScrollAnimation();
                // Update Items

                var offset_data = $('.js_offset_items', resp);
                request_data.js_offset = parseInt(offset_data.data('offset'));

                wait_load = false;
            }
        );
    }

    function updateCarousel(grid) {
        if ( jQuery(grid).find('.wgl-carousel_swiper').size() > 0 ) {
            jQuery(grid)
                .find('.wgl-carousel_swiper')
                .each(function() {
                    swiperCarousel(jQuery(this));
                    if (jQuery(grid).hasClass('blog_masonry')) {
                        jQuery(grid).isotope('layout');
                    }
                });
        }
    }

    function wglAjaxInit(section) {
        offset_items = 0;
        var infinity_item;
        var grid, form, data_field, data, request_data, load_more;

        if (section == undefined) {
            return;
        }

        // Get grid CPT
        grid = section.getElementsByClassName('container-grid');
        if (!grid.length) { return; }
        grid = grid[0];

        // Get form CPT
        form = section.getElementsByClassName('posts_grid_ajax');
        if (!form.length) { return; }
        form = form[0];

        // Get field form ajax
        data_field = form.getElementsByClassName('ajax_data');
        if (!data_field.length) { return; }
        data_field = data_field[0];

        data = data_field.value;
        data = JSON.parse(data);
        request_data = data;

        infinity_item = section.getElementsByClassName('infinity_item');

        if (infinity_item.length) {
            infinity_item = infinity_item[0];
            if (jQuery(infinity_item).wglIsVisible()) {
                // Add pagination
                offset_items += request_data.post_count;
                wglAjaxQuery(grid, section, request_data);
            }
            var lastScrollTop = 0;

            jQuery(window).on('resize scroll', function() {
                if (jQuery(infinity_item).wglIsVisible()) {
                    var st = jQuery(this).scrollTop();
                    if (st > lastScrollTop) {
                        // Add pagination
                        offset_items += request_data.post_count;
                        wglAjaxQuery(grid, section, request_data);
                    }
                    lastScrollTop = st;
                }
            });
        }

        load_more = section.getElementsByClassName('load_more_item');
        if (load_more.length) {
            load_more = load_more[0];
            load_more.addEventListener(
                'click',
                function(e) {
                    // Add pagination
                    offset_items += request_data.post_count;
                    e.preventDefault();
                    jQuery(this).addClass('loading');
                    wglAjaxQuery(grid, section, request_data);
                },
                false
            );
        }
    }

    function swiperCarousel(grid) {

        var wglSwiper = {};

        var configData = grid.data('swiper') ? grid.data('swiper') : {};
        var paginationType = configData.paginationType ? configData.paginationType : false;
        var itemID = grid.data('item-carousel') ? '[data-carousel="' + grid.data('item-carousel') + '"]' : '';
        var pagination = undefined !== grid.data('pagination') ? grid.data('pagination') : '.swiper-pagination' + itemID;
        var arrow_next = undefined !== grid.data('arrow-next') ? grid.data('arrow-next') : '.elementor-swiper-button-next' + itemID;
        var arrow_prev = undefined !== grid.data('arrow-prev') ? grid.data('arrow-prev') : '.elementor-swiper-button-prev' + itemID;

        var config = {
            effect: "fade",
            speed: 900,
            navigation: {
                nextEl: arrow_next,
                prevEl: arrow_prev
            },
        };

        if ('undefined' === typeof Swiper) {
            const asyncSwiper = window.elementorFrontend.utils.swiper;
            new asyncSwiper(grid, config).then((newSwiperInstance) => {
                wglSwiper = newSwiperInstance;
                wglSwiper.update();
            });
        } else {
            wglSwiper = new Swiper(grid[0], config);
            wglSwiper.init();
        }
    }

    function updateFilter(grid) {
        jQuery(grid).isotope({ sortBy : 'original-order' });
        jQuery('.isotope-filter a').each(function() {
            var $this = jQuery(this);
            var data_filter = this.getAttribute('data-filter');
            var num;
            
            if ($this.parent().parent().parent().hasClass('course__filter')) {
                num = $this
                    .closest('.wgl-courses')
                    .find('.wgl-course')
                    .filter(dataFilter).length;
            }else if ($this.parent().parent().parent().hasClass('product__filter')) {
                num = $this
                    .closest('.wgl-products-grid')
                    .find('.product')
                    .filter(data_filter).length;
                $this
                    .find('.filter_counter')
                    .text(num);
            } else {
                num = $this
                    .closest('.wgl-portfolio')
                    .find('.portfolio__item')
                    .filter(data_filter).length;
                $this
                    .find('.filter_counter')
                    .text(num);
            }

            if (
                num !== 0
                && $this.hasClass('empty')
            ) {
                $this.removeClass('empty').addClass('swiper-slide').parent().parent().trigger('slides_added');
            }
        });
    }
})(jQuery);

function wglScrollAnimation() {
    let portfolio = jQuery('.wgl-portfolio_container.appear-animation'),
        gallery = jQuery('.wgl-gallery_items.appear-animation'),
        shop = jQuery('.wgl-products.appear-animation, .wgl-carousel.appear-animation');

    //Scroll Animation
    (function ($) {

        var docElem = window.document.documentElement;

        function getViewportH() {
            var client = docElem['clientHeight'],
                inner = window['innerHeight'];

            if (client < inner)
                return inner;
            else
                return client;
        }

        function scrollY() {
            return window.pageYOffset || docElem.scrollTop;
        }

        // http://stackoverflow.com/a/5598797/989439
        function getOffset(el) {
            var offsetTop = 0, offsetLeft = 0;
            do {
                if (!isNaN(el.offsetTop)) {
                    offsetTop += el.offsetTop;
                }
                if (!isNaN(el.offsetLeft)) {
                    offsetLeft += el.offsetLeft;
                }
            } while (el = el.offsetParent)

            return {
                top: offsetTop,
                left: offsetLeft
            }
        }

        function inViewport(el, h) {
            var elH = el.offsetHeight,
                scrolled = scrollY(),
                viewed = scrolled + getViewportH(),
                elTop = getOffset(el).top,
                elBottom = elTop + elH,
                h = h || 0;

            return (elTop + elH * h) <= viewed && (elBottom - elH * h) >= scrolled;
        }

        function extend(a, b) {
            for (var key in b) {
                if (b.hasOwnProperty(key)) {
                    a[key] = b[key];
                }
            }
            return a;
        }

        function AnimOnScroll(el, options) {
            this.el = el;
            this.options = extend(this.defaults, options);
            if (this.el.length) {
                this._init();
            }
        }

        AnimOnScroll.prototype = {
            defaults: {
                viewportFactor: 0
            },
            _init: function () {
                this.items = Array.prototype.slice.call(jQuery(this.el).children());
                this.itemsCount = this.items.length;
                this.itemsRenderedCount = 0;
                this.didScroll = false;
                this.delay = 100;


                var self = this;

                if (typeof imagesLoaded === 'function') {
                    imagesLoaded(this.el, this._imgLoaded(self));
                } else {
                    this._imgLoaded(self);
                }

            },
            _imgLoaded: function (self) {

                var interval;

                // the items already shown...
                self.items.forEach(function (el, i) {
                    if (inViewport(el)) {

                        self._checkTotalRendered();
                        if (!jQuery(el).hasClass('show') && !jQuery(el).hasClass('animate') && inViewport(el, self.options.viewportFactor)) {
                            self._itemClass(jQuery(el), self.delay, interval);
                            self.delay += 200;
                            setTimeout(function () {
                                self.delay = 100;
                            }, 200);
                        }
                    }
                });

                // animate on scroll the items inside the viewport
                window.addEventListener('scroll', function () {
                    self._onScrollFn();
                }, false);
                window.addEventListener('resize', function () {
                    self._resizeHandler();
                }, false);
            },

            _onScrollFn: function () {
                var self = this;
                if (!this.didScroll) {
                    this.didScroll = true;
                    setTimeout(function () {
                        self._scrollPage();
                    }, 60);
                }
            },
            _itemClass: function (item_array, delay, interval) {

                interval = setTimeout(function () {
                    if (item_array.length) {
                        jQuery(item_array).addClass('animate');
                    } else {
                        clearTimeout(interval);
                    }
                }, delay);

            },

            _scrollPage: function () {
                var self = this;
                var interval;

                this.items.forEach(function (el, i) {
                    if (!jQuery(el).hasClass('show') && !jQuery(el).hasClass('animate') && inViewport(el, self.options.viewportFactor)) {
                        setTimeout(function () {
                            var perspY = scrollY() + getViewportH() / 2;

                            self._checkTotalRendered();
                            self._itemClass(jQuery(el), self.delay, interval);
                            self.delay += 200;
                            setTimeout(function () {
                                self.delay = 100;
                            }, 200);

                        }, 25);
                    }
                });
                this.didScroll = false;
            },
            _resizeHandler: function () {
                var self = this;

                function delayed() {
                    self._scrollPage();
                    self.resizeTimeout = null;
                }

                if (this.resizeTimeout) {
                    clearTimeout(this.resizeTimeout);
                }
                this.resizeTimeout = setTimeout(delayed, 1000);
            },
            _checkTotalRendered: function () {
                ++this.itemsRenderedCount;
                if (this.itemsRenderedCount === this.itemsCount) {
                    window.removeEventListener('scroll', this._onScrollFn);
                }
            }
        }

        // add to global namespace
        window.AnimOnScroll = AnimOnScroll;

    })(jQuery);

    new AnimOnScroll(portfolio, {});
    new AnimOnScroll(gallery, {});

    if (shop.length) {
        shop.each(function () {
            let $this = jQuery(this);
            if ($this.find('.swiper-wrapper').length) {
                new AnimOnScroll($this.find('.swiper-wrapper'), {});
            } else {
                new AnimOnScroll($this, {});
            }
        })
    }
}

jQuery(document).on("berocket_ajax_products_loaded", wglScrollAnimation);
function wglAppear(item) {
    let widgetSelector = '.hotspots__container.appear_animation .hotspots__item',
        widgetEl = item ? jQuery(item).find(widgetSelector) : jQuery(widgetSelector);

    widgetEl.each(function () {
        jQuery(this).appear(() => jQuery(this).addClass('appeared'));
    });
}

// Scroll Up button
function wglScrollUp() {
    (function($) {
        $.fn.goBack = function(options) {
            var defaults = {
                scrollTop: jQuery(window).height(),
                scrollSpeed: 600,
                fadeInSpeed: 1000,
                fadeOutSpeed: 500
            };
            var options = $.extend(defaults, options);
            var $this = $(this);
            $(window).on('scroll', function() {
                if ($(window).scrollTop() > options.scrollTop) {
                    $this.addClass('active');
                } else {
                    $this.removeClass('active');
                }
            });
            $this.on('click', function() {
                $('html,body').animate(
                    {
                        scrollTop: 0
                    },
                    options.scrollSpeed
                );
            });
        };
    })(jQuery);

    jQuery('#scroll_up').goBack();
}

function wglBlogMasonryInit() {
    var blog = jQuery('.blog-posts > .masonry, .event_masonry');
    if (blog.length) {
        var blog_dom = blog.get(0);
        var $grid = imagesLoaded(blog_dom, function () {
            // initialize masonry
            //* Wrapped in a short timeout function because $grid.imagesLoaded doesn't reliably lay out correctly
            setTimeout(function(){
                blog.isotope({
                    layoutMode: 'masonry',
                    masonry: {
                        columnWidth: '.item',
                    },
                    itemSelector: '.item',
                    percentPosition: true
                });
                jQuery(window).trigger('resize');
            }, 250);
        });
    }
}
function wglButton() {

    (function ($) {
        const magneticButton = $('.has-magnetic .wgl-button, .has-magnetic .wpcf7-submit');

        function updateMagneticEffect(e) {
            const mouseX = e.pageX;
            const mouseY = e.pageY;

            magneticButton.each(function () {
                const magneticButton = $(this);
                const magneticWrapper = $(this).closest('.has-magnetic');

                let magneticStrength,
                    magneticStrong;

                if (magneticButton.hasClass('wgl-button')){
                    magneticStrength = magneticButton.data('magnetic-threshold') ?? 500;
                    magneticStrong = magneticButton.data('magnetic-strong') ?? 0.5;
                }else{
                    magneticStrength = magneticWrapper.data('magnetic-threshold') ?? 500;
                    magneticStrong = magneticWrapper.data('magnetic-strong') ?? 0.5;
                }

                const targetX = magneticButton.offset().left + magneticButton.width() / 2;
                const targetY = magneticButton.offset().top + magneticButton.height() / 2;

                const deltaX = mouseX - targetX;
                const deltaY = mouseY - targetY;

                const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

                if (distance < magneticStrength) {
                    const angle = Math.atan2(deltaY, deltaX);
                    const magnetX = targetX + Math.cos(angle) * distance * magneticStrong;
                    const magnetY = targetY + Math.sin(angle) * distance * magneticStrong;

                    magneticButton.css('transform', `translate(${Math.round(magnetX - targetX)}px, ${Math.round(magnetY - targetY)}px)`);
                } else {
                    magneticButton.css('transform', 'translate(0, 0)');
                }
            });
        }

        // Initial setup
        updateMagneticEffect({ pageX: 0, pageY: 0 });

        // Event listeners
        $(document).on('mousemove', updateMagneticEffect);
        $(window).on('resize', function () {
            // Update the magnetic effect on window resize
            updateMagneticEffect({ pageX: 0, pageY: 0 });
        });

    })(jQuery);

}

// WGL Carousel
function wglCarouselSwiper(item) {
    const carousel_2D = jQuery(item || document).find('.wgl-carousel_swiper[data-item-carousel]'),
        carousel_3D = jQuery(item || document).find('.wgl-carousel.animation-style-3d');

    if (carousel_2D.length) {
        carousel_2D.each(function (item, value) {
            const swiperContainer = jQuery(this),
                itemID = jQuery(this).data('item-carousel') ? '[data-carousel="' + jQuery(this).data('item-carousel') + '"]' : '',
                effect = jQuery(this).hasClass('fade_swiper') ? 'fade' : 'slide';

            const configData = jQuery(this).data('swiper') ? jQuery(this).data('swiper') : {},
                direction = configData.direction ? configData.direction : 'horizontal',
                speed = configData.slidesTransition ? configData.slidesTransition : 800,
                autoplay = configData.autoplaySpeed ? configData.autoplaySpeed : 3000,
                linearAnimation = configData.linearAnimation ? configData.linearAnimation : false,
                autoplayEnable = configData.autoplay ? configData.autoplay : false,
                adaptiveHeight = 'vertical' === direction ? true : configData.adaptiveHeight ? configData.adaptiveHeight : false,
                loop = configData.infinite ? configData.infinite : false,
                pause_on_hover = configData.autoplayPause ? configData.autoplayPause : false,
                centeredSlides = configData.centerMode ? configData.centerMode : false,
                mousewheel = configData.mousewheel ? configData.mousewheel : false,
                freeMode = configData.freeMode ? configData.freeMode : false,
                reverseDirection = configData.autoplayReverse ? configData.autoplayReverse : false,
                variableWidth = configData.variableWidth;

            const dynamicBullets = configData.dynamicBullets ? configData.dynamicBullets : false,
                pagination = swiperContainer.data('pagination') !== undefined ? swiperContainer.data('pagination') : '.swiper-pagination' + itemID,
                arrow_next = swiperContainer.data('arrow-next') !== undefined ? swiperContainer.data('arrow-next') : '.elementor-swiper-button-next' + itemID,
                arrow_prev = swiperContainer.data('arrow-prev') !== undefined ? swiperContainer.data('arrow-prev') : '.elementor-swiper-button-prev' + itemID;

            let pagination_type = 'bullets';
            if (swiperContainer.hasClass('pagination_fraction')){
                pagination_type = 'fraction';
            }else if(swiperContainer.hasClass('pagination_progress')){
                pagination_type = 'progressbar';
            }

            let config = {
                direction: direction,
                loop: 'vertical' === direction || linearAnimation ? true : loop,
                speed: speed,
                effect: effect,
                slidesPerView: !!variableWidth || 'vertical' === direction ? 'auto' : 1,
                slidesPerGroup: 1,
                watchOverflow: true,
                autoHeight: adaptiveHeight,
                grabCursor: false,
                paginationClickable: true,
                centeredSlides: centeredSlides,
                autoplay: {
                    delay: linearAnimation ? 0 : autoplay,
                    reverseDirection: reverseDirection,
                },
                pagination: {
                    el: pagination,
                    clickable: true,
                    type: pagination_type,
                    dynamicBullets: dynamicBullets,
                    formatFractionCurrent: (index) => index > 9 ? '' + index: '0' + index,
                    formatFractionTotal: (index) => index > 9 ? '' + index: '0' + index,
                    renderBullet: (index, className) => '<li class="' + className + '" role="presentation"><button type="button" role="tab" tabindex="-1">' + (index + 1) + '</button></li>',
                },
                navigation: {
                    nextEl: arrow_next,
                    prevEl: arrow_prev
                },
                breakpoints: {},
                autoplayEnable: !linearAnimation ? autoplayEnable : true,
                pause_on_hover: !linearAnimation ? pause_on_hover : false,
                freeMode: freeMode,
                simulateTouch: !linearAnimation,
            };

            if (jQuery(this).hasClass('fade_swiper')) {
                config.fadeEffect = {
                    crossFade: true
                };
            }

            if (!!mousewheel) {
                config.mousewheel = {
                    releaseOnEdges: true,
                };
            }

            if (configData.responsive && 'vertical' !== direction) {
                let obj = {
                    0: {
                        slidesPerView: 1,
                        slidesPerGroup: 1,
                        spaceBetween: 20
                    }
                };
                configData.responsive.forEach(function (item) {
                    if (item.breakpoint) {
                        obj[item.breakpoint] = {
                            slidesPerView: !!variableWidth ? 'auto' : parseInt(item.slidesToShow),
                            slidesPerGroup: parseInt(item.slidesToScroll) ?? 1,
                        };

                        if (item.gap) {
                            obj[item.breakpoint].spaceBetween = parseInt(item.gap);
                        }
                    }
                });

                config.breakpoints = obj;
            }

            wglInitSwiper(swiperContainer, config);
        });
    }

    /* @see https://3dtransforms.desandro.com/carousel */
    if (carousel_3D.length) {
        carousel_3D.each(function () {
            const container = jQuery(this),
                carousel_wrapper = container.find('.wgl-carousel_wrap'),
                cells = carousel_wrapper.find('.testimonials__wrapper, .wgl-item'),
                direction = container.hasClass('animation-direction-vertical') ? 'rotateX' : 'rotateY';

            let cell,
                cellCount = cells.length,
                cellHeight = carousel_wrapper.outerHeight(),
                angle,
                cellAngle,
                currentCell,
                selectedIndex = 0,
                radius,
                theta;

            function initHeightCarousel() {
                if ('rotateY' === direction) {
                    let maxHeight = 0;
                    cells.each(function () {
                        let thisH = jQuery(this).outerHeight();
                        if (thisH > maxHeight) {
                            maxHeight = thisH;
                        }
                    });
                    container.css({'height': maxHeight});
                }
            }
            initHeightCarousel();

            function rotateCarousel() {
                angle = theta * selectedIndex * -1;
                carousel_wrapper.css({ 'transform': 'translateZ(' + -radius + 'px) ' + direction + '(' + angle + 'deg)' });
            }

            container.find('.motion-prev').on('click', function () {
                throttleFunction(changeCarousel_prev, 200)
            });
            container.find('.motion-next').on('click', function () {
                throttleFunction(changeCarousel_next, 200)
            });

            function changeCarousel_prev() {
                selectedIndex--;
                changeCarousel(selectedIndex);
            }
            function changeCarousel_next() {
                selectedIndex++;
                changeCarousel(selectedIndex);
            }

            if (container.hasClass('animated-by-mouse-wheel')) {
                container.on('wheel', function (e) {
                    if (e.originalEvent.deltaY < 0) throttleFunction(changeCarousel_next, 400);
                    else throttleFunction(changeCarousel_prev, 400);
                    e.preventDefault ? e.preventDefault() : (e.returnValue = false);
                });
            }

            function changeCarousel() {
                cells.removeClass('active current next prev');
                theta = 360 / cellCount;

                if ('rotateX' === direction) {
                    radius = Math.round(
                        (cellHeight / cellCount) * 0.7 * Math.sqrt(cellCount / 1.5)
                    );
                } else {
                    if (jQuery('#main').width() <= 992) {
                        radius = Math.round(
                            (cellHeight / cellCount) * 0.5 * Math.sqrt(cellCount / 1.2)
                        );
                    } else {
                        radius = Math.round(
                            (cellHeight / cellCount) * 1.3 * Math.sqrt(cellCount / 1.2)
                        );
                    }
                }

                cells.each(function (i) {
                    cell = jQuery(this);
                    cellAngle = theta * i;
                    angle = (theta * selectedIndex * -1) + cellAngle;
                    cell.css({ 'transform': direction + '(' + cellAngle + 'deg) translateZ(' + radius + 'px)' + direction + '(' + (angle * -1) + 'deg) ' });

                    if (selectedIndex < 0) {
                        currentCell = cellCount - (Math.abs(selectedIndex + 1) % cellCount) - 1;
                    } else {
                        currentCell = selectedIndex % cellCount;
                    }

                    if (currentCell === i) {
                        cell.addClass('active current');
                        if (currentCell === 0) cells.last().addClass('active prev');
                        if (currentCell === cellCount - 1) cells.first().addClass('active next');
                    } else if (i === (currentCell - 1)) {
                        cell.addClass('active prev')
                    } else if (i === (currentCell + 1)) {
                        cell.addClass('active next')
                    }
                });

                rotateCarousel();

                cells.children().off();
                container.find('.prev').children().on('click', changeCarousel_prev);
                container.find('.next').children().on('click', changeCarousel_next);
            }

            function throttleFunction(func, interval) {
                if (!func.lastRunTime || func.lastRunTime < Date.now() - interval) {
                    func.lastRunTime = Date.now();

                    return func.apply(arguments);
                }
            }

            // set initials
            changeCarousel();
            jQuery(window).resize(function () {
                initHeightCarousel();
                changeCarousel();
            });
        });
    }
}

function wglInitSwiper(swiperContainer, config) {
    if (
        window.elementorFrontend
        && window.elementorFrontend.utils
        && window.elementorFrontend.utils.swiper
    ) {
        const asyncSwiper = window.elementorFrontend.utils.swiper;
        new asyncSwiper(swiperContainer, config).then((newSwiperInstance) => {
            wglSwiperControl(newSwiperInstance, swiperContainer, config);
        });
    } else if ('undefined' !== typeof Swiper) {
        let wglSwiper = new Swiper(swiperContainer[0], config);
        wglSwiperControl(wglSwiper, swiperContainer, config);

        if (!!config.autoHeight){
            setTimeout(() => wglSwiper.updateAutoHeight(true), 500);
        }
    }
}

function wglSwiperControl(element, swiperContainer, config){
    if (!config.autoplayEnable) {
        element.autoplay.stop();
    }

    if (config.pause_on_hover && config.autoplayEnable) {
        swiperContainer.on('mouseenter', function () {
            element.autoplay.stop();
        });
        swiperContainer.on('mouseleave', function () {
            element.autoplay.start();
        });
    }
}

function wglCircuitService() {
    if (jQuery('.wgl-circuit-service').length) {
      jQuery('.wgl-circuit-service').each(function(){
        var $circle = jQuery(this).find('.wgl-services_icon-wrap');

        var agle = 360 / $circle.length;
        var agleCounter = -1;

        $circle.each(function() {
          var $this = jQuery(this);

          jQuery(this).parents('.wgl-services_item:first-child').addClass('active');
          $this.on('mouseover', function(){
            jQuery(this).parents('.wgl-services_item').addClass('active').siblings().removeClass('active');
          })

          var percentWidth = (100 * parseFloat($this.css('width')) / parseFloat($this.parent().css('width')));
          var curAgle = agleCounter * agle;
          var radAgle = curAgle * Math.PI / 180;
          var x = (50 + ((50 - (percentWidth / 2)) * Math.cos(radAgle))) - (percentWidth / 2);
          var y = (50 + ((50 - (percentWidth / 2)) * Math.sin(radAgle))) - (percentWidth / 2);

          $this.css({
            left: x + '%',
            top: y + '%'
          });

          agleCounter++;
        });

      });
    }
}
// WGL Content Min Height
function wglContentMinHeight() {
    var header = jQuery('header.wgl-theme-header'),
        footer = jQuery('footer.footer'),
        pt = jQuery('.page-header'),
        header_height = 0,
        footer_height = 0,
        pt_height = 0;
    if (header.length) {
        header_height = header.outerHeight(true);
        document.querySelector('html').style.setProperty('--header-height', header_height + 'px');
    }
    if (footer.length) {
        footer_height = footer.outerHeight(true);
        document.querySelector('html').style.setProperty('--footer-height', footer_height + 'px');
    }
    if (pt.length) {
        pt_height = pt.outerHeight(true);
        document.querySelector('html').style.setProperty('--pt-height', pt_height + 'px');
    }
}

// wgl Countdown function init
function wglCountdownInit () {
    var countdown = jQuery('.wgl-countdown');
    if (countdown.length !== 0 ) {
        countdown.each(function () {
            var data_atts = jQuery(this).data('atts');
            var time = new Date(+data_atts.year, +data_atts.month-1, +data_atts.day, +data_atts.hours, +data_atts.minutes);
            jQuery(this).countdown({
                until: time,
                padZeroes: true,
                 digits: [
                 '<span>0</span>',
                 '<span>1</span>',
                 '<span>2</span>',
                 '<span>3</span>',
                 '<span>4</span>',
                 '<span>5</span>',
                 '<span>6</span>',
                 '<span>7</span>',
                 '<span>8</span>',
                 '<span>9</span>',
                 ],
                format: data_atts.format ? data_atts.format : 'yowdHMS',
                labels: [data_atts.labels[0],data_atts.labels[1],data_atts.labels[2],data_atts.labels[3],data_atts.labels[4],data_atts.labels[5], data_atts.labels[6], data_atts.labels[7]],
                labels1: [data_atts.labels[0],data_atts.labels[1],data_atts.labels[2], data_atts.labels[3], data_atts.labels[4], data_atts.labels[5], data_atts.labels[6], data_atts.labels[7]]
            });
        });
    }
}
// WGL Counter
function wglCounterInit() {
    let counters = jQuery('.wgl-counter__value');
    if (counters.length) {
        counters.appear(function() {
            let from = jQuery(this).data('start-value'),
                max = jQuery(this).data('end-value'),
                speed = jQuery(this).data('speed'),
                sep = jQuery(this).data('sep');

            jQuery(this).countTo({
                from: from,
                to: max,
                speed: speed,
                refreshInterval: 10,
                separator: sep
            });
        });
    }
}
// WGL Cursor Message
jQuery(window).on('elementor/frontend/init', function() {
    wglSectionCursor();
});

function wglCursorInit() {
    var $device_mode = jQuery('body').attr('data-elementor-device-mode');
    if ($device_mode !== 'desktop' && $device_mode !== 'laptop' && $device_mode !== 'widescreen') {
        return;
    }

    var cursorPointerWrap = jQuery('#wgl-cursor');
    var cursorPointer = jQuery('#wgl-cursor-pointer');
    var cursorFollower = jQuery('#wgl-cursor-pointer-follower');
    var cursorText = jQuery('.wgl-cursor-text');

    if('object' === typeof gsap && cursorPointerWrap.length){
        gsap.set([cursorPointerWrap, cursorFollower], {
            xPercent: -50,
            yPercent: -50
        });

        const movePointerX = gsap.quickTo(cursorPointerWrap, "x", { duration: 0.35, ease: "power4" });
        const movePointerY = gsap.quickTo(cursorPointerWrap, "y", { duration: 0.35, ease: "power4" });

        const moveFollowerX = gsap.quickTo(cursorFollower, "x", { duration: 0.9, ease: "power4" });
        const moveFollowerY = gsap.quickTo(cursorFollower, "y", { duration: 0.9, ease: "power4" });

        window.addEventListener('mousemove', (e) => {
            let cursorDuration = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--verdaagro-cursor-duration').trim()) || 0.35;
            let duration = parseFloat(jQuery(cursorPointer).css('--duration')) || cursorDuration;

            let cursorFollowerDuration = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--verdaagro-cursor-follower-duration').trim()) || 0.9;
            let durationFollower = parseFloat(jQuery(cursorFollower).css('--duration')) || cursorFollowerDuration;

            let cursorAnimation = getComputedStyle(document.documentElement).getPropertyValue('--verdaagro-cursor-link-animation').trim();

            let animProp = jQuery(cursorPointer).css('--animation');
            let linkAnimation;

            if (typeof animProp !== 'undefined') {
                linkAnimation = animProp.trim() === 'yes';
            } else {
                linkAnimation = cursorAnimation;
            }

            const { target, x, y } = e;
            const isTargetLinkOrBtn = target && (
                target.closest('a') ||
                target.closest('button') ||
                (target.closest('[role="button"]'))
            );

            movePointerX(x);
            movePointerY(y);
            moveFollowerX(x);
            moveFollowerY(y);

            gsap.to(cursorPointerWrap, {
                duration: duration,
                opacity: linkAnimation && isTargetLinkOrBtn ? 0.6 : 1,
                scale: linkAnimation && isTargetLinkOrBtn ? 1.2 : 1,
                overwrite: 'auto'
            });

            gsap.to(cursorFollower, {
                duration: durationFollower,
                opacity: linkAnimation && isTargetLinkOrBtn ? 0.6 : 1,
                scale: linkAnimation && isTargetLinkOrBtn ? 1.4 : 1,
                overwrite: 'auto'
            });
        });
    }else{
        jQuery(document).on('pointermove mousemove', function (e) {
            cursorPointerWrap.css("transform", `translate(-50%,-50%) opacity:1 translate3d(${e.clientX}px, ${e.clientY}px , 0)`);
            cursorFollower.css("transform", `translate(-50%,-50%) opacity:1 translate3d(${e.clientX}px, ${e.clientY}px , 0)`);
        }); 
    }

    if (cursorText.length) {
        cursorText.each(function() {
            var $this = jQuery(this),
                append = wglCursorAppend($this),
                cursorColorBg = $this.attr('data-cursor-color-bg'),
                cursorSize = $this.attr('data-cursor-size'),
                cursorFollowerColorBg = $this.attr('data-cursor-follower-color-bg'),
                cursorFollowerSize = $this.attr('data-cursor-follower-size'),
                cursorEvent = $this.attr('data-cursor-event'),
                cursorDuration = $this.attr('data-cursor-duration'),
                cursorFollowerDuration = $this.attr('data-cursor-follower-duration'),
                linkAnimation = $this.attr('data-cursor-link-animation'),
                cursorEventHtml = '';

            if ( $this.hasClass('additional-cursor') ) {
                $this = $this.parent()
            }

            if (cursorEvent) {
                cursorEventHtml = jQuery(cursorEvent);
            } else {
                cursorEventHtml = $this;
            }

            const appendElement = 'undefined' !== jQuery.type(append) && '' !== jQuery.type(append);
            let timerId;

            cursorEventHtml.on('mouseenter', function () {
                if (appendElement) {
                    cursorPointer
                        .empty()
                        .append(jQuery(append))
                    timerId = setTimeout(() => {
                        cursorPointer.addClass('visible');
                        cursorFollower.addClass('visible');
                        cursorPointer.css('--animation',linkAnimation);
                    }, 20);
                }else{
                    cursorPointer.css('color',cursorColorBg);
                    cursorPointer.css('--verdaagro-cursor-point-size', cursorSize);
                    cursorPointer.css('--animation',linkAnimation);

                    cursorFollower.css('--verdaagro-cursor-follower-size',cursorFollowerSize);
                    cursorFollower.css('--verdaagro-cursor-follower-color', cursorFollowerColorBg);
                    cursorFollower.css('--duration', cursorFollowerDuration);
                }
                cursorPointer.css('--duration', cursorDuration);
            }).on('mouseleave', function(e) {
                if (appendElement) {
                    clearTimeout(timerId);
                    cursorPointer.removeClass('visible');
                    cursorFollower.removeClass('visible');
                    jQuery(cursorPointer)[0].style.removeProperty('--animation');
                }else{
                    if ( e.relatedTarget ) {
                        var newTarget = jQuery(e.relatedTarget);
                        if (!newTarget.hasClass('wgl-cursor-text')) {
                            newTarget = newTarget.parents('[data-cursor-color-bg]').eq(0);
                        }
                        if (newTarget.length > 0 && newTarget.hasClass('wgl-cursor-text')) {
							setTimeout( function() {
								newTarget.trigger('mouseenter');
							}, 0 );
                        } else {
                            cursorPointer.css('color','var(--verdaagro-cursor-point-color)');
                            jQuery(cursorPointer)[0].style.removeProperty('--duration');
                            jQuery(cursorPointer)[0].style.removeProperty('--animation');
                            jQuery(cursorPointer)[0].style.removeProperty('--verdaagro-cursor-point-size');
                            jQuery(cursorFollower)[0].style.removeProperty('--verdaagro-cursor-follower-size');
                            jQuery(cursorFollower)[0].style.removeProperty('--verdaagro-cursor-follower-color');
                            jQuery(cursorFollower)[0].style.removeProperty('--duration');
                        }
					}
                }
            })
        })
    }
}

var wglCursorAppend = $this => {

    var custom_class = $this.attr('data-cursor-class') ?? '',
        text = $this.attr('data-cursor-text'),
        image = $this.attr('data-cursor-image'),
        newAppend = [];

    if ( 'undefined' !== jQuery.type(image) ) {
        newAppend = jQuery('<div class="cursor-content cursor-content-image ' + custom_class + '">' + image + '</div>')
    } else if ( 'undefined' !== jQuery.type(text) ) {
        newAppend = jQuery('<div class="cursor-content cursor-content-text ' + custom_class + '">' + text + '</div>')
    }

    return newAppend[0];

}

function wglSectionCursor(){
    window.elementorFrontend.hooks.addAction('frontend/element_ready/section', wglCursorElementor);
    window.elementorFrontend.hooks.addAction('frontend/element_ready/container', wglCursorElementor);

    function wglCursorElementor( $scope ){
        return $scope.each(function () {
            let self = jQuery(this),
                itemId =  jQuery(this).data('id');

            let settings = {},
                hasProperty = false,
                arr = [],
                tooltip_bg = '',
                cursor_prop = '';

            let init = function(){
                if (!window.elementorFrontend.isEditMode()) {
                    settings = wgl_section_settings[0][itemId];

                    hasProperty = checkEnabledCursor(settings);

                    settings = wgl_section_settings[0];

                } else {
                    if (!window.elementor.elements &&
                        !window.elementor.elements.models
                    ) {
                        return;
                    }

                    window.elementor.elements.models.forEach(function (value) {
                        if (itemId === value.id) {
                            settings = value.attributes.settings.attributes;
                            arr[value.id] = value.attributes.settings.attributes;
                        }
                    });

                    hasProperty = checkEnabledCursor(settings);
                    settings = arr;
                }

                settings = settings[jQuery(self).data('id')]
                if (hasProperty) {

                    if (jQuery('#wgl-cursor').length === 0) {
                        jQuery('body').append('<div id="wgl-cursor"><div id="wgl-cursor-pointer"></div></div><div id="wgl-cursor-pointer-follower"></div>');
                    }
                    var $self = jQuery(self);
                    $self.addClass('wgl-cursor-text');

                    if ('custom' === settings['cursor_tooltip_type']) {
                        let $attr = '<h6>' + (settings['tooltip_text'] ?? '') + '</h6>';
                        $self.attr('data-cursor-text', $attr)
                        if (settings['cursor_tooltip_bg']) {
                            tooltip_bg = ' tooltip_bg';
                        }
                        $self.removeAttr('data-cursor-image data-cursor-color-bg data-cursor-size data-cursor-follower-color-bg data-cursor-follower-size data-cursor-follower-duration data-cursor-link-animation data-cursor-duration');
                    } else if ('image' === settings['cursor_tooltip_type']) {
                        settings['cursor_thumbnail']['url'].length ? $self.attr('data-cursor-image', '<img src=\'' + settings['cursor_thumbnail']['url'] + '\' alt=\'' + settings['cursor_thumbnail']['alt'] + '\'>') : '';
                        $self.removeAttr('data-cursor-text data-cursor-color-bg data-cursor-size data-cursor-follower-color-bg data-cursor-follower-size data-cursor-follower-duration data-cursor-link-animation data-cursor-duration');
                    } else if ('simple' === settings['cursor_tooltip_type']) {
                        settings['cursor_color_bg'].length ? $self.attr('data-cursor-color-bg', settings['cursor_color_bg']) : '';
                        settings['cursor_size'] && settings['cursor_size'].size ? $self.attr('data-cursor-size', settings['cursor_size'].size + 'px') : '';
                        
                        settings['cursor_follower_color_bg'].length ? $self.attr('data-cursor-follower-color-bg', settings['cursor_follower_color_bg']) : '';
                        settings['cursor_follower_size'] && settings['cursor_follower_size'].size ? $self.attr('data-cursor-follower-size', settings['cursor_follower_size'].size + 'px') : '';
                        settings['cursor_follower_duration'] ? $self.attr('data-cursor-follower-duration', settings['cursor_follower_duration']) : '';
                        $self.removeAttr('data-cursor-image data-cursor-text');
                    }

                    $self.attr('data-cursor-link-animation', settings['cursor_link_animation'] || 'no');

                    if(settings['tooltip_duration']){
                        $self.attr('data-cursor-duration', settings['tooltip_duration']) 
                    }
                    if (settings['cursor_prop']) {
                        cursor_prop = ' cursor_center';
                        $self.attr('data-cursor-prop', 'none');
                    }
                    $self.attr('data-cursor-class', 'wgl-element-' + itemId + ' cursor-from-js' + tooltip_bg + cursor_prop);

                    if (window.elementorFrontend.isEditMode()) {
                        wglCursorInit();
                    }
                } else {
                    self.off().removeClass('wgl-cursor-text').removeAttr('data-cursor-text data-cursor-image data-cursor-color-bg data-cursor-size data-cursor-follower-color-bg data-cursor-follower-size data-cursor-follower-duration data-cursor-link-animation data-cursor-duration')
                    jQuery('#wgl-cursor-pointer').empty()
                }
            }

            var checkEnabledCursor = function (settings) {
                return !!(settings
                    && settings.hasOwnProperty('cursor_tooltip')
                    && '' !== settings.cursor_tooltip);
            }

            /*Init*/
            init();
        });
    }
}

// WGL Double Heading

function wglInitDblhAppear() {
    let $dblh = jQuery('.elementor-widget-wgl-double-heading.appear_anim-yes');
    $dblh.each(function() {
        jQuery(this).appear(function() {
            jQuery(this).addClass('show_curve');
        });
    });
}
function wglDynamicStyles() {
    var style = jQuery('#verdaagro-footer-inline-css');

    (function ($) {
        $.fn.wglAddDynamicStyles = function () {
            if (this.length === 0) {
                return this;
            }

            return this.each(function () {
                var $style = '',
                    self = jQuery(this);

                var init = function () {
                        $style += self.text();
                        self.remove();
                        appendStyle();
                    },
                    appendStyle = function () {
                        jQuery('head').append('<style>' + $style + '</style>');
                    };

                // Init
                init();
            });
        };
    })(jQuery);

    style.wglAddDynamicStyles();
}

// wgl Filter Swiper
function wglFilterSwiper() {
    let filter_swiper = document.querySelectorAll('.wgl-filter_swiper_wrapper, .tabs-full-width-yes .wgl-tabs_headings-wrap');
    filter_swiper.forEach((slider, index)=>{
        if (window.elementorFrontend) {
            if (window.elementorFrontend.isEditMode()) {
                wglFilterSwiperInit(slider);
            }else{
                elementorFrontend.on('components:init',  () => {wglFilterSwiperInit(slider)});
            }
        }
    });
}

function wglFilterSwiperInit(self) {
    if ('undefined' === typeof Swiper) {
        const asyncSwiper = window.elementorFrontend.utils.swiper;
        new asyncSwiper(self, {
            slidesPerView: 'auto',
            slideActiveClass: 'slide-active',
        }).then((newSwiperInstance) => {
            newSwiperInstance.init();
            jQuery(self).on( 'slides_added', function () {
                newSwiperInstance.update();
            });
        });
    } else {
        const wglSwiper = new Swiper(self, {
            slidesPerView: 'auto',
            slideActiveClass: 'slide-active',
        });
        jQuery(self).on( 'slides_added', function () {
            wglSwiper.update();
        });
    }
}
function wglGalleryAnimation() {
    var image_animation = jQuery('.cursor-image-animation');
    if (!image_animation.length) return;

    gsap.registerPlugin(InertiaPlugin);

    let oldX = 0,
        oldY = 0,
        deltaX = 0,
        deltaY = 0;

    // Helper to clamp numbers
    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    image_animation.each(function () {
        const $root = jQuery(this);

        $root.on('mousemove', function (e) {
            deltaX = e.clientX - oldX;
            deltaY = e.clientY - oldY;

            oldX = e.clientX;
            oldY = e.clientY;
        });

        let motionValue = getComputedStyle($root[0]).getPropertyValue('--motion-cursor-animation');
        motionValue = parseFloat(motionValue.trim());

        $root.children().each(function () {
            const $el = jQuery(this);
            const $image = $el.find('img');

            $el.on('mouseenter', function () {
                const tl = gsap.timeline({
                    onComplete: function () {
                        tl.kill();
                    },
                });

                tl.timeScale(1.2);

                const vx = clamp(deltaX * motionValue, -(motionValue * 10), motionValue * 10);
                const vy = clamp(deltaY * motionValue, -(motionValue * 10), motionValue * 10);

                tl.to($image, {
                    inertia: {
                        x: { velocity: vx, end: 0 },
                        y: { velocity: vy, end: 0 },
                    },
                });

                tl.fromTo(
                    $image,
                    { rotate: 0 },
                    {
                        duration: 0.4,
                        rotate: (Math.random() - 0.5) * 30,
                        yoyo: true,
                        repeat: 1,
                        ease: 'power1.inOut',
                    },
                    '<'
                );
            });
        });
    });
}

//https://gist.github.com/chriswrightdesign/7955464
function mobilecheck() {
    var check = false;
    (function(a){if(/(android|ipad|playbook|silk|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4)))check = true})(navigator.userAgent||navigator.vendor||window.opera);
    return check;
}

//Add Click event for the mobile device
var click = mobilecheck() ? ('ontouchstart' in document.documentElement ? 'touchstart' : 'click') : 'click';

function initClickEvent(){
    click =  mobilecheck() ? ('ontouchstart' in document.documentElement ? 'touchstart' : 'click') : 'click';
}
jQuery(window).on('resize', initClickEvent);

/*
 ** Plugin for counter shortcode
 */
(function($) {
    "use strict";

    $.fn.countTo = function(options) {
        // merge the default plugin settings with the custom options
        options = $.extend({}, $.fn.countTo.defaults, options || {});

        // how many times to update the value, and how much to increment the value on each update
        var loops = Math.ceil(options.speed / options.refreshInterval),
            increment = (options.to - options.from) / loops;

        return $(this).each(function() {
            var _this = this,
                loopCount = 0,
                value = options.from,
                interval = setInterval(updateTimer, options.refreshInterval),
                separator = options.separator;

            function updateTimer() {
                value += increment;
                loopCount++;
                $(_this).html(value.toFixed(options.decimals).toString().replace(/\B(?=(\d{3})+(?!\d))/g, separator));

                if (typeof(options.onUpdate) === 'function') {
                    options.onUpdate.call(_this, value);
                }

                if (loopCount >= loops) {
                    clearInterval(interval);
                    value = options.to;

                    if (typeof(options.onComplete) === 'function') {
                        options.onComplete.call(_this, value);
                    }
                }
            }
        });
    };

    $.fn.countTo.defaults = {
        from: 0,  // the number the element should start at
        to: 100,  // the number the element should end at
        speed: 1000,  // how long it should take to count between the target numbers
        refreshInterval: 100,  // how often the element should be updated
        decimals: 0,  // the number of decimal places to show
        onUpdate: null,  // callback method for every time the element is updated,
        onComplete: null,  // callback method for when the element finishes updating
        separator: ''  // thousand separator
    };
})(jQuery);

/*
 ** Plugin IF visible element
 */
function wglIsVisibleInit (){
  jQuery.fn.wglIsVisible = function (){
    var elementTop = jQuery(this).offset().top;
    var elementBottom = elementTop + jQuery(this).outerHeight();
    var viewportTop = jQuery(window).scrollTop();
    var viewportBottom = viewportTop + jQuery(window).height();
    return elementBottom > viewportTop && elementTop < viewportBottom;
  }
}

/*
 ** Preloader
 */
jQuery(window).load(function(){
    jQuery('#preloader-wrapper').fadeOut();
});
// Highlight Board

function wglHighlightBoardInit() {
    let $highlight_board_init = jQuery('.wgl-highlight-board');
    if ($highlight_board_init.length) {

        $highlight_board_init.each(function() {
            let $this = jQuery(this),
                item = $this.find('.hlb__item'),
                active = $this.find('.active');

            let mouse_timer;
            mouse_timer = setTimeout(function () {
                item.on('mouseenter tap', function(){
                    clearTimeout(mouse_timer);

                    let obj = jQuery(this);
                    if(!obj.hasClass('active')){
                        item.removeClass('active');
                        obj.addClass('active');
                    }
                });
            }, 100);

            if (0 === active.length){
                $this.on('mouseleave', function(){
                    item.removeClass('active');
                });
            }
        })
    }
}

function wglInitHorizontalScroll() {
    const horizontalScrolls = document.querySelectorAll('.elementor-widget-wgl-horizontal-scroll');
    if (!horizontalScrolls.length) return;

    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({
        limitCallbacks: true,
        ignoreMobileResize: false
    });

    horizontalScrolls.forEach(container => {
        const wrapper = container.querySelector('.wgl-horizontal-scroll-wrapper');
        if (!wrapper) return;

        let scrollTween;

        // Parse settings with defaults
        const settings = JSON.parse(wrapper.dataset.result || '{}');
        const {
            id = '',
            distanceLastslide = 0,
            bg_transition = 0,
            opacityScroll = 0,
            opacityVal = 0,
            responsive = 0,
            responsiveWidth = '',
            speed = 4,
            speedTab = speed,
            speedMob = speed,
            distlastslideTab = distanceLastslide,
            distlastslideMob = distanceLastslide
        } = settings;

        const deviceMode = document.body.dataset.elementorDeviceMode;
        const config = {
            scrollSpeed: deviceMode === 'tablet' ? speedTab :
                        deviceMode === 'mobile' ? speedMob : speed,
            distanceLastslide: deviceMode === 'tablet' ? distlastslideTab :
                              deviceMode === 'mobile' ? distlastslideMob : distanceLastslide
        };

        const getSections = gsap.utils.toArray(
            `.wgl-horizontal-scroll-wrapper-${id} .wgl-horizontal_scroll_wrapper > .wgl-horizontal_scroll_item`
        );

        const sectionsWrapper = gsap.utils.toArray(
            `.wgl-horizontal-scroll-wrapper-${id} .wgl-horizontal_scroll_wrapper`
        );

        const parentClasses = wrapper.querySelectorAll(
            '.wgl-horizontal_scroll_wrapper'
        );
        const stickySection = wrapper.parentElement.querySelectorAll('.wgl-sticky-section-scroll');
        let activeSection = 0;

        // Responsive handling
        function handleResponsive() {
            if (responsive && window.innerWidth <= responsiveWidth) {
                wrapper.classList.add('responsive');
                if (parentClasses[0]) parentClasses[0].style.cssText = 'width:unset;display:block';
                return true;
            }

            parentClasses.forEach(parent => parent.style.display = 'flex');
    
            let totalWidth = Array.from(getSections).reduce((sum, section) => {
                let attrName = '';

                if (deviceMode === 'tablet') {
                    attrName = 'data-width-tablet';
                } else if (deviceMode === 'mobile') {
                    attrName = 'data-width-mobile';
                } else {
                    attrName = 'data-width-desktop';
                }

                let widthStr = section.getAttribute(attrName) || section.getAttribute('data-width-desktop') || '100vw';
                let sectionWidthVW = parseFloat(widthStr);

                return sum + sectionWidthVW;
            }, 0);

            if (parentClasses[0]) parentClasses[0].style.width = `${totalWidth}vw`;
            return false;
        }

        // Initialize scroll
        function initScroll() {
            if (handleResponsive()) return;
            if(!getSections.length) return;
            const totalWidth = getSections.reduce((sum, section) => sum + section.clientWidth, 0);
            const scrollVal = -(totalWidth - window.innerWidth) - config.distanceLastslide;
            const scrollWidth = window.innerWidth * config.scrollSpeed;
            
            const isCssTransform = wrapper.classList.contains('css_transform');

            if (scrollTween) { scrollTween.scrollTrigger?.kill(); scrollTween.kill(); scrollTween = null; }
            ScrollTrigger.getAll().forEach(st => {
                if (wrapper.contains(st.trigger)) st.kill();
            });

            gsap.set(getSections, { clearProps: "x,transform" });
            gsap.set(sectionsWrapper, { clearProps: "transform" });

            scrollTween = gsap.to(isCssTransform ? sectionsWrapper : getSections, {
                ...(isCssTransform
                    ? {
                        ease: "power1.inOut",
                    }
                    : {
                        x: scrollVal,
                        ease: "none"
                    }),
                scrollTrigger: {
                    trigger: isCssTransform ? `.wgl-horizontal-scroll-wrapper-${id}` : `.wgl-horizontal-scroll-wrapper-${id} .wgl-horizontal_scroll_wrapper`,
                    start: isCssTransform ? "top bottom" : undefined,
                    end: isCssTransform ? "bottom top" : `+=${scrollWidth}`,
                    pin: !isCssTransform,
                    scrub: isCssTransform ? 0.5 : 1,
                    snap: isCssTransform ? undefined : false,
                    invalidateOnRefresh: true,
                    onRefreshInit: () => {   
                        gsap.set(getSections, { clearProps: "x,transform" });
                        gsap.set(sectionsWrapper, { clearProps: "transform" });
                    },
                    onUpdate: (self) => {
                        const progress = self.progress;
                        sectionsWrapper.forEach(s => s.style.setProperty("--progress", progress.toFixed(5)));
                        activeSection = Math.round(self.progress * (getSections.length - 1));
                        if (opacityScroll) updateOpacity();
                        if (bg_transition) updateBgTransition();
                        wrapper.setAttribute('data-active-slide', activeSection);
                    },
                    onEnter: () => toggleTriggers(true),
                    onEnterBack: () => toggleTriggers(true),
                    onLeave: () => toggleTriggers(false),
                    onLeaveBack: () => toggleTriggers(false)
                }
            });

            ScrollTrigger.refresh(); 
        }

        // Helper functions
        function toggleTriggers(isActive) {
            document.querySelectorAll('.gsap-marker-scroller-end, .gsap-marker-scroller-start, .gsap-marker-end, .gsap-marker-start')
                .forEach(trigger => trigger.style.display = isActive ? 'block' : 'none');
        }

        function updateOpacity() {
            getSections.forEach((section, index) => {
                gsap.to(section, {
                    opacity: index <= activeSection ? 1 : opacityVal,
                    duration: 0.5
                });
            });
        }

        function updateBgTransition() {
            if (!bg_transition) return;

            const closestContainer = wrapper.closest('.e-con, .elementor-section');
            if (!closestContainer) return;

            const bgSections = closestContainer.querySelectorAll(`.wgl-bg-horizontal-scroll-${id} .bg-scroll`);
            if (!bgSections.length) return;

            bgSections.forEach((section, index) => {
                const shouldBeActive = index === activeSection;
                const isActive = section.classList.contains('active');

                if (shouldBeActive && !isActive) {
                    section.classList.add('active');
                    gsap.to(section, { opacity: 1, duration: 0.3, ease: 'power2.inOut' });
                } else if (!shouldBeActive && isActive) {
                    section.classList.remove('active');
                    gsap.to(section, { opacity: 0, duration: 0.3, ease: 'power2.inOut' });
                }
            });
        }

        if (bg_transition) {
            const bgDiv = wrapper.querySelector(`.wgl-bg-horizontal-scroll-${id}`)?.outerHTML;
            if (bgDiv && parentClasses[0]) {
                parentClasses[0].insertAdjacentHTML('afterbegin', bgDiv);
                wrapper.querySelector(`.wgl-bg-horizontal-scroll-${id}`)?.remove();
                setTimeout(() => updateBgTransition(), 100);
            }
        }

        if (stickySection.length) {
            parentClasses[0]?.insertAdjacentHTML('afterbegin', stickySection[0].outerHTML);
            stickySection[0].remove();
        }

        // Remove hidden sections
        function removeHiddenSections() {
            const parent = wrapper.querySelector('.wgl-horizontal_scroll_wrapper');
            if (!parent) return;

            const sections = parent.querySelectorAll(
                '.wgl-horizontal_scroll_item'
            );

            sections.forEach((section, index) => {
                
                const daughters = parent.querySelectorAll('.elementor > .elementor-section, .elementor > .e-con , .elementor > .elementor-inner > .elementor-section-wrap > .elementor-section, .elementor > .elementor-inner > .elementor-section-wrap > .e-con');

                let hasHidden = false;
                daughters.forEach(daughter => {
                    if (daughter.classList.contains(`elementor-hidden-${deviceMode}`)) {
                        hasHidden = true;
                    }
                });

                if (hasHidden) {
                    section.remove();
                    const bgSection = wrapper.querySelectorAll('.bg-scroll')[index];
                    if (bgSection) bgSection.remove();
                }
            });
        }

        removeHiddenSections();
        setTimeout(() => {
            toggleTriggers(false);
            initScroll();
        }, 100);

        window.addEventListener("load", () => {
            ScrollTrigger.refresh(); 
        });

        let resizeTimer;
        window.addEventListener("resize", () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                initScroll();         
                ScrollTrigger.refresh();
            }, 150);
        });
    });
}
// wgl image comparison
function wglImageComparison() {
    var item = jQuery('.wgl-image_comparison.cocoen');
    if (item.length !== 0) {
        item.each(function() {
            jQuery(this).cocoen();
        });
    }
}

// Image Layers
function wglImgLayers() {
    jQuery('.wgl-image-layers').each(function() {
        var container = jQuery(this);
        var initImageLayers = function() {
            container.appear(
                function() {
                    container.addClass('img-layer_animate');
                },
                { done: true }
            );
        };
        initImageLayers();
    });
}

// Images Gallery
function wglImagesGallery() {
    let item = '.wgl-gallery_item-wrapper',
        gallery_masonry = '.gallery-masonry',
        $gallery_justified = jQuery('.gallery-justified'),
        $main = jQuery('#main');

    if (jQuery(gallery_masonry).length) {
        let dom = jQuery(gallery_masonry).get(0),
            iso = jQuery(gallery_masonry).isotope({
            layoutMode: 'masonry',
            percentPosition: true,
            itemSelector: item
        });

        imagesLoaded(dom, function () {
            iso.isotope('layout');
        });

        jQuery(window).on('resize', function () {
            iso.isotope();
        });
    }

    if ($gallery_justified.length) {
        let dom = $gallery_justified.get(0),
            jus = $gallery_justified.justifiedGallery({
            rowHeight: deviceData('height'),
            maxRowHeight: deviceData('max-height'),
            margins: deviceData('gap'),
            lastRow: $gallery_justified.data('last-row'),
            captions: false,
        });

        imagesLoaded(dom, function () {
            jus.justifiedGallery();
        });

        jQuery(window).on('resize', function () {
            jus.justifiedGallery({
                rowHeight: deviceData('height'),
                maxRowHeight: deviceData('max-height'),
                margins: deviceData('gap'),
            });
        });
    }

    function deviceData(option) {
        let data = $gallery_justified.data(option);
        if ($main.width() <= 767) {
            data = $gallery_justified.data('mobile-' + option);
        } else if ($main.width() <= 1024) {
            data = $gallery_justified.data('tablet-' + option);
        }
        return data;
    }
}

// WGL Infinity Carousel

function wglInfinityCarousel(scope = document) {
    const carousels = scope.querySelectorAll('.splide.wgl_splide__wrapper');

    if (!carousels.length) return;

    const breakpointsCfg = (
        elementorFrontend &&
        elementorFrontend.config &&
        elementorFrontend.config.breakpoints
    ) || {};
    const breakpointTablet = typeof breakpointsCfg.lg === 'number' ? breakpointsCfg.lg - 1 : 1200;
    const breakpointMobile = typeof breakpointsCfg.md === 'number' ? breakpointsCfg.md - 1 : 767;

    carousels.forEach(el => {

        const perPage = Number(el.dataset.perpage) || 3;
        const gap = Number(el.dataset.gap) || 0;
        const infinitySpeed = Number(el.dataset.infinitySpeed) || 0.7;
        const infinitySpeedTablet = Number(el.dataset.infinitySpeedTablet) || false;
        const infinitySpeedMobile = Number(el.dataset.infinitySpeedMobile) || false;
        const autoWidthSwitcher = el.dataset.autoWidthSwitcher || false;
        const carouselDirection = el.dataset.carouselDirection || false;
        const height = Number(el.dataset.heightDesktop) || 'auto';
        const heightTablet = Number(el.dataset.heightTablet) || false;
        const heightMobile = Number(el.dataset.heightMobile) || false;
        const breakpoints = {};

        [
            { widthKey: 'breakpointDesktop', perPageKey: 'perpageDesktop', gapKey: 'gapDesktop' },
            { widthKey: 'breakpointTablet', perPageKey: 'perpageTablet', gapKey: 'gapTablet' },
            { widthKey: 'breakpointMobile', perPageKey: 'perpageMobile', gapKey: 'gapMobile' },
        ].forEach(({ widthKey, perPageKey, gapKey }) => {
            const width = Number(el.dataset[widthKey]);
            const perPage = Number(el.dataset[perPageKey]);
            const gap = Number(el.dataset[gapKey]);

            if (!isNaN(width) && width > 0 && !isNaN(perPage) && perPage > 0) {
                const props = { perPage };
                if (!isNaN(gap) && gap >= 0) {
                    props.gap = gap;
                }

                setBreakpointProp(breakpoints, width, props);
            }
        });

        let options = {
            type: 'loop',
            breakpoints: breakpoints,
            autoplay: false, // false important if autoScroll is enabled
            pagination : false,
            arrows: false,
            direction: carouselDirection,
            autoScroll: {
                speed: infinitySpeed,
            },
        };

        if (autoWidthSwitcher) {
            options.autoWidth = true;
        }else{
            options.perPage = perPage;
            options.gap = gap;
        }

        if (carouselDirection === 'ttb') {
            options.autoHeight = true;
            options.height = height;

            if (heightTablet) {
                setBreakpointProp(breakpoints, breakpointTablet, {
                    height: heightTablet,
                });
            }

            if (heightMobile) {
                setBreakpointProp(breakpoints, breakpointMobile, {
                    height: heightMobile,
                });
            }
        }

        if (infinitySpeedTablet) {
            setBreakpointProp(breakpoints, breakpointTablet, {
                autoScroll: { speed: infinitySpeedTablet },
            });
        }

        if (infinitySpeedMobile) {
            setBreakpointProp(breakpoints, breakpointMobile, {
                autoScroll: { speed: infinitySpeedMobile },
            });
        }


        // Render
        const splide = new Splide(el,options);
        splide.mount(window.splide.Extensions);
    });

    function setBreakpointProp(breakpoints, key, newProps) {
        breakpoints[key] = {
            ...(breakpoints[key] || {}),
            ...newProps,
        };
    }
}

function wglIsotope() {
    jQuery('.isotope').each(function () {
        var $isotope = jQuery(this),
            rtl = !jQuery('body').hasClass('rtl');
        var properties = {
            layoutMode: $isotope.hasClass('fit_rows') ? 'fitRows' : 'masonry',
            percentPosition: true,
            originLeft: rtl,
            itemSelector: '.portfolio__item, .listing__item, .item, .product, .wgl-course',
            masonry: {
                columnWidth: '.pf_item_size, .portfolio__item, .listing__item, .item, .product, .wgl-course',
            }
        };

        $isotope.imagesLoaded().isotope(properties);
        wglIsotopeFilterHandler(this);
    });
}

function wglIsotopeFilterHandler(self) {
    var filterNode = jQuery(self).closest('.elementor-widget-container').find('.isotope-filter a');

    filterNode.each(function () {
        var $this = jQuery(this),
            num,
            dataFilter = this.dataset.filter;

       if ($this.parent().parent().parent().hasClass('course__filter')) {
            num = $this
                .closest('.wgl-courses')
                .find('.wgl-course')
                .filter(dataFilter).length;
        }else if ($this.parent().parent().parent().hasClass('product__filter')) {
            num = $this
                .closest('.wgl-products-grid')
                .find('.product')
                .filter(dataFilter).length;
        }
        else if($this.parent().parent().parent().hasClass('listing__filter')) {
            num = $this
                .closest('.wgl-listing')
                .find('.listing__item')
                .filter(dataFilter).length;
        } else if($this.parent().parent().parent().hasClass('event__filter')) {
            num = $this
                .closest('.wgl-events')
                .find('.item')
                .filter(dataFilter).length;
        } else {
            num = $this
                .closest('.wgl-portfolio')
                .find('.portfolio__item')
                .filter(dataFilter).length;
        }
        $this.find('.filter_counter').text(num);

        if (0 === num) {
            // mark empty categories
            $this.addClass('empty').removeClass('swiper-slide').parent().parent().trigger('slides_added');
        }
    });

    filterNode.on('click', function (e) {
        e.preventDefault();
        var $this = jQuery(this);
        $this.addClass('active').siblings().removeClass('active');

        var dataFilter = $this.attr('data-filter'),
            isotopeNode = $this.closest('.elementor-widget-container').find('.isotope');

        isotopeNode.isotope({ filter: dataFilter });

        if (isotopeNode.hasClass('appear-animation')) {
            isotopeNode.find('.portfolio__item').addClass('animate');
        }
    });
}

function wglMenuLavalamp() {
    let lavalamp = jQuery(
        // menu
        '.menu_line_enable > ul'
        // woocommerce
        + ',.wc-tabs'
    );
    lavalamp.each(function () {
        jQuery(this).lavalamp();
    });

    setTimeout(function(){
        jQuery('.wgl-tabs.has-lavalamp .wgl-tabs_headings, .wgl-tabs-horizontal.has-lavalamp .wgl-tabs-horizontal_headings').lavalamp();
    },600);
}

(function($, window) {
    let Lavalamp = function(element, options) {
        this.element = $(element).data('lavalamp', this);
        this.options = $.extend({}, this.options, options);

        this.init();
    };

    Lavalamp.prototype = {
        options: {
            current:
                '.current-menu-ancestor,.current-menu-item,.current-category-ancestor,.current-page-ancestor,.current_page_parent' // menu
                + ',.wgl-tabs_header.active' // wgl-tabs
                + ',.wgl-tabs-horizontal_header_wrap.active' // wgl-horizontal-tabs
                + ',.active', // wc-tabs
            items:
                'li' // menu
                + ',.wgl-tabs_header' // wgl-tabs
                + ',.wgl-tabs-horizontal_header_wrap', // wgl-horizontal-tabs
            bubble: '<div class="lavalamp-object"></div>',
            animation: false,
            blur: $.noop,
            focus: $.noop,
            easing: 'easeInOutCubic', // transition timing function
            duration: '0.6s' // animation duration
        },
        element: null,
        current: null,
        bubble: null,
        _focus: null,
        init: function() {
            let resizeTimer,
                self = this,
                child = self.element.children(
                    'li' // menu
                    + ',.wgl-tabs_header' // wgl-tabs
                    + ',.wgl-tabs-horizontal_header_wrap' // wgl-horizontal-tabs
                );

            this.onWindowResize = function() {
                if (resizeTimer) {
                    clearTimeout(resizeTimer);
                }

                resizeTimer = setTimeout(function() {
                    self.reload();
                }, 100);
            };

            $(window).on('resize.lavalamp', this.onWindowResize);

            $(child).addClass('lavalamp-item');

            if (
                (this.element.hasClass('wgl-tabs_headings')
                    || this.element.parent().hasClass('wgl-tabs_headings'))
                ||
                (this.element.hasClass('wgl-tabs-horizontal_headings')
                    || this.element.parent().hasClass('wgl-tabs-horizontal_headings'))
                ||
                (this.element.hasClass('wc-tabs')
                    || this.element.parent().hasClass('wc-tabs'))

            ) {
                // ↓ Tabs widget
                this.element.on('click.lavalamp', '.lavalamp-item', function() {
                    self._move($(this));
                });
            } else {
                // ↓ Menu
                this.element
                    .on('mouseenter.lavalamp', '.lavalamp-item', function() {
                        self.current.each(function() {
                            self.options.blur.call(this, self);
                        });

                        self._move($(this));
                    })
                    .on('mouseleave.lavalamp', function() {
                        if (self.current.index(self._focus) < 0) {
                            self._focus = null;

                            self.current.each(function() {
                                self.options.focus.call(this, self);
                            });

                            self._move(self.current);
                        }
                    });
            }

            this.bubble = $.isFunction(this.options.bubble)
                ? this.options.bubble.call(this, this.element)
                : $(this.options.bubble).prependTo(this.element);

            self.element.addClass('lavalamp');
            self.element.find('.lavalamp-object').addClass(self.options.easing);

            this.reload();

            setTimeout(function(){
                self.element.addClass("lavalamp_animate")
            },500);
        },
        reload: function() {
            this.current = this.element.children(this.options.current);

            if (this.current.size() === 0) {
                this.current = this.element
                    .children()
                    .not('.lavalamp-object')
                    .eq(0);
            }

            this._move(this.current, false);
        },
        destroy: function() {
            if (this.bubble) {
                this.bubble.remove();
            }

            this.element.off('.lavalamp');
            $(window).off('resize.lavalamp', this.onWindowResize);
        },
        _move: function(el, animate) {
            let pos = el.position(),
                cssProperties;

            if (el.hasClass('wgl-tabs_header') || el.parent().hasClass('wc-tabs')) {
                // ↓ Tabs widget
                cssProperties = {
                    WebkitTransitionDuration: this.options.duration,
                    MozTransitionDuration: this.options.duration,
                    transitionDuration: this.options.duration,
                    transform: 'translate('+Math.round(pos.left)+'px)',
                    width: Math.round(el.outerWidth()),
                    opacity: 1,
                    left: '0px',
                };

            } else if (el.hasClass('wgl-tabs-horizontal_header_wrap')) {
                // ↓ Horizontal Tabs widget
                cssProperties = {
                    WebkitTransitionDuration: this.options.duration,
                    MozTransitionDuration: this.options.duration,
                    transitionDuration: this.options.duration,
                    transform: 'translateY('+Math.round(pos.top)+'px)',
                    height: Math.round(el.outerHeight(true)),
                    opacity: 1,
                };

            }else{
                // ↓ Menu
                let child_width = el.children('a').children('span').width() - 2;

                pos.left = pos.left + parseInt(el.children('a').css('marginLeft')) + 1;

                cssProperties = {
                    WebkitTransitionDuration: this.options.duration,
                    MozTransitionDuration: this.options.duration,
                    transitionDuration: this.options.duration,
                    transform: 'translate(' + pos.left + 'px)',
                    width: 'calc(' + el.children().outerWidth() + 'px)',
                    marginLeft: 'calc(-' + el.parent().css('border-left-width') + ')',
                    marginTop: 'calc(' + (el.children().outerHeight() - 56) / 2 + 'px)',
                };
            }

            this._focus = el;
            // Animate bubble
            this.bubble.css(cssProperties);

        }
    };

    $.fn.lavalamp = function(options) {
        if (typeof options === 'string') {
            let instance = $(this).data('lavalamp');
            return instance[options].apply(
                instance,
                Array.prototype.slice.call(arguments, 1)
            );
        } else {
            return this.each(function() {
                let instance = $(this).data('lavalamp');

                if (instance) {
                    $.extend(instance.options, options || {});
                    instance.reload();
                } else {
                    new Lavalamp(this, options);
                }
            });
        }
    };
})(jQuery, window);

(function( $ ) {

  $(document).on('click', '.sl-button', function() {
    var button = $(this),
        post_id = button.attr('data-post-id'),
        security = button.attr('data-nonce'),
        iscomment = button.attr('data-iscomment'),
        allbuttons;

    if (iscomment === '1') { /* Comments can have same id */
      allbuttons = $('.sl-comment-button-'+post_id);
    } else {
      allbuttons = $('.sl-button-'+post_id);
    }
    var loader = allbuttons.next('#sl-loader');
    if (post_id !== '') {
      $.ajax({
        type: 'POST',
        url: wgl_core.ajaxurl,
        data : {
          action : 'wgl_theme_like',
          post_id : post_id,
          nonce : security,
          is_comment : iscomment,
        },
        beforeSend: function() {
          loader.html('&nbsp;<div class="loader">Loading...</div>');
        },
        success: function(response) {
          var icon = response.icon;
          var count = response.count;
          allbuttons.html(icon+count);
          if (response.status === 'unliked') {
            allbuttons.prop('title', button.data('title-like'));
            allbuttons.removeClass('liked');
          } else {
            allbuttons.prop('title', button.data('title-unlike'));
            allbuttons.addClass('liked');
          }
          loader.empty();
        }
      });

    }
    return false;
  });

})( jQuery );
// Select Wrapper
function wglLinkOverlay() {
    jQuery('.wgl-link-overlay').each(function() {
        let $this = jQuery(this);
        let wrapper = $this.closest('.elementor-widget');
        let zIndexItem = 'auto' !== wrapper.css('z-index') ? wrapper.css('z-index') : false;
        let position = $this.data('link-position');
        let $link = false;

        if (!zIndexItem) {
            $this.css('z-index', zIndexItem);
        }

        switch (position) {
            case "1st":
                $link = wrapper.parent();
              break;
            case "2nd":
                $link = wrapper.parent().parent();
              break;
            case "3rd":
                $link = wrapper.parent().parent().parent();
              break;
            case "column":
                $link = wrapper.closest(".elementor-column");
              break;
            default:
                $link = wrapper.closest(".elementor-section");
        }

        if ($link) {
            $this.prependTo($link);
            wrapper.remove();
        }
    });
}
function wglLinkScroll() {
    jQuery('a.smooth-scroll, .smooth-scroll').on('click', function(event) {
        var href;
        if (this.tagName == 'A') {
            href = jQuery.attr(this, 'href');
        } else {
            var that = jQuery(this).find('a');
            href = jQuery(that).attr('href');
        }
        jQuery('html, body').animate(
            {
                scrollTop: jQuery(href).offset().top
            },
            500
        );
        event.preventDefault();
    });
}

// wgl Listings Search
function wglListingsSearch() {
    let select2 = jQuery('.wgl-listings .wgl-listings_search .select2');
    if (select2.length) {
        select2.each(function () {
            if (!jQuery(this).hasClass('select2-location')) {
                jQuery(this).select2({
                    placeholder: jQuery(this).data('placeholder'),
                    allowClear: true,
                });
            } else {
                jQuery(this).select2({
                    placeholder: jQuery(this).data('placeholder'),
                    ajax: {
                        url: wgl_core.ajaxurl,
                        dataType: 'json',
                        delay: 250,
                        data: function (data) {
                            return {
                                action: 'search_location',
                                searchTerm: data.term,
                            };
                        },
                        processResults: function (response) {
                            return {
                                results: response,
                            };
                        },
                        minimumInputLength: 1,
                        cache: true,
                    },
                });
            }
        });
    }

    jQuery('.wgl-listings_search.elementor-search .advanced_btn').on(
        'click tap',
        function () {
            jQuery(this)
                .closest('.wgl-listings_search')
                .find('.wgl-listings_search-advanced')
                .toggleClass('active-search');
            jQuery(this).toggleClass('active');
        }
    );

    jQuery(document).on('click', function (event) {
        if (
            !jQuery(event.target).closest(
                '.elementor-search .wgl-listings_search-advanced'
            ).length &&
            !jQuery(event.target).closest('.elementor-search .advanced_btn')
                .length &&
            !jQuery(event.target).closest(
                '.elementor-search .send_button button'
            ).length
        ) {
            jQuery(
                '.elementor-search .wgl-listings_search-advanced'
            ).removeClass('active-search');
        }
    });

    const form_search = jQuery('.form-search-listings');
    if (form_search.length) {
        jQuery(form_search).on('submit', function (e) {
            e.preventDefault();

            helperCheckbox(jQuery(this), 'doors');
            helperCheckbox(jQuery(this), 'seats');
            helperCheckbox(jQuery(this), 'features');
            helperCheckbox(jQuery(this), 'categories');

            helperDecimal(jQuery(this), 'price');
            helperDecimal(jQuery(this), 'mileage');
            helperDecimal(jQuery(this), 'year');

            helperSelect(jQuery(this), 'make');
            helperSelect(jQuery(this), 'model');
            helperSelect(jQuery(this), 'category');
            helperSelect(jQuery(this), 'condition');
            helperSelect(jQuery(this), 'type');
            helperSelect(jQuery(this), 'fuel_type');
            helperSelect(jQuery(this), 'transmission');
            helperSelect(jQuery(this), 'color');

            helperSelectMultiple(jQuery(this), 'location');

            if (window.elementorFrontend) {
                if (!window.elementorFrontend.isEditMode()) {
                    jQuery(this)[0].submit();
                }
            } else {
                jQuery(this)[0].submit();
            }
        });
    }

    const helperCheckbox = (self, name) => {
        const activeCheckboxes = self.find('input[name="' + name + '[]"]');

        const selectedCheckboxes = self
            .find('input[name="' + name + '[]"]:checked')
            .map(function () {
                return jQuery(this).val();
            })
            .get()
            .join(',');

        jQuery(activeCheckboxes).attr('disabled', true);

        if (selectedCheckboxes.length > 0) {
            self.find('.' + name + '-input').val(selectedCheckboxes);
        } else {
            self.find('.' + name + '-input').attr('disabled', true);
        }
    };

    const helperDecimal = (self, name) => {
        const min = self.find('input[name="min_' + name + '"]');
        const max = self.find('input[name="max_' + name + '"]');

        if(min.length && max.length){
            if (!min.val().length && !max.val().length) {
                min.attr('disabled', true);
                max.attr('disabled', true);
            }            
        }
    };

    const helperSelect = (self, name) => {
        const select = self.find('select[name="' + name + '"]');

        if (select.length && !select.val().length) {
            select.attr('disabled', true);
        }
    };

    const helperSelectMultiple = (self, name) => {
        const select = self.find('select[name="' + name + '"]');
        const selectedItems = select.val().join(',');
        if (selectedItems.length) {
            self.find('.' + name + '-input').val(selectedItems);
        } else {
            self.find('.' + name + '-input').attr('disabled', true);
        }

        select.attr('disabled', true);
    };

    let clonedTax = {};

    jQuery('.select2-model').each(function () {
        clonedTax[jQuery(this).attr('name')] = jQuery(this).clone();
    });

    const filterTax = (element, selectedMake = '') => {
        
        if (jQuery(element).hasClass('select2-hidden-accessible')) {
            jQuery(element).select2('destroy');
        }
    
        jQuery(element).empty();
    
        if('return_cloned' !== selectedMake){
            jQuery(element).append(
                jQuery('option[data-condition="all"]', clonedTax[jQuery(element).attr('name')]).clone()
            );

            jQuery(element).append(
                jQuery('option[data-condition="' + selectedMake + '"]', clonedTax[jQuery(element).attr('name')]).clone()
            );            
        }else{
            jQuery(element).append(
                jQuery('option', clonedTax[jQuery(element).attr('name')]).clone()
            );     
        }

        jQuery(element).select2({
            allowClear: true,
            width: '100%',
        }).trigger('change');
    }

    jQuery('.select2-make').on('change', function () {
        var value = jQuery(this).val();
        var self = jQuery(this);
        if (value) {
            self.closest('.form-search-listings')
                .find('.select2-model')
                .each(function () {
                    filterTax(this, value);
                });
        }
    });

    jQuery('.select2-make').on("select2:unselecting", function(e) {
        var self = jQuery(this);

        self.closest('.form-search-listings')
            .find('.select2-model')
            .each(function () {
                filterTax(this, 'return_cloned');
        });

    });
}

function wglMessageAnimInit() {
    jQuery('body').on('click', '.message_close_button', function (e) {
        jQuery(this).parents('.closable').slideUp(350);
    });
}

function wglMobileHeader() {
    var menu = jQuery('.wgl-mobile-header .mobile_nav_wrapper .wgl-menu-outer_content');
    var elementorEditormenu = jQuery('.elementor-editor-active .mobile_nav_wrapper .wgl-menu-outer_content');
    var verticalMenu = jQuery('.menu_vertical.elementor-widget-wgl-menu .primary-nav > ul').filter(function() {
        return !jQuery(this).closest('.wgl-menu-outer_content').length;
    }); 

    // Create Mobile Menu plugin
    (function ($) {
        $.fn.wglMobileMenu = function (options) {
            var defaults = {
                toggleBtn: '.hamburger-box',
                switcher: '.button_switcher',
                back: '.back',
                overlay: '.wgl-menu_overlay',
                anchor: '.menu-item > a[href*=\\#]',
            };

            if (this.length === 0) return this;

            return this.each(function () {
                var wglMenu = {},
                    ds = $(this).find('.primary-nav > ul'),
                    sub_menu = jQuery('.mobile_nav_wrapper .primary-nav > ul ul, .mobile_nav_wrapper .primary-nav > ul .wgl-e-container'),
                    m_width = jQuery('.mobile_nav_wrapper').data('mobileWidth'),
                    m_toggle = jQuery('.hamburger-box'),
                    body = jQuery('body'),
                    stickyMobile = jQuery('.wgl-mobile-header.wgl-sticky-element'),
                    window_width = jQuery(window).width(),
                    mobile_width = body.data('mobileWidth') ?? 1200;

                var mobile = window_width <= mobile_width;

                // Helper Menu
                var open = 'is-active',
                    openSubMenu = 'show_sub_menu',
                    mobile_on = 'mobile_switch_on',
                    mobile_off = 'mobile_switch_off',
                    mobile_switcher = 'button_switcher';

                var init = function () {
                    wglMenu.settings = $.extend({}, defaults, options);
                    createButton();
                    showMenu();
                    elementorAnimation();
                };
                var showMenu = function () {
                    if (jQuery(window).width() <= m_width) {
                        if (!m_toggle.hasClass(open)) {
                            createNavMobileMenu();
                        }
                    } else {
                        resetNavMobileMenu();
                    }
                };
                var showMenuAfterResize = function(e) {
                    window_width = jQuery(window).width();
                    if (window_width >= mobile_width){
                        mobile = false;
                        showMenu();
                        motionEffect(true);
                    }else if(window_width <= mobile_width && !mobile){
                        mobile = true;
                        showMenu(); // init once on mobile
                        motionEffect(true);
                    }
                };
                var createNavMobileMenu = function () {
                    sub_menu.removeClass(openSubMenu);
                    ds.hide().addClass(mobile_on);
                    body.removeClass(mobile_on);
                };
                var resetNavMobileMenu = function () {
                    sub_menu.removeClass(openSubMenu);
                    body.removeClass(mobile_on);
                    ds.show().removeClass(mobile_on);
                    m_toggle.removeClass(open);
                    jQuery('.' + mobile_switcher).removeClass('is-active');
                };
                var createButton = function () {
                    ds.find('.menu-item-has-children').each(function () {
                        jQuery(this)
                            .find('> a')
                            .append('<span class="' + mobile_switcher + '"></span>');
                    });
                };
                var toggleMobileMenu = function (e) {
                    ds.toggleClass(openSubMenu);
                    body.toggleClass(mobile_on);

                    if (body.hasClass(mobile_on)){
                        body.removeClass(mobile_off);
                        wglDisableBodyScroll(true, '.wgl-menu-outer_content');
                    }else{
                        body.addClass(mobile_off);
                        wglDisableBodyScroll(false, '.wgl-menu-outer_content');
                    }

                    motionEffect();
                };

                var elementorAnimation = function () {
                    const mobileDrawer = menu.find('div[data-elementor-type="wgl-mobile-drawer"]');
                    const settings = mobileDrawer.data('elementor-settings');
                    if (!settings) return;
                    const animation = settings.mobile_drawer_animation;
                    if (!animation) return;

                    mobileDrawer.addClass('elementor-invisible');
                };

                var motionEffect = function (resize = false) {
                    const mobileDrawer = menu.find('div[data-elementor-type="wgl-mobile-drawer"]');
                    const settings = mobileDrawer.data('elementor-settings');
                    if (!settings) return;
                    const animation = settings.mobile_drawer_animation;
                    const delay = settings.mobile_drawer_animation_delay;
                    let timerID;
                    
                    if (!animation) return;
            
                    if((mobileDrawer.hasClass('animated') || resize) && !body.hasClass(mobile_on)){
                        mobileDrawer.removeClass('animated');
                        mobileDrawer.addClass('elementor-invisible');
                        mobileDrawer.removeClass(animation);
                        if (timerID) {
                            clearTimeout(timerID);
                        }
                    }else{
                        let animationClass = 'animated ' + animation;
                        timerID = setTimeout(() => {
                            mobileDrawer.removeClass('elementor-invisible');
                            mobileDrawer.addClass(animationClass);
                        }, delay);                    
                    }
                };

                var hideSubMenu = function (e) {
                    if (!jQuery('.button_switcher').is(e.target)) {
                        jQuery('.mobile_nav_wrapper .menu-item-has-children')
                            .find('.sub-menu, div.wgl-e-container')
                            .stop(true)
                            .slideUp(450)
                            .removeClass(openSubMenu);

                        jQuery('.mobile_nav_wrapper .menu-item-has-children')
                            .find('.button_switcher')
                            .removeClass(open);

                        if (jQuery(e.target).closest('.wgl-mobile-header').length && body.hasClass(mobile_on)) {
                            toggleMobileMenu();
                        }
                    }
                };
                var showSubMenu = function (e) {
                    e.preventDefault();
                    var item = jQuery(this).parents('li');

                    if (!jQuery(this).hasClass(open)) {
                        jQuery('.mobile_nav_wrapper .menu-item-has-children')
                            .not(item)
                            .find('.sub-menu, div.wgl-e-container')
                            .stop(true)
                            .slideUp(450)
                            .removeClass(openSubMenu);
                        jQuery('.mobile_nav_wrapper .menu-item-has-children')
                            .not(item)
                            .find('.button_switcher')
                            .removeClass(open);
                        jQuery('.mobile_nav_wrapper .menu-item-has-children')
                            .not(item)
                            .find('a[href*=\\#]')
                            .removeClass(open);

                        jQuery(this)
                            .parent()
                            .prevAll('.sub-menu, div.wgl-e-container')
                            .stop(true)
                            .slideDown(450)
                            .addClass(openSubMenu);
                        jQuery(this)
                            .parent()
                            .nextAll('.sub-menu, div.wgl-e-container')
                            .stop(true)
                            .slideDown(450)
                            .addClass(openSubMenu);
                    } else {
                        jQuery(this)
                            .parent()
                            .prevAll('.sub-menu, div.wgl-e-container')
                            .stop(true)
                            .slideUp(450)
                            .removeClass(openSubMenu);
                        jQuery(this)
                            .parent()
                            .nextAll('.sub-menu, div.wgl-e-container')
                            .stop(true)
                            .slideUp(450)
                            .removeClass(openSubMenu);
                    }

                    jQuery(this).toggleClass(open);
                };
                var eventClose = function (e) {
                    var container = $('.wgl-menu_outer');

                    if (
                        !container.is(e.target) &&
                        container.has(e.target).length === 0 &&
                        $('body').hasClass(mobile_on)
                    ) {
                        toggleMobileMenu();
                    }
                };
                var goBack = function (e) {
                    e.preventDefault();
                    jQuery(this).closest('.sub-menu').removeClass(openSubMenu);
                    jQuery(this).closest('.sub-menu').prev('a').removeClass(open);
                    jQuery(this)
                        .closest('.sub-menu')
                        .prev('a')
                        .find('.' + mobile_switcher)
                        .removeClass(open);
                };
                var mobileSticky = function(){
                    var top = jQuery(stickyMobile).height();
                    var y = jQuery(window).scrollTop();
                    if(jQuery(stickyMobile).hasClass('wgl-elementor-builder')){
                        top = stickyMobile.parent().height();
                    }
                    if ( y >= top ) {
                        jQuery(stickyMobile).addClass( 'sticky_mobile' );
                    } else {
                        jQuery(stickyMobile).removeClass('sticky_mobile');
                    }
                };

                var startX, startY, startTime;

                var touchStartHandler = function(e) {
                    var touch = e.originalEvent.touches[0];
                    startX = touch.pageX;
                    startY = touch.pageY;
                    startTime = new Date().getTime();
                };

                var touchEndHandler = function(e) {
                    var touch = e.originalEvent.changedTouches[0];
                    var endX = touch.pageX;
                    var endY = touch.pageY;
                    var endTime = new Date().getTime();
                    var timeDiff = endTime - startTime;
                    var xDiff = Math.abs(endX - startX);
                    var yDiff = Math.abs(endY - startY);
                    var swipeThreshold = 30;
                    var swipeTimeThreshold = 500;

                    if (timeDiff < swipeTimeThreshold && xDiff < swipeThreshold && yDiff < swipeThreshold) {
                        showSubMenu.call(this, e);
                    }
                };

                // Init
                init();

                jQuery(wglMenu.settings.toggleBtn).on(click, toggleMobileMenu);
                jQuery(wglMenu.settings.overlay).on(click, eventClose);

                // Switcher menu
                var switcherSelector = jQuery(wglMenu.settings.switcher);
                switcherSelector.on('touchstart', touchStartHandler);
                switcherSelector.on('touchend', touchEndHandler);
                switcherSelector.on('click', showSubMenu);

                jQuery(wglMenu.settings.anchor).on('touchend mouseup', hideSubMenu);

                // Go back menu
                jQuery(wglMenu.settings.back).on(click, goBack);

                let delay_timer;
                jQuery( window ).resize(
                    function() {
                        clearTimeout(delay_timer);
                        delay_timer = setTimeout(showMenuAfterResize, 100);
                    }
                );

                if ( stickyMobile.length !== 0 && body.hasClass('admin-bar') ) {
                    mobileSticky();

                    jQuery( window ).scroll(
                        function() {
                            if (jQuery(window).width() <= stickyMobile.find('.mobile_nav_wrapper').data('mobileWidth')) {
                                mobileSticky();
                            }
                        }
                    );
                    jQuery( window ).resize(
                        function() {
                            if (jQuery(window).width() <= stickyMobile.find('.mobile_nav_wrapper').data('mobileWidth')) {
                                mobileSticky();
                            }
                        }
                    );
                }
            });
        };
    })(jQuery);

    (function($) {
		$.fn.wglVerticalMenu = function(options) {
			var defaults = {
				"switcher"      : ".button_switcher_vertical",
				"anchor"		: ".menu-item > a[href*=\\#]"
	    	};

		    if (this.length === 0) { return this; }

		    return this.each(function () {
		    	var wglMenu = {}, ds = $(this);

			    //Helper Menu
				var open = "is-active",
			    openSubMenu = "show_sub_menu",
			    mobile_on = "menu_vertical_switch_on",
			    mobile_switcher = "button_switcher_vertical";

			    var init = function() {
			    	wglMenu.settings = $.extend({}, defaults, options);
			    	createButton();
			    },
			    createButton = function() {
		  			ds.find('.menu-item-has-children').each(function() {
		  				jQuery(this).find('> a').append('<span class="'+ mobile_switcher +'"></span>');
		  			});
		        },
                toggleMobileMenu = function (e) {
                    ds.toggleClass(openSubMenu);
                    body.toggleClass(mobile_on);

                    if (body.hasClass(mobile_on)){
                        wglDisableBodyScroll(true, '.wgl-menu-outer_content');
                    }else{
                        wglDisableBodyScroll(false, '.wgl-menu-outer_content');
                    }
                },
			    showSubMenu = function(e) {
                    e.preventDefault();
                    var item = jQuery(this).parents('li');

                    if (!jQuery(this).hasClass(open)) {
                        ds.find('.menu-item-has-children')
                            .not(item)
                            .find('.sub-menu, div.wgl-e-container')
                            .stop(true)
                            .slideUp(450)
                            .removeClass(openSubMenu);
                        ds.find('.menu-item-has-children')
                            .not(item)
                            .find('.button_switcher')
                            .removeClass(open);
                        ds.find('.menu-item-has-children')
                            .not(item)
                            .find('a[href*=\\#]')
                            .removeClass(open);

                        jQuery(this)
                            .parent()
                            .prevAll('.sub-menu, div.wgl-e-container')
                            .stop(true)
                            .slideDown(450)
                            .addClass(openSubMenu);
                        jQuery(this)
                            .parent()
                            .nextAll('.sub-menu, div.wgl-e-container')
                            .stop(true)
                            .slideDown(450)
                            .addClass(openSubMenu);
                    } else {
                        jQuery(this)
                            .parent()
                            .prevAll('.sub-menu, div.wgl-e-container')
                            .stop(true)
                            .slideUp(450)
                            .removeClass(openSubMenu);
                        jQuery(this)
                            .parent()
                            .nextAll('.sub-menu, div.wgl-e-container')
                            .stop(true)
                            .slideUp(450)
                            .removeClass(openSubMenu);
                    }

                    jQuery(this).toggleClass(open);
				},
				hideSubMenu = function(e) {
                    let switcherTarget = ds.find('.button_switcher_vertical');
			    	if(!switcherTarget.is(e.target)){
                        ds.find('.menu-item-has-children')
                            .find('.sub-menu, div.wgl-e-container')
                            .stop(true)
                            .slideUp(450)
                            .removeClass(openSubMenu);

                        ds.find('.menu-item-has-children')
                            .find('.button_switcher')
                            .removeClass(open);

                        if (jQuery(e.target).closest('.wgl-mobile-header').length) {
                            toggleMobileMenu();
                        }
                    }
			    };

				/*Init*/
				init();

			    //switcher menu
			    ds.find(wglMenu.settings.switcher).on(click, showSubMenu);
				ds.find(wglMenu.settings.anchor).on(click, hideSubMenu);

		    });

		};
	})(jQuery);

    menu.wglMobileMenu();
    elementorEditormenu.wglVerticalMenu();
    verticalMenu.wglVerticalMenu();
}

var wglDisableBodyScroll = (function () {

    var _selector = false,
        _element = false,
        _clientY;

    if (!Element.prototype.matches)
        Element.prototype.matches = Element.prototype.msMatchesSelector ||
            Element.prototype.webkitMatchesSelector;

    if (!Element.prototype.closest)
        Element.prototype.closest = function (s) {
            var ancestor = this;
            if (!document.documentElement.contains(el)) return null;
            do {
                if (ancestor.matches(s)) return ancestor;
                ancestor = ancestor.parentElement;
            } while (ancestor !== null);
            return el;
        };

    var preventBodyScroll = function (event) {
        if (false === _element || !event.target.closest(_selector)) {
            event.preventDefault();
        }
    };

    var captureClientY = function (event) {
        if (event.targetTouches.length === 1) {
            _clientY = event.targetTouches[0].clientY;
        }
    };

    var preventOverscroll = function (event) {
        if (event.targetTouches.length !== 1) {
            return;
        }

        var clientY = event.targetTouches[0].clientY - _clientY;

        if (_element.scrollTop === 0 && clientY > 0) {
            event.preventDefault();
        }

        if ((_element.scrollHeight - _element.scrollTop <= _element.clientHeight) && clientY < 0) {
            event.preventDefault();
        }
    };

    return function (allow, selector) {
        if (typeof selector !== "undefined") {
            _selector = selector;
            _element = document.querySelector(selector);
        }

        if (true === allow) {
            if (false !== _element) {
                _element.addEventListener('touchstart', captureClientY, false);
                _element.addEventListener('touchmove', preventOverscroll, false);
            }
            document.body.addEventListener("touchmove", preventBodyScroll, false);
        } else {
            if (false !== _element) {
                _element.removeEventListener('touchstart', captureClientY, false);
                _element.removeEventListener('touchmove', preventOverscroll, false);
            }
            document.body.removeEventListener("touchmove", preventBodyScroll, false);
        }
    };
}());
function wglPageTransition(options = {}) {

    const element = document.querySelector('[wgl-page-transition]');

    // Check if the element exists
    if (!element) {
        return;
    }
    // Utility functions for link property checks
    const utils = {
        isDisabled: (el) => el.dataset.eDisablePageTransition !== undefined,
        isEmptyHref: (el) => !el.getAttribute('href'),
        isTargetBlank: (el) => el.target === '_blank',
        notSameOrigin: (el) => !el.href.startsWith(window.location.origin),
        hasFragment: (el) => /.*#[\w\-/$.+()*@?~!&',;=:%]*$/.test(el.href),
        isPopup: (el) =>
            el.getAttribute('aria-haspopup') === 'true' &&
            el.getAttribute('aria-expanded') === 'false',
        isWoocommerce: (el) => {
            const href = el.href;
            return (
                [
                    /\?add-to-cart=/,
                    /\?remove_item=/,
                    /\?undo_item=/,
                    /\?product-page=/,
                    /\?elementor_wc_logout=/,
                ].some((regex) => regex.test(href)) ||
                el.closest('.woocommerce-MyAccount-navigation-link')
            );
        },
        isExcluded: (el, exclude) => exclude && new RegExp(exclude).test(el.href),
    };

    const classes = {
        entering: 'wgl-page-transition--entering',
        exiting: 'wgl-page-transition--exiting',
        entered: 'wgl-page-transition--entered',
    };

    const settings = {
        triggers:
            options.triggers || 'a:not([data-elementor-open-lightbox="yes"])',
        exclude: options.exclude || null,
        disabled: options.disabled || false,
    };

    function getLinks() {
        return document.querySelectorAll(settings.triggers);
    }

    function shouldTriggerTransition(el) {
        return !Object.values(utils).some((fn) => fn(el, settings.exclude));
    }

    function handlePageShow() {
        if (element.classList.contains(classes.exiting)) {
            element.classList.add(classes.entered);
            element.classList.remove(classes.exiting);
        }

        animateState('entering').then(() => {
            element.classList.add(classes.entered);
        });
    }

    // Handle clicks on links
    function handleClick(event) {
        const target = event.currentTarget;
        if (!shouldTriggerTransition(target)) return;

        event.preventDefault();
        const url = target.href;

        element.classList.remove(classes.entered);
        animateState('exiting').then(() => {
            element.classList.add(classes.exiting);
            location.href = url;
        });
    }

    // Preload a link
    function prerenderLink(href) {
        if (document.querySelector(`link[href="${href}"]`)) return;

        const link = document.createElement('link');
        link.rel = 'prerender';
        link.href = href;
        document.head.appendChild(link);
    }

    // Handle hover or touch for preloading
    function handleMouseEnter(event) {
        const target = event.currentTarget;
        if (shouldTriggerTransition(target)) {
            prerenderLink(target.href);
        }
    }

    // Animate between states
    function animateState(state) {
        const className = classes[state];
        if (!className) return Promise.resolve();

        element.classList.add(className);
        const duration =
            parseInt(
                getComputedStyle(element).getPropertyValue(
                    '--wgl-page-transition-animation-duration'
                )
            ) || 500;

        return new Promise((resolve) => {
            setTimeout(() => {
                element.classList.remove(className);
                resolve();
            }, duration);
        });
    }

    // Bind events to links
    function bindEvents() {
        const links = getLinks();

        window.addEventListener('pageshow', handlePageShow);

        links.forEach((link) => {
            link.addEventListener('click', handleClick);
            link.addEventListener('mouseenter', handleMouseEnter);
            link.addEventListener('touchstart', handleMouseEnter);
        });
    }

    // Initialize the transitions
    function init() {
        if (settings.disabled) return;
        bindEvents();
    }

    init();
}
// wgl Page Title Parallax
function wglPageTitleParallax() {
    var page_title = jQuery('.page-header.page_title_parallax')
    if (page_title.length !== 0) {
        if ( !/Android|iPhone|iPad|iPod|BlackBerry|Windows Phone/i.test(navigator.userAgent || navigator.vendor || window.opera) ) {
            page_title.paroller();
        }
    }
}

// wgl Extended Parallax
function wglExtendedParallax() {
    var item = jQuery('.extended-parallax')
    if (item.length !== 0) {
        if ( !/Android|iPhone|iPad|iPod|BlackBerry|Windows Phone/i.test(navigator.userAgent || navigator.vendor || window.opera) ) {
            item.each(function () {
                jQuery(this).paroller();
            })
        }
    }
}
function wglParallaxVideo() {
    jQuery('.parallax-video').each(function() {
        jQuery(this).jarallax({
            loop: true,
            speed: 1,
            videoSrc: jQuery(this).data('video'),
            videoStartTime: jQuery(this).data('start'),
            videoEndTime: jQuery(this).data('end')
        });
    });
}

function wglParticlesCustom() {
    jQuery('.wgl-particles-js').each(function() {
        var id = jQuery(this).attr('id');
        var type = jQuery(this).data('particles-type');
        var color_type = jQuery(this).data('particles-colors-type');
        var color = jQuery(this).data('particles-color');
        var color_line = jQuery(this).data('particles-color');
        var number = jQuery(this).data('particles-number');
        var lines = jQuery(this).data('particles-line');
        var size = jQuery(this).data('particles-size');
        var speed = jQuery(this).data('particles-speed');
        var hover = jQuery(this).data('particles-hover');
        var hover_mode = jQuery(this).data('particles-hover-mode');
        switch (type) {
            case 'particles':
            default:
                type = 'circle';
                break;
            case 'hexagons':
                type = 'polygon';
                break;
        }
        if (color_type == 'random_colors') {
            color = color.split(',');
            color_line = color[0];
        }

        tsParticles.load(id, {
            particles: {
                number: {
                    value: number,
                    density: {
                        enable: true,
                        value_area: 800
                    }
                },
                color: {
                    value: color
                },
                shape: {
                    type: type,
                    polygon: {
                        nb_sides: 6
                    }
                },
                opacity: {
                    value: 1,
                    random: true,
                    anim: {
                        enable: false,
                        speed: 1,
                        opacity_min: 0.1,
                        sync: false
                    }
                },
                size: {
                    value: size,
                    random: true,
                    anim: {
                        enable: false,
                        speed: 30,
                        size_min: 1,
                        sync: false
                    }
                },
                line_linked: {
                    enable: lines,
                    distance: 150,
                    color: color_line,
                    opacity: 0.4,
                    width: 1
                },
                move: {
                    enable: true,
                    speed: speed,
                    direction: 'none',
                    random: false,
                    straight: false,
                    out_mode: 'out',
                    bounce: false,
                    attract: {
                        enable: false,
                        rotateX: 600,
                        rotateY: 1200
                    }
                }
            },
            interactivity: {
                detect_on: 'canvas',
                events: {
                    onhover: {
                        enable: hover,
                        mode: hover_mode
                    },
                    onclick: {
                        enable: true,
                        mode: 'push'
                    },
                    resize: true
                },
                modes: {
                    grab: {
                        distance: 150,
                        line_linked: {
                            opacity: 1
                        }
                    },
                    bubble: {
                        distance: 200,
                        size: size * 1.6,
                        duration: 20,
                        opacity: 1,
                        speed: 30
                    },
                    repulse: {
                        distance: 80,
                        duration: 0.4
                    },
                    push: { particles_nb: 4 },
                    remove: { particles_nb: 2 }
                }
            },
            retina_detect: true
        });
        var update;
        update = function() {
            requestAnimationFrame(update);
        };
        requestAnimationFrame(update);
    });
}

function wglParticlesImageCustom() {

    jQuery('.wgl-particles-img-js').each(function () {
        var id = jQuery(this).attr('id');
        var color = jQuery(this).data('particles-color') || "#000000";

        var number = jQuery(this).data('particles-number');
        var lines = jQuery(this).data('particles-line');
        var size = jQuery(this).data('particles-size');
        var speed = jQuery(this).data('particles-speed');
        var hover = jQuery(this).data('particles-hover');
        var hover_mode = jQuery(this).data('particles-hover-mode');
        var rotate = jQuery(this).data('particles-rotate');
        rotate = rotate === 'yes' ? true : false;
        var rotate_speed = jQuery(this).data('particles-rotate-animation') || 0;

        var img_src = jQuery(this).data('image').split(",");

        var imageElement = [];

        img_src.forEach(function (item, i, arr) {
            var url = new URL(item);
            var element = {};
            element.height = url.searchParams.get('height');
            element.replaceColor = true;
            element.src = item.split('?')[0];
            element.width = url.searchParams.get('width');
            element.fill = true;
            element.close = true;
            imageElement.push(element);
        });

        tsParticles.load(id, {
            "detectRetina": true,
            "fpsLimit": 60,
            "particles": {
                "number": {
                    "value": number,
                    "density": {
                        "enable": true,
                        "area": 800
                    },
                    "limit": 0,
                },
                "color": {
                    "value": color
                },
                "shape": {
                    "image": imageElement,
                    "polygon": {
                        "close": true,
                        "fill": true,
                        "sides": 5
                    },
                    "type": "image",
                    "custom": {}
                },
                "opacity": {
                    "animation": {
                        "enable": false,
                        "minimumValue": 0.1,
                        "speed": 1,
                        "sync": false
                    },
                    "random": {
                        "enable": false,
                        "minimumValue": 1
                    },
                    "value": 1
                },
                "size": {
                    "animation": {
                        "enable": false,
                        "minimumValue": 1,
                        "speed": 40,
                        "sync": false
                    },
                    "random": {
                        "enable": false,
                        "minimumValue": 1
                    },
                    "value": size
                },

                "lineLinked": {
                    "blink": false,
                    "color": {
                        "value": color
                    },
                    "consent": false,
                    "distance": 150,
                    "enable": lines,
                    "opacity": 0.4,
                    "width": 1
                },
                "move": {
                    "collisions": false,
                    "direction": "none",
                    "enable": true,
                    "outMode": "out",
                    "random": false,
                    "speed": speed,
                    "straight": false,
                    "attract": {
                        "enable": false,
                        "rotate": {
                            "x": 600,
                            "y": 1200
                        }
                    },
                },
                "rotate": {
                    "animation": {
                        "enable": rotate,
                        "speed": rotate_speed,
                        "sync": false
                    },
                    "direction": "random",
                    "random": true,
                    "value": 0
                },
                "stroke": {
                    "color": {
                        "value": color
                    },
                    "width": 0,
                    "opacity": 1
                }
            },
            "interactivity": {
                "detectsOn": "canvas",
                "events": {
                    "onClick": {
                        "enable": false,
                        "mode": "push"
                    },
                    "onHover": {
                        "enable": hover,
                        "mode": hover_mode,
                        "parallax": {
                            "enable": false,
                            "force": 60,
                            "smooth": 10
                        }
                    },
                    "resize": true
                },
                "modes": {
                    "bubble": {
                        "distance": 200,
                        "duration": 20,
                        "opacity": 1,
                        "size": size * 1.6,
                    },
                    "connect": {
                        "distance": 80,
                        "lineLinked": {
                            "opacity": 0.5
                        },
                        "radius": 60
                    },
                    "grab": {
                        "distance": 150,
                        "lineLinked": {
                            "opacity": 1,
                        }
                    },
                    "push": {
                        "quantity": 4
                    },
                    "remove": {
                        "quantity": 2
                    },
                    "repulse": {
                        "distance": 200,
                        "duration": 0.4
                    },
                    "slow": {
                        "factor": 1,
                        "radius": 0
                    }
                }
            },
            "backgroundMask": {
                "cover": {
                  "color": {
                    "value": "#fff"
                  },
                  "opacity": 1
                },
                "enable": false
              },
              "pauseOnBlur": true,
              "background": {}
        });

        var update;
        update = function () {
            requestAnimationFrame(update);
        };
        requestAnimationFrame(update);



    });
}

function wglPhysicsButton($scope = false) {
    let buttonPhysics = jQuery('.wgl-button_physics');
    if (buttonPhysics.length) {
        buttonPhysics.each(function () {
            let self = jQuery(this);
            self.appear(function() {
                var Engine = Matter.Engine,
                    Render = Matter.Render,
                    Events = Matter.Events,
                    MouseConstraint = Matter.MouseConstraint,
                    Mouse = Matter.Mouse,
                    Bodies = Matter.Bodies,
                    Query = Matter.Query;

                // create an engine
                var engine = Engine.create();

                // .wglPhysics-view
                const content = this.querySelector('.wgl-physics_canvas');
                let wglPhysicsArea = this.querySelector('.wgl-physics_elements');

                let wglPhysicsAmount =
                    wglPhysicsArea.querySelectorAll('.wgl-physics_item').length;

                const delay = Number(this.querySelector('.wgl-physics_elements').getAttribute('data-delay')) * 1000;
                var w = self.find('.wgl-physics_matter').width();
                var h = self.find('.wgl-physics_matter').height();
                let numCircles = wglPhysicsAmount;

                let elements = [];
                let wglPhysicsCircles = [];
                const scaleFactor = 'yes' === this.querySelector('.wgl-physics_elements').getAttribute('data-increase-active') ? 1.2 : 1;
                const restitution = Number(this.querySelector('.wgl-physics_elements').getAttribute('data-restitution'));
                const friction = Number(this.querySelector('.wgl-physics_elements').getAttribute('data-friction'));
                const density = Number(this.querySelector('.wgl-physics_elements').getAttribute('data-density'));

                var render = Render.create({
                    element: content,
                    engine: engine,
                    options: {
                        width: w,
                        height: h,
                        pixelRatio: 2,
                        background: 'transparent',
                        wireframes: false,
                    },
                });

                var mouse = Mouse.create(render.canvas),
                    mouseConstraint = MouseConstraint.create(engine, {
                        mouse: mouse,
                        constraint: {
                            stiffness: 0.2,
                            render: {
                                visible: false,
                            },
                        },
                    });

                class wglPhysicsCircle {
                    constructor(itemElement) {
                        this.element = wglPhysicsArea.querySelector(
                            `.wgl-physics_item[data-item-id="${itemElement.getAttribute('data-item-id')}"]`
                        );

                        if (!this.element.classList.contains('visible')) {
                            this.element.classList.add('visible');
                        }

                        const size = parseInt(
                            getComputedStyle(this.element).getPropertyValue(
                                '--size-circle'
                            )
                        );
                        const link = this.element
                            .querySelector('.wgl-button_physics_link') ? this.element
                            .querySelector('.wgl-button_physics_link')
                            .getAttribute('href') : '#';

                        const target = this.element
                            .querySelector('.wgl-button_physics_link') ? this.element
                            .querySelector('.wgl-button_physics_link')
                            .getAttribute('target') : '_self';

                        let x = Math.floor(Math.random() * w);
                        let y = 0;

                        this.radius = size * 0.5;
                        this.body = Matter.Bodies.circle(x, y, this.radius, {
                            render: {
                                fillStyle: 'transparent',
                            },
                            url: link,
                            target: target,
                            idItem: this.element.getAttribute('data-item-id'),
                            restitution: restitution, // Adjust this value to control bounce on collisions
                            friction: friction, // Adjust this value to control friction
                            density: density, // Adjust this value to control mass
                        });

                        this.element.style.width = size * 2 + 'px';
                        this.element.style.height = size * 2 + 'px';
                        this.cornea = document.createElement('div');
                        this.element.appendChild(this.cornea);
                    }

                    update() {
                        this.pos = {
                            x: this.body.position.x,
                            y: this.body.position.y,
                        };

                        if (
                            activeCircle &&
                            activeCircle.idItem ===
                            this.element.getAttribute('data-item-id')
                        ) {
                            const xOffset = (this.radius * (scaleFactor - 1)) / 2;
                            const yOffset = (this.radius * (scaleFactor - 1)) / 2;

                            this.element.style.width =
                                this.radius * 2 * scaleFactor + 'px';
                            this.element.style.height =
                                this.radius * 2 * scaleFactor + 'px';
                            this.element.style.transform = `translate(${
                                this.pos.x - this.radius - xOffset
                            }px, ${
                                this.pos.y - this.radius - yOffset
                            }px) scale(${scaleFactor})`;
                        } else {
                            this.element.style.width = this.radius * 2 + 'px';
                            this.element.style.height = this.radius * 2 + 'px';
                            this.element.style.transform = `translate(${
                                this.pos.x - this.radius
                            }px, ${this.pos.y - this.radius}px) scale(1)`;
                        }
                    }

                    lookAt(pos) {
                        let diff = {x: pos.x - this.pos.x, y: pos.y - this.pos.y};
                        let polar = [
                            Math.sqrt(diff.x * diff.x + diff.y * diff.y),
                            Math.atan2(diff.y, diff.x),
                        ];
                        let dist =
                            polar[0] < this.radius * 0.5
                                ? polar[0]
                                : this.radius * 0.5;
                        this.cornea.style.transform = `translate(${
                            Math.cos(polar[1]) * dist
                        }px, ${Math.sin(polar[1]) * dist}px)`;

                        window.cornea = `translate(${
                            Math.cos(polar[1]) * dist
                        }px, ${Math.sin(polar[1]) * dist}px)`;
                        window.polar = polar;
                    }
                }

                window.render = render;

                // create bounds
                var ground = Bodies.rectangle(w / 2 + 160, h + 80, w + 320, 160, {
                    isStatic: true,
                });
                var wallLeft = Bodies.rectangle(-80, 0, 160, h * 2, {
                    isStatic: true,
                });
                var wallRight = Bodies.rectangle(w + 80, 0, 160, h * 2, {
                    isStatic: true,
                });
                var roof = Bodies.rectangle(w / 2 + 160, -80, w + 320, 160, {
                    isStatic: true,
                });

                let mousepos = {x: 0, y: 0};

                window.addEventListener('pointermove', (e) => {
                    mousepos = {x: e.clientX, y: e.clientY};
                });

                elements.push(ground);
                elements.push(wallLeft);
                elements.push(wallRight);
                elements.push(roof);

                const items = wglPhysicsArea.querySelectorAll('.wgl-physics_item');
                const filteredItems = [];
                
                items.forEach((itemElement) => {
                    if (
                        !(itemElement.classList.contains('hide_mobile') &&
                        itemElement.getAttribute('data-resolution') &&
                        window.innerWidth <= itemElement.getAttribute('data-resolution'))
                    ) {
                        filteredItems.push(itemElement);
                    }
                });
                
                filteredItems.forEach((itemElement, i) => {
                    setTimeout(() => {
                        wglPhysicsCircles.push(new wglPhysicsCircle(itemElement));
                        Matter.World.add(engine.world, wglPhysicsCircles[i].body);
                    }, i * delay);
                });
                Matter.World.add(engine.world, elements);

                Matter.World.add(engine.world, mouseConstraint);

                render.mouse = mouse;

                let click = false;

                mouseConstraint.mouse.element.removeEventListener(
                    'mousewheel',
                    mouseConstraint.mouse.mousewheel
                );
                mouseConstraint.mouse.element.removeEventListener(
                    'DOMMouseScroll',
                    mouseConstraint.mouse.mousewheel
                );

                document.addEventListener('mousedown', () => (click = true));
                document.addEventListener('mousemove', () => (click = false));

                Events.on(mouseConstraint, 'mousedown', function (event) {
                    var mouseConstraint = event.source;
                    var bodies = engine.world.bodies;
                    if (!mouseConstraint.bodyB) {
                        for (var i = 0; i < bodies.length; i++) {
                            var body = bodies[i];
                            if (
                                Matter.Bounds.contains(
                                    body.bounds,
                                    mouseConstraint.mouse.position
                                )
                            ) {
                                jQuery(self).find('[data-item-id="' + body.idItem + '"]').addClass('active');
                                break;
                            }
                        }
                    }
                });

                Events.on(mouseConstraint, 'mouseup', function (event) {
                    var mouseConstraint = event.source;
                    var bodies = engine.world.bodies;
                    if (!mouseConstraint.bodyB) {
                        for (var i = 0; i < bodies.length; i++) {
                            var body = bodies[i];
                            jQuery(self).find('[data-item-id="' + body.idItem + '"]').removeClass('active');
                            if (true === click) {
                                if (
                                    Matter.Bounds.contains(
                                        body.bounds,
                                        mouseConstraint.mouse.position
                                    )
                                ) {
                                    var bodyUrl = body.url;
                                    if (undefined !== bodyUrl && '#' !== bodyUrl) {
                                        try {
                                            let target = body.target;
                                            if(!target || '_self' === target){
                                                window.location.href = bodyUrl;
                                            }else{
                                                let newWindow = window.open(bodyUrl, target);
                                                if (!newWindow || newWindow.closed || 'undefined' === typeof newWindow.closed) {
                                                    window.location.href = bodyUrl;
                                                }                                                
                                            }
                                        } catch (e) {
                                            window.location.href = bodyUrl;
                                        }
                                    }
                                    break;
                                }
                            }
                        }
                    }
                });

                let activeCircle = null;

                Events.on(mouseConstraint, 'startdrag', (event) => {
                    activeCircle = event.body;
                    Matter.Body.scale(activeCircle, scaleFactor, scaleFactor);
                });

                Events.on(mouseConstraint, 'enddrag', (event) => {
                    Matter.Body.scale(
                        activeCircle,
                        1 / scaleFactor,
                        1 / scaleFactor
                    );
                    activeCircle = null;
                });

                Events.on(mouseConstraint, 'mousemove', function (event) {
                    var foundPhysics = Query.point(wglPhysicsCircles.map(circle => circle.body), event.mouse.position);

                    wglPhysicsCircles.forEach((wglPhysicscirc) => {
                        jQuery(wglPhysicscirc.element).removeClass('hover');
                        render.canvas.style.cursor = "default";
                    });

                    if (
                        foundPhysics[0]
                    ) {
                        jQuery(self).find('[data-item-id="' + foundPhysics[0].idItem + '"]').addClass('hover');
                        render.canvas.style.cursor = "pointer";
                    }
                });

                this.addEventListener('mouseleave', () => {
                    wglPhysicsCircles.forEach((wglPhysicscirc) => {
                        jQuery(wglPhysicscirc.element).removeClass('hover');
                    });
                });

                // run the engine
                Matter.Runner.run(engine);

                // run the renderer
                Render.run(render);

                Matter.Events.on(engine, 'afterUpdate', () => {
                    wglPhysicsCircles.forEach((wglPhysicscirc) => {
                        wglPhysicscirc.update();
                        wglPhysicscirc.lookAt(mousepos);
                    });
                });

                let elementsHasVisible = false;

                const hideMobile = function () {
                    const item = wglPhysicsArea.querySelectorAll('.wgl-physics_item');

                    item.forEach(function (value) {

                        if (value.classList.contains('hide_mobile') && value.getAttribute('data-resolution')) {
                            if (window.innerWidth <= value.getAttribute('data-resolution')) {
                                value.style.display = 'none';
                            } else {
                                elementsHasVisible = true;
                                value.style.display = 'flex';
                            }
                        }
                    });
                }

                hideMobile();

                mouseConstraint.mouse.element.removeEventListener('touchstart', mouseConstraint.mouse.mousedown);
                mouseConstraint.mouse.element.removeEventListener('touchmove', mouseConstraint.mouse.mousemove);
                mouseConstraint.mouse.element.removeEventListener('touchend', mouseConstraint.mouse.mouseup);
                
                if(elementsHasVisible){
                    mouseConstraint.mouse.element.addEventListener('touchstart', mouseConstraint.mouse.mousedown, { passive: true });
                
                    mouseConstraint.mouse.element.addEventListener('touchmove', (e) => {
                        if (mouseConstraint.body && e.cancelable) {
                            mouseConstraint.mouse.mousemove(e);
                        }
                    });
                    mouseConstraint.mouse.element.addEventListener('touchend', (e) => {
                        if (mouseConstraint.body && e.cancelable) {
                            mouseConstraint.mouse.mouseup(e);
                        }
                    });
                }

                window.addEventListener('resize', hideMobile);
            });
        });
    }
}

// wgl Pie Chart
function wglPieChartInit() {

    var item = jQuery('.wgl-pie_chart');

    if (item.length) {
        item.each(function() {
            var chart = item.find('.chart');

			item.appear(function() {
				jQuery(chart).easyPieChart({
            		barColor: jQuery(this).data("barColor"),
					trackColor: jQuery(this).data("trackColor"),
					scaleColor: false,
					lineCap: 'square',
					lineWidth: jQuery(this).data("lineWidth"),
					animate: { duration: 1400, enabled: true },
					size: jQuery(this).data("size"),
					onStep: function(from, to, percent) {
						jQuery(this.el).find('.chart__percent').text(Math.round(percent) + '%');
					}
        		});
			});
        });
    }
}
// http://brutaldesign.github.io/swipebox/
function wglVideoboxInit() {
    var gallery = jQuery(".videobox, .swipebox, .gallery a[href$='.jpg'], .gallery a[href$='.jpeg'], .gallery a[href$='.JPEG'], .gallery a[href$='.gif'], .gallery a[href$='.png']");
    if (gallery.length !== 0 ) {
        gallery.each(function() {
            jQuery(this).attr('data-elementor-open-lightbox', 'yes');
        });
    }
}
// wgl Single Portfolio Image Wide
function wglPageTitleParallax() {
    var imgWide = jQuery('.item__image.item__image-wide')
    var init = function () {
        if (imgWide.length !== 0) {
            var containerWidth = imgWide.parent().innerWidth(),
                windowWidth = window.innerWidth,
                correctOffset = 0,
                dataWidth = imgWide.data('img-width');

            if (windowWidth != containerWidth) {
                correctOffset = (windowWidth - containerWidth) / 2;
            }

            imgWide.css('--pf-width', windowWidth + 'px');
            imgWide.css('--pf-content-width', dataWidth );
            imgWide.css('max-width', windowWidth + 'px');
            imgWide.css('left', '-' + correctOffset + 'px');
        } else {
            imgWide.css('--pf-width', '');
            imgWide.css('--pf-content-width', '');
            imgWide.css('max-width', '');
            imgWide.css('left', '');
        }
    }

    /*Init*/
    init();
    window.addEventListener('resize', () => {
        init();
    });
}
function wglProfile(){
    let body = jQuery('body');

    body.on('click tap', '.wgl-mobile-header .wgl-dashboard-profile .nav > li > a', function(e){
        e.preventDefault();
        jQuery(this).closest('.nav').find('.sub-menu').toggleClass('active');
    });

    body.on('click tap', function(e) {
        var profile_container = jQuery('.wgl-mobile-header .wgl-dashboard-profile');
        if (!jQuery(e.target).closest(profile_container).length) {
            profile_container.find('.sub-menu').removeClass('active');
        }
    });
}
// WGL Progress Bar

function wglProgressBarsInit(item) {
    let widgetSelector = '.wgl-progress-bar',
        widgetEl = item ? jQuery(item).find(widgetSelector) : jQuery(widgetSelector);

    widgetEl.each(function () {
        let $_this = jQuery(this),
            bar  = $_this.find('.bar__filled'),

            value = bar.data('value'),
            max   = bar.data('max-value'),
            speed = bar.data('speed'),
            sep   = bar.data('sep'),

            progressWidth = (value / max) * 100;

        $_this.appear(function() {
            $_this.find('.value__digit').countTo({
                from: 0,
                to: value,
                speed: speed,
                refreshInterval: 10,
                separator: sep
            });
            bar.css({
                'width': progressWidth + '%',
                'transitionDuration': speed + 'ms',
            });

            if ($_this.hasClass('layout-dynamic')) {
                $_this.find('.progress__content').css({
                    'width': progressWidth + '%',
                    'transitionDuration': speed + 'ms',
                });
            }else if ($_this.hasClass('layout-dynamic_middle')) {
                $_this.addClass('init');
            }
        });
    });
}

function wglSearchInit() {

    // Create plugin Search
    (function($) {

        $.fn.wglSearch = function(options) {
            var defaults = {
                'toggleID'    : '.header_search-button',
                'closeID'     : '.header_search-close',
                'searchField' : '.header_search-field',
                'body'        : 'body > *:not(header)',
            };

            if (this.length === 0) { return this; }

            return this.each(function() {
                var wglSearch = {},
                    s = $(this),
                    openClass = 'header_search-open',
                    searchClass = '.header_search',

                init = function() {
                    wglSearch.settings = $.extend({}, defaults, options);
                },
                open = function() {
                    $(s).addClass(openClass);
                    setTimeout(function() {
                        $(s)
                            .find('input.search-field')
                            .focus();
                    }, 400);
                    return false;
                },
                close = function() {
                    $(s).removeClass(openClass);
                },
                toggleSearch = function(e) {
                    if (! $(s).closest(searchClass).hasClass(openClass)) {
                        open();
                    } else {
                        close();
                    }
                },
                eventClose = function(e) {
                    if (! $(e.target).closest('.search-form').length) {
                        if ($(searchClass).hasClass(openClass)) {
                            close();
                        }
                    }
                };
                $(document).on('keydown', function(e) {
                    if (e.which === 27 && $(searchClass).hasClass(openClass)) close();
                });

                // Init
                init();

                if ($(this).hasClass('search_standard') || $(this).hasClass('search_standard_fw')) {
                    $(this).find(wglSearch.settings.toggleID).on(click, toggleSearch);
                    $(this).find(wglSearch.settings.closeID).on(click, eventClose);
                } else {
                    $(wglSearch.settings.toggleID).on(click, toggleSearch);
                    $(wglSearch.settings.searchField).on(click, eventClose);
                }

                $(wglSearch.settings.body).on(click, eventClose);

            });

        };

    })(jQuery);

    jQuery('.header_search').wglSearch();

}
// WGL Service 1

function wglServiceInit() {
    const selector = ".toggling_content .wgl-service_wrapper_description, " +
        ".toggling_image .wgl-service_media, " +
        ".animation_toggling .wgl-infobox-content_wrapper";

    const setMaxHeight = (elements) => {
        elements.forEach(el => {
            el.style.setProperty('--max-height', el.scrollHeight + 'px');
        });
    };

    const updateAll = () => {
        const allElements = document.querySelectorAll(selector);
        setMaxHeight(allElements);
    };

    setMaxHeight([...document.querySelectorAll(selector)].filter(el => !el.closest('.swiper')));

    document.querySelectorAll('.swiper').forEach(swiperEl => {
        const updateSwiperElements = () => {
            setMaxHeight(swiperEl.querySelectorAll(selector));
        };

        const attach = () => {
            if (!swiperEl.swiper) return;
            swiperEl.swiper.on('init', updateSwiperElements);
            swiperEl.swiper.on('slideChangeTransitionEnd', updateSwiperElements);
            updateSwiperElements();
        };

        if (swiperEl.swiper) {
            attach();
        } else {
            const observer = new MutationObserver(() => {
                if (swiperEl.swiper) {
                    attach();
                    observer.disconnect();
                }
            });
            observer.observe(swiperEl, { childList: true, subtree: true });
        }
    });

    window.addEventListener('resize', () => {
        requestAnimationFrame(updateAll);
    });
}
// showcase

function wglShowcaseInit() {
    let $showcase_init = jQuery('.wgl-showcase');
    if ($showcase_init.length) {

        $showcase_init.each(function() {
            let $this = jQuery(this),
                breakpoint = $this.data('breakpoint'),
                item = $this.find('.showcase__item'),
                content = $this.find('.showcase__content_wrapper'),
                titles = $this.find('.showcase__title'),
                itemInner = $this.find('.showcase__item_inner'),
                active = $this.find('.active');

            let mouse_timer;
            mouse_timer = setTimeout(function () {
                item.on('mouseenter tap', function(){
                    clearTimeout(mouse_timer);

                    let obj = jQuery(this);
                    if(!obj.hasClass('active')){
                        item.removeClass('active');
                        obj.addClass('active');

                        if($this.hasClass('content_animation-yes')) {
                            if ($this.hasClass('mobile_view_enable')) {
                                content.stop(true, true).slideUp(800);
                                obj.find('.showcase__content_wrapper').slideDown(800);
                            } else {
                                content.show();
                            }
                        }
                    }
                });
            }, 100);

            if (0 === active.length){
                $this.on('mouseleave', function(){
                    if (!$this.hasClass('mobile_view_enable')){
                        item.removeClass('active');
                    }
                });
            }

            let resize_timer;
            jQuery( window ).resize(
                function() {
                    clearTimeout(resize_timer);
                    resize_timer = setTimeout(responsive, 100);
                }
            );

            function responsive() {
                if ( jQuery(window).outerWidth() <= breakpoint ) {
                    $this.removeClass('mobile_view_disable').addClass('mobile_view_enable');
                    if($this.hasClass('content_animation-yes')) {
                        active = $this.find('.active');
                        active.find('.showcase__content_wrapper').slideDown(800).parent().parent().siblings().find('.showcase__content_wrapper').slideUp(800);
                    }
                }else{
                    titles.each(function() {
                        let title = jQuery(this);
                        title.parent().css({ '--sc-title-width': Math.floor(title.outerWidth()) + 'px' });
                    });
                    item.css({ '--sc-inner-width': Math.floor(itemInner.outerWidth()) + 'px' });

                    $this.addClass('mobile_view_disable').removeClass('mobile_view_enable');
                }
            }
            responsive();
        })
    }
}

function wglSidePanelInit() {

    // Create plugin Side Panel
    (function($) {

        $.fn.wglSidePanel = function(options) {
            var defaults = {
                "toggleID"     : ".side_panel-toggle",
                "closeID"      : ".side-panel_close",
                "closeOverlay" : ".side-panel_overlay",
                "body"         : "body > *:not(header)",
                "sidePanel"    : "#side-panel .side-panel_sidebar"
            };

            if (this.length === 0) { return this; }

            return this.each(function () {
                var wglSidePanel = {},
                    s = $(this),
                    openClass = 'side-panel_open',
                    wglScroll,
                    sidePanelClass = '.side_panel',
                    $side_panel = $('#side-panel'),

                init = function() {
                    wglSidePanel.settings = $.extend({}, defaults, options);
                },
                open = function () {
                    if (! $side_panel.hasClass('side-panel_active')) {
                        $side_panel.addClass('side-panel_active');
                    }

                    $side_panel.addClass(openClass);
                    $(s).addClass(openClass);
                    $('body').removeClass('side-panel--closed').addClass('side-panel--opened');

                    var wglClassAnimated = $side_panel.find('section.elementor-element').data('settings');
                    if (wglClassAnimated && wglClassAnimated.animation) {
                        $side_panel.find('section.elementor-element').removeClass('elementor-invisible').addClass('animated').addClass(wglClassAnimated.animation);
                    }
                },
                close = function () {
                    $(s).removeClass(openClass);
                    $side_panel.removeClass(openClass);
                    $('body').removeClass('side-panel--opened').addClass('side-panel--closed');
                    var wglClassAnimated = $side_panel.find('section.elementor-element').data('settings');
                    if (wglClassAnimated && wglClassAnimated.animation) {
                        $side_panel.find('section.elementor-element').removeClass(wglClassAnimated.animation);
                    }
                },
                togglePanel = function(e) {
                    e.preventDefault();
                    wglScroll = $(window).scrollTop();

                    if (! $(s).closest(sidePanelClass).hasClass(openClass)) {
                        open();
                        $(window).scroll(function() {
                            if (450 < Math.abs($(this).scrollTop() - wglScroll)) {
                                close();
                            }
                        });
                    } else {

                    }
                },
                closePanel = function(e) {
                    e.preventDefault();
                    if ($(s).closest(sidePanelClass).hasClass(openClass)) {
                        close();
                    }
                },
                eventClose = function(e) {
                    var element = $(sidePanelClass);

                    if (! $side_panel.is(e.target) && $side_panel.has(e.target).length === 0) {
                        if ($(element).hasClass(openClass)) {
                            close();
                        }
                    }
                };

                init();

                $(wglSidePanel.settings.toggleID).on(click, togglePanel);
                $(wglSidePanel.settings.body).on(click, eventClose);
                $(wglSidePanel.settings.closeID).on(click, closePanel);
                $(wglSidePanel.settings.closeOverlay).on(click, closePanel);

                $(document).on('keydown', function(e) {
                    if (e.which === 27 && $(sidePanelClass).hasClass(openClass)) close();
                });
            });
        };

    })(jQuery);

    if (jQuery('#side-panel').length) {
        jQuery('.side_panel').wglSidePanel();
    }
}
function wglSkrollrInit() {
    var blog_scroll = jQuery('.blog_skrollr_init');
    if (blog_scroll.length) {
        if ( !/Android|iPhone|iPad|iPod|BlackBerry|Windows Phone/i.test(navigator.userAgent || navigator.vendor || window.opera) ) {
            // wgl Skrollr
            skrollr.init({
                smoothScrolling: false,
                forceHeight: false
            });
        }
    }
}

function wglStickyInit() {

    var $header = jQuery('.wgl-theme-header'),
        $stickyHeader = jQuery('.wgl-sticky-header'),
        $noticesWrapper = jQuery('.wgl_notices_wrapper'),
        $mobileSticky = $header.find('.wgl-mobile-header.wgl-sticky-element'),
        hDefaultHeight = $header.height(),
        stickyHeight = $stickyHeader.length !== 0 ? $stickyHeader.height() : 0,
        data = $stickyHeader.length !== 0 ? $stickyHeader.data('style') : 'none',
        m_width = jQuery('body').data( "mobileWidth" ),
        previousScroll = 0,
        previousScrollNotice = 0,
        elementorHeader = $header.find('.wgl-mobile-header').hasClass('wgl-elementor-builder');

    const scrollSize = jQuery(window).scrollTop();

    function init(element) {
        if ( ! element || m_width >= jQuery(window).prop("clientWidth")) {
            $stickyHeader.removeClass('sticky_active');
            return;
        }

        let scrollSize = jQuery(window).scrollTop();
        if ( data === 'standard' ) {
            if ( scrollSize >= stickyHeight && 0 !== stickyHeight ) {
                $stickyHeader.addClass( 'sticky_active' );
            } else {
                $stickyHeader.removeClass( 'sticky_active' );
            }
        } else {
            if ( scrollSize > stickyHeight ) {
                if ( scrollSize > previousScroll ) {
                    $stickyHeader.removeClass( 'sticky_active' );
                } else {
                    $stickyHeader.addClass( 'sticky_active' );
                }
            } else {
                $stickyHeader.removeClass('sticky_active');
            }
        }
        previousScroll = scrollSize;
    };
    function initNoticeSticky(element) {
        let scrollSize = jQuery(window).scrollTop();
        if ( scrollSize > stickyHeight && scrollSize > hDefaultHeight ) {
            $noticesWrapper.removeClass( 'stick_default' );
            if ( scrollSize > previousScrollNotice || 0 === stickyHeight || m_width >= jQuery(window).width() ) {
                $noticesWrapper.addClass( 'stick_top' );
            } else {
                $noticesWrapper.removeClass( 'stick_top' );
            }
        } else {
            $noticesWrapper.addClass( 'stick_default' ).removeClass( 'stick_top' );
        }
        previousScrollNotice = scrollSize;
    }

    if ( $noticesWrapper.length !== 0 ) {
        function setCss() {
            let heightElement = $header.height();
            if(elementorHeader){
                var totalHeight = 0;
                $header.find('.wgl-site-header > .container-wrapper > .elementor').children().each(function() {
                    if('none' !== jQuery(this).css('display')){
                        totalHeight += jQuery(this).height();
                    }
                });
                heightElement = totalHeight;
            }
            $noticesWrapper.css({
                '--height': heightElement + 'px',
                '--sticky-height': stickyHeight + 'px',
                '--mobile-sticky-height': $mobileSticky.length !== 0 ? $mobileSticky.height() + 'px' : '0',
                'opacity': 1
            });
        }
        if (scrollSize === 0) {
            $noticesWrapper.addClass('stick_default');
        }else if(scrollSize >= stickyHeight) {
            $noticesWrapper.addClass( 'stick_top' );
        }

        setCss();
        jQuery( window ).scroll( function() {
            initNoticeSticky(jQuery(this));
        } );
        jQuery( window ).resize( function() {
            initNoticeSticky(jQuery(this));
            setCss();
        } );
    }

    if ( $stickyHeader.length !== 0 ) {
        jQuery( window ).scroll( function() {
            init(jQuery(this));
        } );

        jQuery( window ).resize( function() {
            init(jQuery(this));
        } );
    }
}
function wglStickySidebar() {
    if (jQuery('.sticky-sidebar').length) {
        jQuery('body').addClass('sticky-sidebar_init');
        jQuery('.sticky-sidebar').each(function() {
            const $this = jQuery(this),
                stickyOffsetTop = $this.css('--wgl-sticky-offset-t') ?? 150;

            $this.theiaStickySidebar({
                additionalMarginTop: stickyOffsetTop,
                additionalMarginBottom: 30
            });
        });
    }

    if (jQuery('.sticky_layout .info-wrapper').length) {
        jQuery('.sticky_layout .info-wrapper').each(function() {
            jQuery(this).theiaStickySidebar({
                additionalMarginTop: 150,
                additionalMarginBottom: 150
            });
        });
    }
}

function wglStripedServicesInit() {
    let item_wrap = jQuery('.wgl-striped-services');
    if (item_wrap.length) {
        item_wrap.each(function() {
            let item = jQuery(this).find('.wgl-striped');
            item.on('mouseenter', function() {
                item_wrap.addClass('onhover');
                item.removeClass('active');
                jQuery(this).addClass('active');
            });
            item.on('mouseleave', function() {
                item_wrap.removeClass('onhover');
            });
        });
    }
}

// Tabs

function wglTabsInit() {
    let $tabs = jQuery('.wgl-tabs');
    if ($tabs.length) {
        $tabs.each(function(){
            let $this = jQuery(this);
            let tab = $this.find('.wgl-tabs_headings .wgl-tabs_header');
            let	data = $this.find('.wgl-tabs_content-wrap .wgl-tabs_content');
            let $contentWrap = $this.find('.wgl-tabs_content-wrap');
            let height = data.filter(':first').outerHeight();

            tab.filter(':first').addClass('active');

            data.filter(':first').addClass('active');
            data.filter(':not(:first)').hide();

            data.not('.active').each(function(){
                jQuery(this).find('.wgl-image-layers').removeClass('img-layer_animate');
            });

            $contentWrap.css({ 'height': height });
            tab.each(function(){
                let currentTab = jQuery(this);

                currentTab.on('click tap', function(){
                    let id = currentTab.data('tab-id');
                    let currentData = jQuery('.wgl-tabs .wgl-tabs_content[data-tab-id='+id+']');
                    height = currentData.outerHeight();

                    $contentWrap.css({ 'height': height });
                    currentTab.addClass('active').siblings().removeClass('active');
                    currentData.addClass('active').slideDown().siblings().removeClass('active').slideUp();

                    data.not('.active').each(function(){
                        jQuery(this).find('.wgl-image-layers').removeClass('img-layer_animate');
                    });

                    currentData.find('.wgl-image-layers').addClass('img-layer_animate');
                });
            });
        })
    }
}

// Tabs Horizontal

function wglTabsHorizontalInit() {
	let $tabs_horizontal = jQuery('.wgl-tabs-horizontal');
	if ($tabs_horizontal.length) {
		$tabs_horizontal.each(function(){
			let $this = jQuery(this),
				tab = $this.find('.wgl-tabs-horizontal_headings .wgl-tabs-horizontal_header_wrap'),
				data = $this.find('.wgl-tabs-horizontal_content-wrap .wgl-tabs-horizontal_content'),
				mh = Math.max.apply(Math, data.map(function(){
					return jQuery(this).height();
				}).get());

			$this.css({'min-height': mh });

			tab.filter(':first').addClass('active');

			data.filter(':not(:first)').hide();
			tab.each(function(){
				let currentTab = jQuery(this);

				currentTab.on('click tap', function(){
					let id = currentTab.data('tab-id'),
						contentTab = jQuery('.wgl-tabs-horizontal .wgl-tabs-horizontal_content[data-tab-id='+id+']');

					currentTab.addClass('active').siblings().removeClass('active');
					if ($tabs_horizontal.hasClass('effect-fade')){
						contentTab.siblings().fadeOut(200);
						contentTab.delay(201).fadeIn();
					} else{
						contentTab.slideDown().siblings().slideUp();
					}
				});
			});
		})
	}
}
		
function wglTextBackground() {
    var anim_text = jQuery('.wgl-animation-background-text');
    if (anim_text.length) {
        anim_text.each(function(index) {
            var paralax_text = jQuery('<div class="wgl-background-text"/>');

            jQuery(this)
                .find('>div:eq(0)')
                .before(paralax_text);
            var text = window.getComputedStyle(this, ':before').content;

            text = text.slice(1, -1);

            paralax_text.addClass('element-' + index);
            paralax_text.attr('data-info', index);

            jQuery(this)
                .find(paralax_text)
                .html(text.replace(/([^\x00-\x80]|\w)/g, "<span class='letter'>$&</span>"))
                .appear(function() {
                    if (typeof anime === 'function') {
                        var item_anime = jQuery(this)
                            .data('info');

                        if (item_anime === index) {
                            anime.timeline({ loop: false }).add({
                                targets: '.element-' + index + ' .letter',
                                translateY: [100, 0],
                                translateZ: 0,
                                opacity: [0, 1],
                                easing: 'easeOutExpo',
                                duration: 1400,
                                delay: function(el, i) {
                                    return 0 + 350 * i;
                                }
                            });
                        }
                    }
                });
        });
    }
}

function wglTextEditor() {

    // Mask Effect
    const $mask_effect = jQuery('.wgl-text-editor.mask_effect');

    if ($mask_effect.length) {
        $mask_effect.each(function () {
            const $this = jQuery(this);
            const $cloneText = $this.find('.text-editor_wrapper-clone');

            if (!$cloneText.length) return;

            if (!$this.find('.text-editor_outer-clone').length) {
                $cloneText.wrap('<div class="text-editor_outer-clone"></div>');
            }
            const $cloneOuter = $this.find('.text-editor_outer-clone');

            let margin = 0;

            const init = function () {
                $cloneText.css('width', $this.outerWidth() + 'px');
                margin = $cloneOuter.outerWidth() / 2;
            };

            let rafId = null;
            const onMouseMove = function (e) {

                if (rafId) return;

                rafId = requestAnimationFrame(() => {
                    rafId = null;

                    const rect = $this[0].getBoundingClientRect();
                    const expanded = {
                        left: rect.left - margin,
                        right: rect.right + margin,
                        top: rect.top - margin,
                        bottom: rect.bottom + margin
                    };

                    const cx = e.clientX;
                    const cy = e.clientY;

                    if (cx >= expanded.left && cx <= expanded.right && cy >= expanded.top && cy <= expanded.bottom) {
                        const x = cx - rect.left;
                        const y = cy - rect.top;

                        $cloneText.css({ transform: 'translate(' + (-x) + 'px,' + (-y) + 'px)' });
                        $cloneOuter.css({ transform: 'translate(' + x + 'px,' + y + 'px)' });
                    }
                });
            };

            init();

            jQuery(window).on('mousemove.maskExpand', onMouseMove);

            let resizeTimer;
            jQuery(window).on('resize.maskExpand', function () {
                clearTimeout(resizeTimer);
                resizeTimer = setTimeout(init, 50);
            });
        });
    }

    // Text Parallax
    let $text_parallax = jQuery('.wgl-text-editor.text_parallax');
    if ($text_parallax.length) {
        $text_parallax.each(function () {
            jQuery(this).paroller({
                type: 'foreground'
            });
        })
    }

    // Text Appear
    let $text_appear = jQuery('.wgl-text-editor.text_appear');
    if ($text_appear.length) {
        $text_appear.appear(function() {
            jQuery(this).addClass('appear');
        })
    }

    // Scroll Text Appear
    let $scroll_text_appear = jQuery('.wgl-text-editor.scroll_text_appear');
    if ($scroll_text_appear.length) {
        $scroll_text_appear.each(function () {

            const animationStartPercent = jQuery(this).data('start-percent');
            const animationDurationFactor = jQuery(this).data('duration-factor');
            const delayWords = jQuery(this).data('delay-words');
            const initialOpacity = jQuery(this).data('text-opacity');

            if (jQuery(this).hasClass('appear-opacity')) {
                var $scroll_text = jQuery(this).find('.text-editor_wrapper > span');
                $scroll_text.css("opacity", 1);
                function wrapWordsInSpans($element) {
                    const words = $element.text().split(" ");
                    const wrappedWords = words.map((word) => `<span>${word}</span>`).join(" ");
                    $element.html(wrappedWords);
                }

                $scroll_text.each(function () {
                    wrapWordsInSpans(jQuery(this));
                });

                const $spans = $scroll_text.find("span");

                jQuery(window).on("scroll resize", function () {
                    const rect = $scroll_text[0].getBoundingClientRect();
                    const elementHeight = rect.height;
                    const windowHeight = jQuery(window).height();

                    const start = (windowHeight * animationStartPercent) / 100;
                    const end = start + animationDurationFactor * elementHeight;

                    let progress = Math.max(0, Math.min(1, (windowHeight - rect.top - start) / (end - start)));

                    const step = 1 / $spans.length;
                    const delayStep = step * delayWords;

                    $spans.each(function (index) {
                        const wordStart = index * step;
                        const wordEnd = wordStart + delayStep;
                        const localProgress = Math.max(0, Math.min(1, (progress - wordStart) / (wordEnd - wordStart)));
                        const easedProgress = Math.pow(localProgress, 2) * (3 - 2 * localProgress);
                        const opacity = Math.min(1, (initialOpacity + easedProgress * (1 - initialOpacity))).toFixed(4);

                        jQuery(this).css("opacity", opacity);
                    });

                    if (progress === 1) {
                        $spans.css("opacity", 1);
                    }
                });
            } else if (jQuery(this).hasClass('appear-color')) {

                var $scroll_text = jQuery(this).find('.text-editor_wrapper');

                jQuery(window).on("scroll resize", function () {
                    const rect = $scroll_text[0].getBoundingClientRect();
                    const elementHeight = rect.height;
                    const windowHeight = jQuery(window).height();

                    const start = (windowHeight * animationStartPercent) / 100;
                    const end = start + animationDurationFactor * elementHeight;

                    let progress = Math.max(0, Math.min(1, (windowHeight - rect.top - start) / (end - start)));

                    const backgroundSize = `${progress * 100}% 100%`;
                    $scroll_text.css("background-size", backgroundSize);
                });
            }

            jQuery(window).trigger("scroll");
        })
    }

    // Split Stagger Text
    let $text_stagger = jQuery('.wgl-text-editor.stagger_text');
        if ($text_stagger.length) {
        gsap.registerPlugin(ScrollTrigger);
        $text_stagger.each(function () {
            // apply parallax effect to any element with a data-speed attribute
            gsap.to(jQuery(this).find('.text-editor_wrapper-clone'), {
            y: (i, el) => (1 - parseFloat(el.getAttribute("data-speed"))) * ScrollTrigger.maxScroll(window) ,
            ease: "none",
            scrollTrigger: {
                start: 0,
                end: "max",
                invalidateOnRefresh: true,
                scrub: 0
            }
            });
        });
    }

    // Split Letter Text
    let $letter_stagger = jQuery('.wgl-text-editor.stagger_letter_text');
    if ($letter_stagger.length) {
        gsap.registerPlugin(SplitText);

        $letter_stagger.each(function () {
            let $this = jQuery(this);

            let mySplitText = new SplitText($this, { type: "chars, words" });
            let chars = mySplitText.chars;
            let words = mySplitText.words;
            const charsTotal = chars.length;

            gsap.set(chars, {
                yPercent: 0,
                scaleY: 1,
                opacity: 1,
                transformOrigin: "center center"
            });

            let scroll = { cache: 0, current: 0 };
            let isScrolling = false;
            let scrollTimeout;

            function map(value, inMin, inMax, outMin, outMax) {
                return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
            }

            gsap.ticker.add(() => {
                scroll.current = window.scrollY;
                const distance = scroll.current - scroll.cache;
                scroll.cache = scroll.current;

                const scaleY = map(distance, -150, 150, 0.8, 1.5);

                const translateY = map(distance, -150, 150, -50, 50);

                // Animate if scrolling
                if (isScrolling) {
                    // Stretch words
                    gsap.to(words, {
                        scaleY: scaleY,
                        duration: 0.6,
                        ease: "power2.out"
                    });

                    chars.forEach((char, j) => {
                        const factor = j < Math.ceil(charsTotal / 2)
                            ? j
                            : Math.ceil(charsTotal / 2) - Math.abs(Math.floor(charsTotal / 2) - j) - 1;
                        const scrollSpeed = 1 + factor * 0.5;
                        const adjustedTranslateY = translateY * scrollSpeed;

                        gsap.to(char, {
                            yPercent: adjustedTranslateY,
                            opacity: 1,
                            duration: 1.2,
                            ease: "elastic.out(1, 0.5)"
                        });
                    });
                }

                clearTimeout(scrollTimeout);
                scrollTimeout = setTimeout(() => {
                    if (isScrolling) {
                        isScrolling = false;
                        gsap.to(chars, {
                            yPercent: 0,
                            opacity: 1,
                            duration: 0.8,
                            ease: "elastic.out(1, 0.5)"
                        });
                    }
                }, 150);
            });

            window.addEventListener("scroll", () => {
                isScrolling = true;
                clearTimeout(scrollTimeout);
                scrollTimeout = setTimeout(() => {
                    isScrolling = false;
                }, 150);
            });

            gsap.to(chars, {
                yPercent: 0,
                scaleY: 1,
                opacity: 1,
                duration: 0
            });
        });
    }
}
// WGL Time Line Vertical appear
function wglInitTimelineAppear(item) {
    let widgetSelector = '.wgl-timeline-vertical',
        widgetEl = item ? jQuery(item).find(widgetSelector) : jQuery(widgetSelector),
        resize = true;

    widgetEl.each(function () {
        if (widgetEl.hasClass('appear_animation')) {
            let items_appear = widgetEl.find('[class*="tlv__items-"]');
            if (items_appear.length) {
                items_appear.each(function () {
                    let item = jQuery(this);
                    item.appear(function () {
                        item.addClass('show');
                    });
                    item.appear(function () {
                        item.addClass('show');
                        recalculateCurveHeight(item, widgetEl);
                        jQuery(window).resize(function () {
                            recalculateCurveHeight(item, widgetEl, resize);
                        });
                    });
                });
            }
        }
    });

    function recalculateCurveHeight(item, widgetEl, resize = false) {
        let widgetOffsetTop = widgetEl.offset().top + window.scrollY,
            itemCenter = item.offset().top + window.scrollY + item.height() / 2,
            curveHeight = itemCenter - widgetOffsetTop;

        if (curveHeight > widgetEl.css( '--timeline-curve-height' ) || !!resize){
            widgetEl.css({'--timeline-curve-height': curveHeight});
        }
    }
}
// WGL Time Line Horizontal

function wglTimelineHorizontal() {
    var timeline_swiper = jQuery('.wgl-timeline-horizontal');
    if (timeline_swiper.length) {
        timeline_swiper.each(function () {
            if (window.elementorFrontend) {
                if (window.elementorFrontend.isEditMode()) {
                    wglTimilineSwiperInit(jQuery(this));
                } else {
                    elementorFrontend.on('components:init', () => {
                        wglTimilineSwiperInit(jQuery(this))
                    });
                }
            }
        });
    }
}
function wglTimilineSwiperInit(self) {

    const $container = self.find('.time_line_h-date_container'),
        $date_swiper = self.find('.time_line_h-date_container'),
        $content_swiper = self.find('.time_line_h-content_container');

    let wglDateSwiper,
        wglContentSwiper;

    const configData = $container.data('swiper') ? $container.data('swiper') : {};
    const itemID = $container.data('item-carousel') ? '[data-carousel="' + $container.data('item-carousel') + '"]' : '';

    const initial_slide = configData.initial_slide !== undefined ? configData.initial_slide : 0;
    const pagination = configData.pagination !== undefined ? configData.pagination : '.swiper-pagination' + itemID;
    const arrow_next = '.elementor-swiper-button-next' + itemID;
    const arrow_prev = '.elementor-swiper-button-prev' + itemID;

    if ('undefined' === typeof Swiper) {

        const asyncSwiper = window.elementorFrontend.utils.swiper;

        wglDateSwiper = new asyncSwiper($date_swiper, {
            slidesPerView: 'auto',
            slideActiveClass: 'slide-active',
            centeredSlides: true,
            slideToClickedSlide: true,
            initialSlide: initial_slide,
            navigation: {
                nextEl: arrow_next,
                prevEl: arrow_prev
            },
            pagination: {
                el: pagination,
                clickable: true,
                type: 'bullets',
                renderBullet: (index, className) => '<li class="' + className + '" role="presentation"><button type="button" role="tab" tabindex="-1">' + (index + 1) + '</button></li>',
            },
        });
        wglContentSwiper = new asyncSwiper($content_swiper, {
            slidesPerView: 'auto',
            slideActiveClass: 'slide-active',
            centeredSlides: true,
            slideToClickedSlide: true,
            initialSlide: initial_slide,
        });

        wglDateSwiper.then((newSwiperInstance) => {
            wglDateSwiper = newSwiperInstance;
        });
        wglContentSwiper.then((newSwiperInstance) => {
            wglContentSwiper = newSwiperInstance;

            wglDateSwiper.controller.control = wglContentSwiper;
            wglContentSwiper.controller.control = wglDateSwiper;
        });

    } else {

        wglDateSwiper = new Swiper($date_swiper[0], {
            slidesPerView: 'auto',
            slideActiveClass: 'slide-active',
            centeredSlides: true,
            slideToClickedSlide: true,
            initialSlide: initial_slide,
            navigation: {
                nextEl: arrow_next,
                prevEl: arrow_prev
            },
            pagination: {
                el: pagination,
                clickable: true,
                type: 'bullets',
                renderBullet: (index, className) => '<li class="' + className + '" role="presentation"><button type="button" role="tab" tabindex="-1">' + (index + 1) + '</button></li>',
            },
        });

        wglContentSwiper = new Swiper($content_swiper[0], {
            slidesPerView: 'auto',
            slideActiveClass: 'slide-active',
            centeredSlides: true,
            slideToClickedSlide: true,
            initialSlide: initial_slide,
        });

        wglDateSwiper.controller.control = wglContentSwiper;
        wglContentSwiper.controller.control = wglDateSwiper;
    }
}

function wglWoocommerceHelper(){
    let body = jQuery('body');
    body.on('click', '.quantity.number-input span.minus', function(e){
        this.parentNode.querySelector('input[type=number]').stepDown();
        if(document.querySelector('.woocommerce-cart-form [name=update_cart]')){
            document.querySelector('.woocommerce-cart-form [name=update_cart]').disabled = false;
        }
    });

    body.on('click', '.quantity.number-input span.plus', function(e){
        this.parentNode.querySelector('input[type=number]').stepUp();
        if(document.querySelector('.woocommerce-cart-form [name=update_cart]')){
            document.querySelector('.woocommerce-cart-form [name=update_cart]').disabled = false;
        }
    });

    jQuery('.wgl-products .product a.add_to_cart_button.ajax_add_to_cart').on( "click", function() {
        jQuery(this).closest('.product').addClass('added_to_cart_item');
    });

    let actionWrapper = jQuery('.action__wrapper');
    if (actionWrapper.length) {
        jQuery('.cart_totals').css({'min-height': actionWrapper.height() });
        jQuery(window).resize(function () {
            jQuery('.cart_totals').css({'min-height': actionWrapper.height() });
        });
    }

    let button_reset = jQuery('.wgl-reset-filter'),
        filter_button = jQuery('.wgl-filter-button'),
        filter_wrapper = jQuery('.wgl-filter-products'),
        inner_wrapper = filter_wrapper.find('.sidebar-container');
    if (button_reset.length && inner_wrapper.length) {
        inner_wrapper.append( button_reset );
    }

    body.on('click tap', '.wgl-filter-button', function(e){
        if (!filter_button.hasClass('active')) {
            wglFilterAreaOpen();
        }else {
            wglFilterAreaClose();
        }
    });

    body.on('click tap', '.wgl-filter-overlay, .wgl-filter-close, .wgl-reset-filter', function(e){
        wglFilterAreaClose();
    });

    body.on('click tap',function(e) {
        if (e.target !== filter_wrapper[0] && !filter_wrapper.has(e.target).length && e.target !== filter_button[0] && !filter_button.has(e.target).length) {
            wglFilterAreaClose();
        }
    });

    jQuery(document).on('keydown', function(e) {
        if (e.which === 27 && filter_button.hasClass('active')) {
            wglFilterAreaClose();
        }
    });

    function wglFilterAreaOpen(){
        filter_button.addClass('active');
        filter_wrapper.animate({
            paddingBottom: "show",
            height: "show",
            opacity: "show"
        }, "slow").addClass('active');
    }
    function wglFilterAreaClose(){
        filter_button.removeClass('active');
        filter_wrapper.animate({
            paddingBottom: "hide",
            height: "hide",
            opacity: "hide"
        }, "slow").removeClass('active');
    }

    /* WooCommerce Tabs */
    let tabsWrapper = jQuery('.tabs.wc-tabs');
    if (tabsWrapper.length) {
        tabsWrapper.addClass('swiper-wrapper').wrap('<div class="swiper"></div>');
        tabsWrapper.children().addClass('swiper-slide');
        const swiper = new Swiper('.wc-tabs-wrapper .swiper', {
            slidesPerView: 'auto',
            freeMode: true,
        });
    }
}

function wglWoocommerceLoginIn() {
    var login_in = jQuery('.login-in');
    if (login_in.length) {
        var mc = login_in,
            icon = mc.find('a.login-in_link'),
            overlay = mc.find('div.overlay');

        icon.on('click tap', function(e) {
            e.preventDefault();
            mc.toggleClass('open_login');
        });

        var eventClose = function(e) {
            if (
                !jQuery(e.target).closest('.modal_content').length &&
                !jQuery(e.target).is('.modal_content')
            ) {
                mc.removeClass('open_login');
            }
        };

        overlay.on('click tap', eventClose);

        jQuery(document).on('keydown', function(e) {
            if (e.which === 27) eventClose(e);
        });
    }
}
function wglWoocommerceMiniCart(){
    var mini_cart = jQuery('header .wgl-cart-header .mini-cart');
    if (mini_cart.length) {
        mini_cart.each(function(){
            var overlay = jQuery('div.mini_cart-overlay'),
                eventClose = function(e) {
                    jQuery('.wgl-theme-header').removeClass('open_cart');
                };

            jQuery('a.woo_icon').on('click tap', function() {
                jQuery('.wgl-theme-header').toggleClass('open_cart');
            });
            overlay.on('click tap', eventClose);

            jQuery(document).on('keydown', function(e) {
                if (e.which === 27) eventClose(e);
            });
        });
    }
}
// Select Wrapper
function wglSelectWrap() {
    jQuery('select').each(function () {
        var $select = jQuery(this);
        if ($select.hasClass('first-disable')){
            jQuery('option:first-child', $select).attr('disabled',true);
        }
    });
}

function wglButtonAnimation() {
    jQuery('.wgl-button.with-border:not(.load_more_item)').each(function () {
        let $_this = jQuery(this);
        $_this.on('click tap', function(){
            $_this.addClass('animated');
            setTimeout(function(){
                $_this.removeClass('animated');
            },600)
        });
    });
    jQuery('.wgl-button').each(function () {
        jQuery(this).on('touchstart mouseenter', function(){
            jQuery(this).find('.highlight_svg').removeClass('hide-highlight').addClass('active')
        }).on("touchend mouseleave", function () {
            jQuery(this).find('.highlight_svg').addClass('hide-highlight').removeClass('active')
        });
    });
}

// WGL Zoom Init

function wglInitZoom() {
    const zoom = document.querySelectorAll('.wgl-zoom');
    const viewportHeight = window.innerHeight;

    if (zoom.length) {
        zoom.forEach(wglZoomInit);
    }

    function wglZoomInit(self) {
        const animatedSection = self;
        const wrapper = animatedSection.querySelector('.wgl-zoom_wrapper');
        const items = Array.from(animatedSection.querySelectorAll('.wgl-zoom_item__wrapper'));
        const speed = animatedSection.getAttribute('data-speed');

        const itemsData = items.map( item => {
            const deviceMode = document.body.getAttribute('data-elementor-device-mode'),
                configData = JSON.parse(item.dataset.zoom);

            const getResponsiveValue = (value) => {
                const tabletValue = configData[value + '_tablet'],
                    mobileValue = configData[value + '_mobile'];

                if (deviceMode === 'tablet') {
                    return tabletValue !== '' ? tabletValue : configData[value];
                } else if (deviceMode === 'mobile') {
                    return mobileValue !== '' ? mobileValue : tabletValue !== '' ? tabletValue : configData[value];
                } else {
                    return configData[value];
                }
            };
            const getResponsiveUnit = (unit) => {
                const desktopUnit = configData[unit + '_unit'],
                    tabletUnit = configData[unit + '_tablet_unit'],
                    mobileUnit = configData[unit + '_mobile_unit'];

                if (deviceMode === 'tablet') {
                    return tabletUnit !== '' ? tabletUnit : desktopUnit;
                } else if (deviceMode === 'mobile') {
                    return mobileUnit !== '' ? mobileUnit : tabletUnit !== '' ? tabletUnit : desktopUnit;
                } else {
                    return desktopUnit;
                }
            };

            return {
                item: item,
                timeFrom: configData['time_from'],
                timeTo: configData['time_to'],
                scaleFrom: getResponsiveValue('scale_from'),
                scaleTo: getResponsiveValue('scale_to'),
                opacityFrom: configData['opacity_from'],
                opacityTo: configData['opacity_to'],
                blurFrom: getResponsiveValue['blur_from'],
                blurTo: getResponsiveValue['blur_to'],
                vPosFrom: getResponsiveValue('vert_pos_from'),
                vPosTo: getResponsiveValue('vert_pos_to'),
                hPosFrom: getResponsiveValue('hor_pos_from'),
                hPosTo: getResponsiveValue('hor_pos_to'),
                vPosUnit: getResponsiveUnit('vert_pos_from'),
                hPosUnit: getResponsiveUnit('hor_pos_from'),

                bgTimeFrom: configData['bg_time_from'],
                bgTimeTo: configData['bg_time_to'],
                bgScaleFrom: getResponsiveValue('bg_scale_from'),
                bgScaleTo: getResponsiveValue('bg_scale_to'),
                bgOpacityFrom: configData['bg_opacity_from'],
                bgOpacityTo: configData['bg_opacity_to'],
            };
        });

        let isView = 0,
            isViewBG = 0;

        function onScroll() {
            isView = wglZoomIsView();
            wglZoomWrapperRender(wrapper, animatedSection, viewportHeight, isView);
            itemsData.forEach(data => {
                wglZoomItemRender(data, isView, isViewBG);
            });
        }

        document.addEventListener('scroll', onScroll, { passive: true });
        onScroll();

        function wglZoomItemRender(data, isView) {

            const item = data.item;
            let timeFrom = data.timeFrom ?? '',
                timeTo = data.timeTo ?? '',
                scaleFrom = data.scaleFrom ?? '',
                scaleTo = data.scaleTo ?? '',
                opacityFrom = data.opacityFrom ?? '',
                opacityTo = data.opacityTo ?? '',
                blurFrom = data.blurFrom ?? '',
                blurTo = data.blurTo ?? '',
                vPosFrom = data.vPosFrom ?? '',
                vPosUnit = data.vPosUnit ?? '%',
                vPosTo = data.vPosTo ?? '',
                hPosFrom = data.hPosFrom ?? '',
                hPosTo = data.hPosTo ?? '',
                hPosUnit = data.hPosUnit ?? '%',

                bgTimeFrom = data.bgTimeFrom ?? '',
                bgTimeTo = data.bgTimeTo ?? '',
                bgScaleFrom = data.bgScaleFrom ?? '',
                bgScaleTo = data.bgScaleTo ?? '',
                bgOpacityFrom = data.bgOpacityFrom ?? '',
                bgOpacityTo = data.bgOpacityTo ?? '';

            const lerp = (x, y, a) => x * (1 - a) + y * a,
                clamp = (a, min = 0, max = 1) => Math.min(max, Math.max(min, a)),
                invlerp = (x, y, a) => clamp((a - x) / (y - x)),
                range = (x1, y1, x2, y2, a) => lerp(x2, y2, invlerp(x1, y1, a));

            if (scaleFrom !== '') {
                scaleTo = scaleTo !== '' ? scaleTo : scaleFrom;
                let scale = range(timeFrom, timeTo,scaleFrom, scaleTo, isView).toFixed(3);
                item.style.setProperty('--wgl-zoom-scale', (scale < 0 ? 0 : scale));
            }
            if (opacityFrom !== '') {
                opacityTo = opacityTo !== '' ? opacityTo : opacityFrom;
                let opacity = range(timeFrom, timeTo,opacityFrom, opacityTo, isView).toFixed(3);
                item.style.setProperty('--wgl-zoom-opacity', (opacity < 0 ? 0 : (opacity > 1 ? 1 : opacity)));
            }
            if (blurFrom !== '') {
                blurTo = blurTo !== '' ? blurTo : blurFrom;
                let blur = range(timeFrom, timeTo,blurFrom, blurTo, isView).toFixed(3);
                item.style.setProperty('--wgl-zoom-blur', ((blur < 0 ? 0 : blur) + 'px)'));
            }
            if (vPosFrom !== '') {
                vPosTo = vPosTo !== '' ? vPosTo : vPosFrom;
                let vPos = range(timeFrom, timeTo,vPosFrom, vPosTo, isView).toFixed(3);
                item.style.setProperty('--wgl-zoom-v-pos', vPos + vPosUnit);
            }
            if (hPosFrom !== '') {
                hPosTo = hPosTo !== '' ? hPosTo : hPosFrom;
                let hPos = range(timeFrom, timeTo,hPosFrom, hPosTo, isView).toFixed(3);
                item.style.setProperty('--wgl-zoom-h-pos', hPos + hPosUnit);
            }

            if (bgScaleFrom !== '') {
                bgScaleTo = bgScaleTo !== '' ? bgScaleTo : bgScaleFrom;
                let scale = range(bgTimeFrom, bgTimeTo,bgScaleFrom, bgScaleTo, isView).toFixed(5);
                item.style.setProperty('--wgl-zoom-bg-scale', (scale < 0 ? 0 : scale));
            }
            if (bgOpacityFrom !== '') {
                bgOpacityTo = bgOpacityTo !== '' ? bgOpacityTo : bgOpacityFrom;
                let opacity = range(bgTimeFrom, bgTimeTo,bgOpacityFrom, bgOpacityTo, isView).toFixed(5);
                item.style.setProperty('--wgl-zoom-bg-opacity', (opacity < 0 ? 0 : (opacity > 1 ? 1 : opacity)));
            }
        }

        function wglZoomWrapperRender(wrapper, animatedSection, viewportHeight, isView) {
            jQuery(animatedSection).toggleClass('zoom_fixed', isView > 0 && isView < 1);
            jQuery(animatedSection).toggleClass('zoom_completed', isView >= 1);
        }

        function wglZoomIsView(bg = false) {
            let rect = animatedSection.getBoundingClientRect(),
                parameter = (viewportHeight - rect.top) / rect.height - 1;

            parameter = parameter / speed;
            return parameter < -1 ? -1 : (parameter > 2 ? 2 : parameter);
        }
    }
}