/*global $, CORE, FB, document, jQuery, window, particlesJS */

jQuery.noConflict();
(function ($) {
    'use strict';
    $(function () {
        /* ---------------------------------------------------------------------------
         * Announcement Drawer
         * --------------------------------------------------------------------------- */
        var cookieArray = document.cookie.split(';');
        console.log(cookieArray);
        var announcementDrawer = parseInt(cookieArray.indexOf(" accouncementdrawer=true"));
        if (announcementDrawer <= 0) {
            announcementDrawer = parseInt(cookieArray.indexOf("accouncementdrawer=true"));
        }

        if (parseInt(announcementDrawer) === -1) {
            console.log('remodal needs to launhc: ' + announcementDrawer);
            // Scroll user to the top to ensure they see the drawer
            $('html, body').animate({
                scrollTop: 0
            }, 10);

            $('.announcement-bar').slideDown().on('click', '.close', function () {
                var $this = $(this);

                $this.parents('.announcement-bar').slideUp();
                document.cookie = "accouncementdrawer=true; path=/";
                return false;
            });
        } else {
            console.log('remodal already launched: ' + announcementDrawer);
        }


        /* ---------------------------------------------------------------------------
        * General Methods/Events
        * --------------------------------------------------------------------------- */
        var general = {
            mainHeader: $('header[role="main"]'),
            mainNav: $('header nav[role="navigation"]'),
            init: function () {
                var self = this;
                var lastScrollTop = 0;
                self.mainNav.find('.dropdown').css('display', 'flex').hide();

                // element should be replaced with the actual target element on which you have applied scroll, use window in case of no target element.
                window.addEventListener("scroll", function () { // or window.addEventListener("scroll"....
                    var paddingTop;
                    var $announcementBarHeight = $('.announcement-bar').outerHeight();
                    var currentScollPos = window.pageYOffset || document.documentElement.scrollTop;
                    if (currentScollPos > lastScrollTop) {
                        // downscroll code
                        // console.log('scroll DOWN: ' + currentScollPos);
                        if (currentScollPos <= $announcementBarHeight) {
                            paddingTop = $announcementBarHeight - currentScollPos;

                            self.mainHeader.css('padding-top', paddingTop);
                        } else {
                            self.mainHeader.css('padding-top', 0);
                        }
                    } else {
                        // upscroll code
                        // console.log('scroll UP: ' + currentScollPos);
                        if (currentScollPos <= $announcementBarHeight) {
                            paddingTop = $announcementBarHeight - currentScollPos;

                            if (currentScollPos === 0) {
                                paddingTop = '2rem';
                            }

                            self.mainHeader.css('padding-top', paddingTop);
                        }
                    }

                    lastScrollTop = currentScollPos <= 0
                        ? 0
                        : currentScollPos; // For Mobile or negative scrolling
                }, false);

                $('.hamburger').on('click', function () {
                    var $this = $(this);
                    var $thisWidth = $this.outerWidth();
                    var $menuWrapper = $('header .menu-wrapper');
                    var $navItems = self.mainNav.find('li');

                    var hideShowNavItems = function (type) {
                        switch (type) {
                        case 'show':
                            $navItems.each(function (index, el) {
                                setTimeout(function () {
                                    $(el).animate({
                                        opacity: 1
                                    }, 200);
                                }, 10 * index);
                            });

                            break;
                        case 'hide':
                            $navItems.css('opacity', 0);
                            self.mainNav.find('.dropdown').slideUp().end()
                                .find('li').removeClass('active');
                            break;
                        }


                    };

                    $this.toggleClass('is-active');

                    if ($this.hasClass('is-active')) {
                        var expandTo = '100%';
                        if (window.innerWidth < 800) {
                            expandTo = 'auto';
                        }

                        hideShowNavItems('hide');
                        $menuWrapper.stop().animate({
                            width: expandTo
                        }, 400);

                        setTimeout(function () {
                            self.mainNav.show();
                            hideShowNavItems('show');
                        }, 150);
                    } else {
                        self.mainNav.hide();
                        hideShowNavItems('hide');
                        $menuWrapper.stop().animate({
                            width: $thisWidth
                        }, 100);
                    }

                    return false;
                }).parent().find('nav');

                self.mainNav.on('click', 'a[aria-haspopup="true"]', function () {
                    var $this = $(this);
                    var $thisDropDown = $this.siblings('.dropdown');

                    self.mainNav.find('.dropdown').slideUp('fast').end()
                        .find('li').removeClass('active');

                    if ($thisDropDown.is(':visible')) {
                        $thisDropDown.slideUp('fast');
                    } else {
                        $this.parent().addClass('active');
                        $thisDropDown.slideDown('slow').css('display', 'flex');
                    }
                    return false;
                });


            }
        };

        general.init();

        /* ---------------------------------------------------------------------------
        * Lazy Load Videos
        * --------------------------------------------------------------------------- */
        var lazyLoadVideo = {
            init: function () {
                var self = this;

                $(window).on('scroll', function () {
                    // Store the document's scroll top position
                    self.checkBackgroundVideo();
                });

                self.checkBackgroundVideo();

                $(window).resize(function () {
                    self.setVideoSource();
                });

            },
            checkBackgroundVideo: function () {
                var self = this;
                var $docScrollTop = $(document).scrollTop();

                console.log('load background');
                $('.lz-video:not(.loaded)').each(function () {
                    var $videoEmbed;
                    var $this = $(this);
                    var $thisTop = parseInt($this.position().top);
                    var $thisPoster = $this.data('poster');
                    var $thisVideoID = $this.data('id');
                    var $thisVideoURL = self.getVideoSource($this);
                    var $threshold = 1500;
                    var $windowHeight = $(window).height();

                    $videoEmbed = $('<video id="' + $thisVideoID + '" class="play-video" autoplay playsinline loop muted poster="' + $thisPoster + '"><source src="' + $thisVideoURL + '" type="video/mp4">Your browser does not support the video tag.</video>');

                    if (($thisTop - $docScrollTop - $windowHeight) <= $threshold) {
                        console.log('found');
                        $this.addClass('loaded').find('.banner-video-wrapper').empty().append($videoEmbed);

                        // $('#' + $thisVideoID).get(0).play();
                        // console.log('trigger play');
                    }
                });

            },
            getVideoSource: function ($theVideo) {
                var $newVideoSource;
                var $windowWidth = $(window).width();

                if ($windowWidth > 1024) {
                    $newVideoSource = $theVideo.data('vurl');
                } else {
                    $newVideoSource = $theVideo.data('vurlm');
                }

                return $newVideoSource;
            },
            setVideoSource: function () {
                var self = this;

                $('.lz-video.loaded').each(function () {
                    var $this = $(this);
                    var $videoMP4Source = $this.find('video source[type="video/mp4"]');
                    var $currentVideoSource = $videoMP4Source.attr('src');
                    var $thisVideoID = $(this).find('video').prop('id');
                    var $newVideoSource = self.getVideoSource($this);

                    if ($newVideoSource !== $currentVideoSource) {
                        console.log('SOURCE CHANGE');
                        $videoMP4Source.attr('src', $newVideoSource);
                        document.getElementById($thisVideoID).load();
                    } else {
                        console.log('already that source');
                    }

                });
            }
        };

        if ($('.lz-video').length) {
            lazyLoadVideo.init();
        }

        /* ---------------------------------------------------------------------------
        * Capabilities Slider - Homepage
        * --------------------------------------------------------------------------- */
        var capesSlider = {
            isAnimating: false,
            allSlides: $('.slide-content .slide'),
            currentActiveSlide: 1,
            mainContainer: $('section.capabilities-part'),
            theSlider: $('.image-controls[role="Capabilites"]'),
            // totalSlides: $('.slide-content .slide').length,
            totalSlides: $('.slide-content').attr('data-slide-count'),
            activeWidth: 0,
            slideWidth: 0,
            init: function () {
                var self = this;

                if (self.totalSlides <= 5) {
                    self.activeWidth = '66.25%';
                    self.slideWidth = (33.75/(self.totalSlides - 1)) + '%';//'8.4375%';
                } else {
                    self.activeWidth = '50%';
                    self.slideWidth = (50/(self.totalSlides - 1)) + '%';
                }

                self.theSlider.find('a').css('width', self.slideWidth).end().
                    find('.active').css('width', self.activeWidth);

                // Image Nav
                self.theSlider.on('mouseenter', 'a', function () {
                    var $this = $(this);
                    var $thisID = $this.data('id');

                    if (!$this.hasClass('active') && (window.outerWidth >= 768)) {
                        self.changeSlide($thisID, true);
                    }

                    return false;
                }).on('mouseleave', 'a', function () {
                    if (window.outerWidth >= 768) {
                        self.changeSlide(self.currentActiveSlide, true);

                        self.isAnimating = false;
                    }

                    return false;
                }).on('click', 'a', function () {
                    var $this = $(this);
                    var $thisID = $this.data('id');
                    if (window.outerWidth >= 768) {
                        self.changeSlide($thisID);
                    }

                    return false;
                });

                // Arrow Nav
                $('.capabilities-part .controls').on('click', '.prev', function () {
                    var prevID = self.currentActiveSlide - 1;

                    if (prevID < 1) {
                        prevID = self.totalSlides;
                    }

                    self.changeSlide(prevID);

                    return false;
                }).on('click', '.next', function () {
                    var nextID = self.currentActiveSlide + 1;

                    if (nextID > self.totalSlides) {
                        nextID = 1;
                    }

                    self.changeSlide(nextID);

                    return false;
                });

                // Number nav
                // $('.total-slides').on('click', 'a', function () {
                //     var $this = $(this);
                //     var $thisID = $this.data('id');

                //     self.changeSlide($thisID);
                //     return false;
                // });
            },
            changeSlide: function (id, isTemp = false) {
                // account for 0 based index;
                var self = this;
                // Get the active slide DOM element
                var $activeSlide = self.allSlides.eq(id - 1);
                var $activeWidth = self.activeWidth;
                var $slideWidth = self.slideWidth;

                console.log($slideWidth);
                // var $replacedID = self.currentActiveSlide;
                // Set the current active slide ID
                if (!isTemp) {
                    self.currentActiveSlide = id;
                }

                // FadeIn/Out Side content
                $activeSlide.siblings().css('position', 'absolute').stop().fadeOut().end().stop()
                    .css('position', 'relative').fadeIn();

                // Update current slide out of total
                // self.mainContainer.find('.current').text('0' + id);

                // change the image
                // check if smaller than tablet
                console.log('isAnimating1 = ' + self.isAnimating);
                if (!self.isAnimating) {
                    self.isAnimating = true;
                    console.log('isAnimating2 = ' + self.isAnimating);
                    if (window.outerWidth < 768) {
                        // FadeIn/FadeOut
                        self.theSlider.find('.cape-nav-img').css('z-index', 1).end()
                            .find('.cape-nav-img[data-id="' + id + '"]').hide().css('z-index', 3).fadeIn();
                        self.isAnimating = false;
                    } else {
                        // Slide Slice to full width
                        console.log('isAnimating3 = ' + self.isAnimating);
                        self.theSlider.find('.cape-nav-img[data-id="' + id + '"]')
                            .siblings().stop().removeClass('active').animate({width: $slideWidth}, 100, function () {
                                self.isAnimating = false;
                                console.log('isAnimating4 reset= ' + self.isAnimating);
                            }).end()
                            .stop().addClass('active').animate({width: $activeWidth}, 100);
                        console.log('isAnimating5 = ' + self.isAnimating);
                    }
                }

                // Change highlighted number
                // $('.total-slides a').removeClass('active').filter('[data-id="' + id + '"]').addClass('active');

            }
        };

        if ($('.image-controls[role="Capabilites"]').length) {
            capesSlider.init();
        }

        /* ---------------------------------------------------------------------------
        * Class for scroll to ID
        * --------------------------------------------------------------------------- */
        var scrollTo = {
            init: function () {
                var self = this;

                $('.scroll-to').on('click', function () {
                    var $this = $(this);
                    var $sectionID = $this.prop('href').split('#')[1];

                    self.fetchToPos($sectionID);
                    return false;
                });

            },
            fetchToPos: function ($id) {
                var self = this;
                var $fetchOffset = $('#' + $id).position().top;

                self.scrollToSection($fetchOffset);
            },
            scrollToSection: function ($top) {
                console.log('|*|*|*|*|*|*|*|*|* TOP: ' + $top);
                // Animate the scroll to the active section
                $('html, body').animate({
                    scrollTop: $top
                });
            }
        };

        // Initiate the one page nav
        if ($('.scroll-to').length) {
            console.log('init scroll to');
            scrollTo.init();
        }

        /* ---------------------------------------------------------------------------
        * Add Particle Animation
        * --------------------------------------------------------------------------- */
        // Footer
        particlesJS.load('footer-particles', '/wp-content/themes/artera/assets/js/footer-particles.json', function () {
            console.log('particles.js loaded - callback');
        });

        // About Artera - Above Footer
        if ($('.about-artera').length) {
            particlesJS.load('about-particles', '/wp-content/themes/artera/assets/js/about-particles.json', function () {
                console.log('particles.js loaded - callback');
            });
        }

        // Callout Quotes with color backgrounds
        if ($('.callout-quote-bkgd').length) {
            particlesJS.load('callout-particles', '/wp-content/themes/artera/assets/js/callout-blue-particles.json', function () {
                console.log('particles.js loaded - callback');
            });
        }

        // Callout Quotes with color backgrounds
        if ($('.banner-particles').length) {
            particlesJS.load('banner-particles', '/wp-content/themes/artera/assets/js/banner-particles.json', function () {
                console.log('particles.js loaded - callback');
            });
        }

        /* ---------------------------------------------------------------------------
        * Timeline Slider
        * --------------------------------------------------------------------------- */
        if ($('.timeline').length) {
            // get middle index of timeline dots
            var centerIndex;
            var count = jQuery(".dot-slider span").length;
            if (count % 2 === 0) {
                centerIndex = count / 2;
            } else {
                centerIndex = (count + 1) / 2;
            }

            $('.timeline .content-slider').slick({
                arrows: true,
                asNavFor: '.dot-slider',
                fade: true,
                nextArrow: '.slick-next-content',
                prevArrow: '.slick-prev-content',
                slidesToShow: 1,
                slidesToScroll: 1,
                speed: 500,
                infinite: true
                // autoplay: true
            });
            $('.dot-slider').slick({
                centerMode: true,
                // centerMode: false,
                asNavFor: '.timeline .content-slider',
                //fade: true,
                focusOnSelect: true,
                nextArrow: '.slick-next-content',
                prevArrow: '.slick-prev-content',
                slidesToShow: 5,
                slidesToScroll: 1,
                speed: 500,
                infinite: true
            });

            // jump to center slide into timeline
            $('.dot-slider').slick('slickGoTo', centerIndex - 1);
        }

        /* ---------------------------------------------------------------------------
        * Company Slider
        * --------------------------------------------------------------------------- */
        if ($('.company-slider').length) {
            $('.company-slider nav').slick({
                arrows: true,
                autoplay: true,
                autoplaySpeed: 2000,
                centerMode: true,
                focusOnSelect: false,
                infinite: true,
                slidesToScroll: 1,
                slidesToShow: 5,
                variableWidth: true,
                speed: 500,
                responsive: [
                    {
                        breakpoint: 768,
                        settings: {
                            slidesToShow: 1,
                            variableWidth: true
                        }
                    }
                ]
            });
        }

        /* ---------------------------------------------------------------------------
        * Companies Served Slider
        * --------------------------------------------------------------------------- */
        if ($('.companies-served').length) {
            // $('.companies-served ul').unslick();
            var companiesSlickSettings = {
                arrows: true,
                autoplay: true,
                autoplaySpeed: 0,
                centerMode: true,
                focusOnSelect: false,
                nextArrow: '.slick-next-company',
                prevArrow: '.slick-prev-company',
                infinite: true,
                mobileFirst: true,
                slidesToScroll: 1,
                slidesToShow: 1,
                speed: 500,
                vertical: true,
                responsive: [
                    {
                        breakpoint: 600,
                        settings: {
                            slidesToScroll: 2,
                            slidesToShow: 2
                        }
                    }
                ]
            };

            var companiesSlickSlider = $('.companies-served ul').slick(companiesSlickSettings);

            // $(window).resize(function () {
            //     var $windowWidth = $(window).width();
            //     if ($windowWidth > 768 && companiesSlickSlider.getSlick()) {
            //         console.log('reinit slick');
            //     } else if ($windowWidth < 768) {
            //         console.log('unslick');
            //         companiesSlickSlider.unslick();
            //     }
            // });
        }

        /* ---------------------------------------------------------------------------
        * Featured News Slider
        * --------------------------------------------------------------------------- */
        if ($('.featured-news').length) {
            $('.featured-news .list').slick({
                arrows: false,
                autoplay: true,
                autoplaySpeed: 2000,
                dots: false,
                // focusOnSelect: false,
                infinite: true,
                // mobileFirst: true,
                slidesToScroll: 1,
                slidesToShow: 4,
                speed: 500,
                responsive: [
                    {
                        breakpoint: 1000,
                        settings: {
                            slidesToShow: 3
                        }
                    },
                    {
                        breakpoint: 768,
                        settings: {
                            slidesToShow: 2
                        }
                    },
                    {
                        breakpoint: 600,
                        settings: {
                            slidesToShow: 1
                        }
                    }
                ]
            });
        }

        /* ---------------------------------------------------------------------------
        * Accordions
        * --------------------------------------------------------------------------- */
        if ($('.accordion').length) {

            var accordions = {
                init: function () {
                    var self = this;

                    $('.accordion').on('click', '.trigger', function () {
                        var $this = $(this);
                        var $thisAccordion = $this.parents('.accordion');
                        var $thisHiddenContent = $this.siblings('.content-hidden');
                        if ($thisAccordion.hasClass('allow-multiple')) {
                            $this.toggleClass('active');
                            $thisHiddenContent.slideToggle();
                        } else {

                            $thisAccordion.find('.content-hidden').slideUp().end()
                                .find('.trigger.active').removeClass('active');

                            if ($thisHiddenContent.is(':hidden')) {
                                $this.addClass('active');
                                $thisHiddenContent.slideDown();
                            }
                        }

                        if ($('.hamburger.is-active').length) {
                            $('.hamburger').trigger('click');
                        }

                        return false;
                    });

                    // check for leader in hash on page load
                    if (window.document.location.hash !== '' && $('' + window.document.location.hash).length) {
                        self.hashTrigger();
                    }

                    // Onhashchange for nav
                    $(window, document).on('hashchange', function () {
                        self.hashTrigger();

                    });
                },
                hashTrigger: function () {
                    // Open the details for leader
                    var $accordionID = window.document.location.hash.split('#')[1];
                    // Get top position of expanded accordion
                    var $expandedAccordion = $('#' + $accordionID);
                    var $accordionTopPosition;

                    $expandedAccordion.trigger('click');

                    setTimeout(function () {
                        $accordionTopPosition = $expandedAccordion.offset().top;

                        // Scroll body to top of container
                        $('html, body').animate({
                            scrollTop: $accordionTopPosition
                        });

                        if ($('.hamburger.is-active').length) {
                            $('.hamburger').trigger('click');
                        }

                    }, 300);

                }
            };

            accordions.init();

        }

        /* ---------------------------------------------------------------------------
        * Leader Details
        * --------------------------------------------------------------------------- */
        if ($('.leader').length) {
            var leaders = {
                init: function () {
                    var self = this;

                    // check for leader in hash
                    if (window.document.location.hash !== '' && $('' + window.document.location.hash).length) {
                        // Open the details for leader
                        self.showDetails(window.document.location.hash.split('#')[1]);
                    }

                    $('.leader').on('click', function () {
                        var $this = $(this);
                        // isolate the slug of the leader
                        var $thisID = $this.prop('href').split('#')[1];
                        console.log($thisID);

                        // Pass slug to showDetails function
                        self.showDetails($thisID);
                        return false;
                    });

                    $('.close').on('click', function () {
                        var $this = $(this);
                        // Hide the detail view for leader
                        $this.parents('.leader-detail').fadeOut();
                        return false;
                    });
                },
                showDetails: function (showID) {
                    // Get the detail container for current leader
                    var $detailContainer = $('.leader-detail#' + showID);
                    console.log($detailContainer);

                    $('#' + showID).fadeIn(function () {
                        // Get top position of detail container
                        var $detailTopPosition = $detailContainer.offset().top;

                        // Scroll body to top of container
                        $('html, body').animate({
                            scrollTop: $detailTopPosition
                        });
                    });
                }
            };

            leaders.init();
        }

        //Location Scripts
        if ($('#geolocator').length) {
            var $searchIcon = $('input.icon--search.field-holder__icon');
            var $geolocator = $('#geolocator');
            var $geolocatorText = $('<p>or <span class="location-finder">Use My Location</span></p>');
            var $addressInputBox = $('#ssf_adress_input_box');
            var $storeLocatorHeadline = $('<h1 class="store-locator__headline">Our Operating Companies</h1>');
            var $storeLocatorTitle = $('<div class="store-locator__title"><h2>Find a Location Near You</h2></div>');
            var $showAllButton = $('#filterShowAll');
            var $showAllButtonText = $('<span>All Locations</span>');

            $showAllButton.html($showAllButtonText);
            $searchIcon.val('Find Locations');
            $searchIcon.css({
                background: '#c45003'
            });
            $geolocator.html($geolocatorText);
            $addressInputBox.prepend($storeLocatorTitle);
            $storeLocatorTitle.prepend($storeLocatorHeadline);
        }

        if ($('#storeLocator__storeListRow').length) {
            var $storeLocatorRadiusRow = $('#storeLocator__storeListRow');
            var $storeLocatorRadiusToggler = $('.filter__toggler');
            var $storeLocatorFilter = $('#filter_left_panel');

            $($storeLocatorRadiusToggler).click(function () {
                $storeLocatorRadiusRow.toggleClass("is-toggled");
                $storeLocatorFilter.toggleClass("is-toggled");
            });
        }

        //Investors Page Move CTA Button Above Graphic on Mobile
        if ($('.investors').length) {
            // var self = this;

            if (window.outerWidth < 768) {
                $('.cta-list').each(function () {
                    $(this).insertAfter($(this).parent().find('.body-copy'));
                });
            } else if (window.outerWidth >= 768) {
                $('.cta-list').each(function () {
                    $(this).insertAfter($(this).parent().find('.company-wrapper'));
                });
            }
        }

    });
}(jQuery));