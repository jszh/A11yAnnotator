(function () {
  //adobe tracking
  var AdobeTracker = function (props) {
    this.tagCategroy = "home-leaderboard-";
  };
  AdobeTracker.prototype = {
    constructor: AdobeTracker,
    trackCustomEvent: function (props, linkName) {
      Biz.Common.SiteCatalyst.sendForOnClick(props, linkName);
    },
    trackClick: function (props) {
      this.trackCustomEvent(
        {
          events: "event63",
          eVar78:
            this.tagCategroy +
            props.tagName.toLowerCase() +
            "-" +
            props.ver.toLowerCase(),
        },
        "herobannerclick"
      );
    },
    trackABTest: function (props) {
      this.trackCustomEvent(
        {
          eVar60:
            this.tagCategroy +
            props.tagName.toLowerCase() +
            "-" +
            props.ver.toLowerCase(),
        },
        "AB testing impression"
      );
    },
  };
  //time zone
  var util = {
    //check is DST
    isDst: function (t) {
      var jan = new Date(t.getFullYear(), 0, 1);
      var jul = new Date(t.getFullYear(), 6, 1);
      var std = Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
      return t.getTimezoneOffset() < std;
    },
    //get current time and change to PST
    currTime: function () {
      var t = new Date();
      var offset = this.isDst(t) ? -7 : -8;
      var offset;
      var utc = t.getTime() + t.getTimezoneOffset() * 60000;
      return new Date(utc + 3600000 * offset);
    },
  };
  //video vs image
  var VideoVSImage = function () {};
  VideoVSImage.prototype = {
    constructor: VideoVSImage,
    ABtestName: "bfstart2023",
    animationInfo: [
      {
        bannerPattern: /icid=774029($|&)/i,
        webm:
          window.devicePixelRatio > 1
            ? "https://promotions.newegg.com/nepro/24-0471/1920x660_sm@2x.webm"
            : "https://promotions.newegg.com/nepro/24-0471/1920x660_sm.webm",
        mp4:
          window.devicePixelRatio > 1
            ? "https://promotions.newegg.com/nepro/24-0471/1920x660_sm@2x.mp4"
            : "https://promotions.newegg.com/nepro/24-0471/1920x660_sm.mp4",
      },
    ],
    render: function () {
      var version = "animation";

      //loop all animationInfo to replace image
      for (var i = 0; i < this.animationInfo.length; i++) {
        this.replaceImageToAnimate(this.animationInfo[i], version);
      }
    },
    replaceImageToAnimate: function (animation, version) {
      if (!animation) {
        return;
      }
      var that = this,
        bannerPattern = animation.bannerPattern,
        adobe = new AdobeTracker({}),
        banner = jQuery(".hero-banner-img")
          .parent()
          .find("a")
          .filter(function () {
            return bannerPattern.test(jQuery(this).attr("href"));
          }),
        title;
      //check banner is the target banner
      if (!banner || banner.length == 0) {
        return;
      }
      title = banner.attr("title");
      //replace image banner with video
      if (animation.webm || animation.mp4) {
        banner
          .parent()
          .find(".hero-banner-img")
          .append(that.buildVideo(animation));
      }
      //attach adobe click event on <a>
      that.attachClickEventToA(banner, version);
    },
    attachClickEventToA: function (banner, version) {
      banner.click(function () {
        new AdobeTracker({}).trackClick({
          tagName: jQuery(this).attr("title"),
          ver: version,
        });
      });
    },
    buildVideo: function (animation) {
      if (!animation) {
        return;
      }
      var CSSStyle =
          '<style type="text/css">.hero-banner-img video {position: relative;left: 60%;transform: translateX(-50%);display: block;width: auto;height: 470px;}.hero-banner-img video {position: absolute;top: 0;}@media (max-width: 999px) {.hero-banner-img video {height: 450px;}}</style>',
        htmlArr = [];
      htmlArr.push(CSSStyle);
      htmlArr.push('<video autoplay="" muted="" loop="" playsinline="">');
      if (animation.webm) {
        htmlArr.push(
          '  <source src="' + animation.webm + '" type="video/webm">'
        );
      }
      if (animation.mp4) {
        htmlArr.push('  <source src="' + animation.mp4 + '" type="video/mp4">');
      }
      htmlArr.push("</video>");
      return htmlArr.join("");
    },
  };
  //run
  try {
    //schedule, time period
    var nowTime = util.currTime();
    /* if (nowTime < new Date('2022 6 7 00:00') || nowTime > new Date('2022 6 13 23:59')) {
             return;
         } */
    //if IE , do nothing
    if (window.document.documentMode) {
      return;
    }
    //run
    jQuery(new VideoVSImage({}).render());
  } catch (e) {
    //console.error(e);
  }
})();
