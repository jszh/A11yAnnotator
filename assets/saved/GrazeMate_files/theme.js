"use strict";

wglIsVisibleInit();

jQuery(document).ready(function ($) {
    wglInitZoom();
    wglContentMinHeight();
    wglStickyInit();
    wglSearchInit();
    wglSidePanelInit();
    wglMobileHeader();
    wglWoocommerceHelper();
    wglWoocommerceLoginIn();
    wglInitTimelineAppear();
    wglAccordionInit();
    wglAppear();
    wglServicesAccordionInit();
    wglStripedServicesInit();
    wglProgressBarsInit();
    wglCarouselSwiper();
    wglFilterSwiper();
    wglImageComparison();
    wglCounterInit();
    wglCountdownInit();
    wglImgLayers();
    wglPageTitleParallax();
    wglExtendedParallax();
    wglScrollUp();
    wglLinkOverlay();
    wglLinkScroll();
    wglSkrollrInit();
    wglStickySidebar();
    wglVideoboxInit();
    wglParallaxVideo();
    wglTabsHorizontalInit();
    wglShowcaseInit();
    wglHighlightBoardInit();
    wglCircuitService();
    wglSelectWrap();
    wglScrollAnimation();
    wglWoocommerceMiniCart();
    wglTextBackground();
    wglDynamicStyles();
    wglPieChartInit();
    wglButtonAnimation();
    wglPhysicsButton();
    wglTimelineHorizontal();
    wglButton();
    wglTextEditor();
    wglPageTitleParallax();
    wglInitDblhAppear();
    wglListingsSearch();
    wglProfile();
    wglInfinityCarousel();
    wglMessageAnimInit();
    wglInitHorizontalScroll();
    wglGalleryAnimation();
});

jQuery(window).load(function () {
    wglServiceInit();
    wglTabsInit();
    wglCursorInit();
    wglImagesGallery();
    wglIsotope();
    wglBlogMasonryInit();
    setTimeout(function(){
        jQuery('#preloader-wrapper').fadeOut();
    },1100);

    wglParticlesCustom();
    wglParticlesImageCustom();

    document.addEventListener("wglParticlesAdded", function () {
        setTimeout(() => {
            wglParticlesCustom();
            wglParticlesImageCustom();
       }, 0);
    });

    wglMenuLavalamp();
    jQuery(".wgl-currency-stripe_scrolling").each(function(){
        jQuery(this).simplemarquee({
            speed: 40,
            space: 0,
            handleHover: true,
            handleResize: true
        });
    })

    wglPageTransition({
        triggers: 'a:not([data-elementor-open-lightbox="yes"]):not(.isotope-filter a)',
        disabled: false,
    });
});

jQuery(window).resize(function () {
    wglContentMinHeight();
    setTimeout(function(){
        wglInitZoom();
    },100);
})
