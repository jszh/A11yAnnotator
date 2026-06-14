
    (function() {
      var cdnOrigin = "https://cdn.shopify.com";
      var scripts = ["/cdn/shopifycloud/checkout-web/assets/c1/polyfills.CgsWKOqO.js","/cdn/shopifycloud/checkout-web/assets/c1/app.DXNnKyzx.js","/cdn/shopifycloud/checkout-web/assets/c1/vendor.DDmNicfn.js","/cdn/shopifycloud/checkout-web/assets/c1/browser.D3AjieQm.js","/cdn/shopifycloud/checkout-web/assets/c1/FullScreenBackground.DkLC2k_T.js","/cdn/shopifycloud/checkout-web/assets/c1/unactionable-errors.4I9gROT_.js","/cdn/shopifycloud/checkout-web/assets/c1/shop-discount-offer.CPcrhEc3.js","/cdn/shopifycloud/checkout-web/assets/c1/alternativePaymentCurrency.C7ExaaYG.js","/cdn/shopifycloud/checkout-web/assets/c1/proposal.ISnBubz1.js","/cdn/shopifycloud/checkout-web/assets/c1/useHasOrdersFromMultipleShops.GmvbVfa_.js","/cdn/shopifycloud/checkout-web/assets/c1/locale-en.Bcgd_fv6.js","/cdn/shopifycloud/checkout-web/assets/c1/page-OnePage.idu0WGDK.js","/cdn/shopifycloud/checkout-web/assets/c1/PaymentButtons.BZ5vnvPb.js","/cdn/shopifycloud/checkout-web/assets/c1/OrderEditVaultedDelivery.CrkMq8o7.js","/cdn/shopifycloud/checkout-web/assets/c1/SeparatePaymentsNotice.CzllNQDp.js","/cdn/shopifycloud/checkout-web/assets/c1/ShopPayOptInDisclaimer.CS1l8F-b.js","/cdn/shopifycloud/checkout-web/assets/c1/useShowShopPayOptin.CD7L5y4q.js","/cdn/shopifycloud/checkout-web/assets/c1/helpers.BpHAk0Ym.js","/cdn/shopifycloud/checkout-web/assets/c1/MarketsProDisclaimer.eCoIbwOn.js","/cdn/shopifycloud/checkout-web/assets/c1/useForceShopPayUrl.D75AqfP7.js","/cdn/shopifycloud/checkout-web/assets/c1/RememberMeDescriptionText.DuG31dLh.js","/cdn/shopifycloud/checkout-web/assets/c1/ShopPayLogo.DLBnICBx.js","/cdn/shopifycloud/checkout-web/assets/c1/VaultedPayment.hx7ae83Q.js","/cdn/shopifycloud/checkout-web/assets/c1/ShippingGroupsSummaryLine.Dxtd9o2m.js","/cdn/shopifycloud/checkout-web/assets/c1/StackedMerchandisePreview.D39aLjfN.js","/cdn/shopifycloud/checkout-web/assets/c1/PickupPointCarrierLogo.CDGN0nvr.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks.BGSqNwlA.js","/cdn/shopifycloud/checkout-web/assets/c1/AddDiscountButton.BOCF-r0y.js","/cdn/shopifycloud/checkout-web/assets/c1/MobileOrderSummary.BEXPdhCr.js","/cdn/shopifycloud/checkout-web/assets/c1/StockProblemsLineItemList.MQt9TRPm.js","/cdn/shopifycloud/checkout-web/assets/c1/flags._QQkYoXm.js","/cdn/shopifycloud/checkout-web/assets/c1/ShipmentBreakdown.CZYpIMou.js","/cdn/shopifycloud/checkout-web/assets/c1/MerchandiseModal.B5P1p4Jk.js","/cdn/shopifycloud/checkout-web/assets/c1/shipping-options.CJKhhXFK.js","/cdn/shopifycloud/checkout-web/assets/c1/DutyOptions.B6KXT47k.js","/cdn/shopifycloud/checkout-web/assets/c1/ShippingMethodSelector._9VD5LcV.js","/cdn/shopifycloud/checkout-web/assets/c1/SubscriptionPriceBreakdown.CxuegRw7.js","/cdn/shopifycloud/checkout-web/assets/c1/component-RuntimeExtension.Blg9v-Ii.js","/cdn/shopifycloud/checkout-web/assets/c1/AnnouncementRuntimeExtensions.C8TMDy9C.js","/cdn/shopifycloud/checkout-web/assets/c1/rendering-extension-targets.Dmp4pKeb.js","/cdn/shopifycloud/checkout-web/assets/c1/v4.BKrj-4V8.js","/cdn/shopifycloud/checkout-web/assets/c1/ExtensionsInner.-bn5yk_1.js"];
      var styles = ["/cdn/shopifycloud/checkout-web/assets/c1/assets/app.au8IBghB.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/FullScreenBackground.B_iZlQze.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/useHasOrdersFromMultipleShops.CSQeNLVy.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/OnePage.CKTqepKH.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/OrderEditVaultedDelivery.1waIT_cE.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/helpers.BhtheElV.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/AddDiscountButton.oEoBAbtG.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/MobileOrderSummary.DyWpTla1.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/RememberMeDescriptionText.BrcQzLuH.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/DutyOptions.LcqrKXE1.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/VaultedPayment.OxMVm7u-.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/PickupPointCarrierLogo.DuZuWHqZ.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/StackedMerchandisePreview.D6OuIVjc.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/ShippingMethodSelector.B0hio2RO.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/SubscriptionPriceBreakdown.BSemv9tH.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/RuntimeExtension.DWkDBM73.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/AnnouncementRuntimeExtensions.V0VYEO4K.css"];
      var fontPreconnectUrls = ["https://fonts.shopifycdn.com"];
      var fontPrefetchUrls = ["https://fonts.shopifycdn.com/instrument_sans/instrumentsans_n4.db86542ae5e1596dbdb28c279ae6c2086c4c5bfa.woff2?h1=cmVlYm9rLmNvbQ&hmac=4db85312d1769c4f2675c08562c0c691f655621ac9e07778b938002a69ee47e9","https://fonts.shopifycdn.com/instrument_sans/instrumentsans_n7.e4ad9032e203f9a0977786c356573ced65a7419a.woff2?h1=cmVlYm9rLmNvbQ&hmac=13d95a0defd63c54d14bff2127db90b5ccfaf39f566fd913be74ae258a7d79f1"];
      var imgPrefetchUrls = ["https://cdn.shopify.com/s/files/1/0862/7834/0912/files/Reebok_LogoSuite_Vector_VectorRed_x320.png?v=1732641194"];

      function preconnect(url, callback) {
        var link = document.createElement('link');
        link.rel = 'dns-prefetch preconnect';
        link.href = url;
        link.crossOrigin = '';
        link.onload = link.onerror = callback;
        document.head.appendChild(link);
      }

      function preconnectAssets() {
        var resources = [cdnOrigin].concat(fontPreconnectUrls);
        var index = 0;
        (function next() {
          var res = resources[index++];
          if (res) preconnect(res, next);
        })();
      }

      function prefetch(url, as, callback) {
        var link = document.createElement('link');
        if (link.relList.supports('prefetch')) {
          link.rel = 'prefetch';
          link.fetchPriority = 'low';
          link.as = as;
          if (as === 'font') link.type = 'font/woff2';
          link.href = url;
          link.crossOrigin = '';
          link.onload = link.onerror = callback;
          document.head.appendChild(link);
        } else {
          var xhr = new XMLHttpRequest();
          xhr.open('GET', url, true);
          xhr.onloadend = callback;
          xhr.send();
        }
      }

      function prefetchAssets() {
        var resources = [].concat(
          scripts.map(function(url) { return [url, 'script']; }),
          styles.map(function(url) { return [url, 'style']; }),
          fontPrefetchUrls.map(function(url) { return [url, 'font']; }),
          imgPrefetchUrls.map(function(url) { return [url, 'image']; })
        );
        var index = 0;
        function run() {
          var res = resources[index++];
          if (res) prefetch(res[0], res[1], next);
        }
        var next = (self.requestIdleCallback || setTimeout).bind(self, run);
        next();
      }

      function onLoaded() {
        try {
          if (parseFloat(navigator.connection.effectiveType) > 2 && !navigator.connection.saveData) {
            preconnectAssets();
            prefetchAssets();
          }
        } catch (e) {}
      }

      if (document.readyState === 'complete') {
        onLoaded();
      } else {
        addEventListener('load', onLoaded);
      }
    })();
  