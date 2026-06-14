/**
 * @file
 * ActiveCampaign tracking script.
 */

(function ($, Drupal, once) {
  'use strict';

  /**
   * Initialize ActiveCampaign tracking.
   *
   * @type {Drupal~behavior}
   */
  Drupal.behaviors.activeCampaignTracking = {
    attach: function (context, settings) {
      once('activeCampaignTracking', 'body', context).forEach(function () {
        // Initialize ActiveCampaign tracking script
        (function(e,t,o,n,p,r,i){
          e.visitorGlobalObjectAlias=n;
          e[e.visitorGlobalObjectAlias]=e[e.visitorGlobalObjectAlias]||function(){
            (e[e.visitorGlobalObjectAlias].q=e[e.visitorGlobalObjectAlias].q||[]).push(arguments)
          };
          e[e.visitorGlobalObjectAlias].l=(new Date).getTime();
          r=t.createElement("script");
          r.src=o;
          r.async=true;
          i=t.getElementsByTagName("script")[0];
          i.parentNode.insertBefore(r,i)
        })(window,document,"https://diffuser-cdn.app-us1.com/diffuser/diffuser.js","vgo");

        // Configure ActiveCampaign
        vgo('setAccount', '478605297');
        vgo('setTrackByDefault', true);

        // Add email tracking for authenticated users if available
        if (typeof(settings) !== 'undefined' &&
            typeof(settings.user) !== 'undefined' &&
            typeof(settings.user.email) !== 'undefined') {
          vgo('setEmail', settings.user.email);
        }

        // Process tracking
        vgo('process');
      });
    }
  };
})(jQuery, Drupal, once);
