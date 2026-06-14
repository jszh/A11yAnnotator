var videoPlayer = (function() {
  var hash, autoPlay, enableControlBar, video, videoId;
  var playerComplete, playerShown, playerInit;
  var pauseMethod = '',
    manualMuteUnmute = false;

  function videoDebugger(msg) {
    url = 'https://logger.tools.vettafi.com/';
    try {
      $.post( url, { videodebug: msg });
    } catch (err) {
      mitreDebugger('Video debug failed');
    }
  }

  function percentVisibleWithHeader(container) {
    // container = '#vast-video'
    if ($(container).offset().top == $(window).scrollTop()) {
      return 0;
    }

    tv =
      (($(container).offset().top -
        ($(window).scrollTop() + $('.mm-header').height())) /
        $(container).height()) *
        100 +
      100;
    bv =
      (($(window).scrollTop() +
        $(window).height() -
        $(container).offset().top) /
        $(container).height()) *
      100;

    if (tv < 0) {
      return 0;
    }
    if (tv > 100) {
      if (bv > 100) {
        return 100;
      }
      if (bv < 0) {
        return 0;
      }
      return bv;
    }
    return tv;
  }

  function mitreDebugger(msg) {
    if (Mitre.DEBUG) console.log('videoPlayer', videoId, msg);
  }

  /**
   * Only invokes func at most once per every wait milliseconds
   */
  function throttle(func, wait) {
    var time = Date.now();
    return function() {
      if (time + wait - Date.now() < 0) {
        func();
        time = Date.now();
      }
    };
  }

  function percentageSeen() {
    // $(window).scrollTop() = top visible line
    // scrollBottom = bottom visible line
    scrollBottom = $(window).scrollTop() + $(window).height();

    // video location relative to the bottom visible line
    videoLocation =
      scrollBottom -
      $('#vast-video-wrapper').offset().top -
      $('#vast-video-header').height();

    viewable = (videoLocation / $('#' + videoId).height()) * 100 > 60;

    if (viewable) {
      if (playerComplete != true && playerShown != true) {
        mitreDebugger('attempting play');
        video.play();
      } else {
        mitreDebugger('not viewable');
      }
    }
    return percentVisibleWithHeader('#' + videoId);
  }

  function canShowPlayer() {
    return playerComplete !== true && percentageSeen() > 50;
  }

  // check if ad is in view, ad visible class when necessary (but only the first time it's in view)
  function setAdDisplayState() {
    if (playerComplete == true) {
      mitreDebugger('player complete');
      return false;
    }
    if (canShowPlayer()) {
      if (pauseMethod == 'manual') {
        mitreDebugger('cannot restart, manual pause');
      }
      if (video.paused()) {
        if (pauseMethod == '' || pauseMethod == 'viewport') {
          setTimeout(function() {
            mitreDebugger('> 50%, playing');
            video.play();
          }, 1000);
          pauseMethod = '';
        }
      }
    } else {
      if (playerComplete == true) {
        return false;
      }
      if (!video.paused()) {
        mitreDebugger('< 50%, pausing');
        pauseMethod = 'viewport';
        video.pause();
      }
    }
  }

  function hideVideoContainer(selector) {
    mitreDebugger('hide video container: ' + selector);
    $(selector).slideUp('slow', function() {
      $(selector).addClass('video-container-hidden');
      $(selector).removeClass('video-conatiner-shown');
    });
    $('.profile-container').css('padding-top', 0);
    playerComplete = true;
  }

  function showVideoContainer(selector) {
    mitreDebugger('show video container: ' + selector);
    $(selector).removeClass('video-container-hidden');
    $(selector).hide();
    $(selector).addClass('video-conatiner-shown');
    $(selector).slideDown('slow');
    $('.profile-container').css('padding-top', '20px');
  }

  function displayVideo(hash, autoPlay, enableControlBar) {
    videoId = 'vast-video-' + hash;
    const selector = '.videocontainer-' + hash;

    var vastRetry = 0;
    var nTimer = setInterval(function() {
      if (window.jQuery) {
        vastRetry++;
        if (vastRetry > 30) {
          mitreDebugger("DFP isn't ready yet. Stopped trying.");
          clearInterval(nTimer);
          return;
        }

        try {
          window['vast_url_with_comp_exlc_' + hash] =
            window['vast_url_' + hash] +
            '%26comp_exlsn_prevent%3D' +
            googletag
              .pubads()
              .getTargeting('comp_exlsn_prevent')
              .toString();
          window['vast_url_with_correlator_' + hash] =
            window['vast_url_with_comp_exlc_' + hash].replace(
              '&cust_params=',
              '&correlator=' + googletag.pubads().getCorrelator() + '&cust_params='
            );
          mitreDebugger(
            'Try: ' +
              vastRetry +
              ' : ' +
              window['vast_url_with_correlator_' + hash]
          );
        } catch (err) {
          mitreDebugger('DFP issue.');
          return;
        }

        if (playerShown == true) {
          clearInterval(nTimer);
          return;
        }

        if (videojs.players[videoId] == undefined) {
          // Attempt to create the player
          video = videojs(videoId);
          return;
        }

        if (playerInit == true) {
          mitreDebugger('Player already init');
          return;
        }

        playerComplete = false;
        playerShown = false;
        playerInit = true;

        mitreDebugger('Setting up client');

        video = videojs.players[videoId];
        video.vastClient({
          adTagUrl: window['vast_url_with_correlator_' + hash],
          adCancelTimeout: 30000,
          playAdAlways: true,
          adsEnabled: true,
          preferredTech: 'html5',
          vpaidFlashLoaderPath: '/assets/VPAIDFlash.swf',
          verbosity: 4
        });
        video.analytics()

        if (enableControlBar) {
          video.controls(true);
        } else {
          video.controls(false);
        }

        video.muted(true);

        $(document).ready(function() {
          $(selector + ' .close-icon').on('click', function(event) {
            event.preventDefault();
            video.pause();
            hideVideoContainer(selector);
          });

          $('#vpaid_video_flash_tester_el').attr('aria-hidden', true);

          video.on('mouseover', function() {
            if (!autoPlay && !manualMuteUnmute && video.muted()) {
              video.muted(false);
              manualMuteUnmute = true;
            }
            return true;
          });
          // video.on("mouseout", function () { video.muted(true); return true; });

          video.on('ended', function() {
            mitreDebugger('play ended. closing.');
            hideVideoContainer(selector);
          });

          video.on('playing', function() {
            clearInterval(nTimer);

            mitreDebugger('playing event');
          });

          video.on('vast.adStart', function() {
            mitreDebugger('vast.adStart');
            try {
              li = video.vast.vastResponse.ads[0].id;
            } catch (err) {
              li = null;
            }
            try {
              c = video.vast.vastResponse.ads[0].inLine.creatives[0].id;
            } catch (err) {
              c = null;
            }
            // console.log('Sent:', window['vast_url_with_correlator_' + hash], 'Received:', li, c);
            msg = btoa('Sent:' + window['vast_url_with_correlator_' + hash] + 'Received:' + li + '|' + c);
            videoDebugger(msg);

            showVideoContainer(selector);
            if (playerComplete == true) return;
            playerShown = true;
            pauseMethod = '';
          });

          video.on('vast.contentEnd', function() {
            mitreDebugger('vast content ended. closing.');
            hideVideoContainer(selector);
          });

          video.on('vast.firstPlay', function() {
            mitreDebugger('vast.firstPlay');
          });

          video.on('vast.adsCancel', function() {
            mitreDebugger('vast.adsCancel');

            msg = btoa('Sent:' + window['vast_url_with_correlator_' + hash] + 'Error:Empty');
            videoDebugger(msg);
          });

          video.on('vast.adSkip', function() {
            mitreDebugger('vast.adSkip');
          })

          video.on('vast.adError', function(response) {

            clearInterval(nTimer);

            // console.log('Sent:', window['vast_url_with_correlator_' + hash], 'Received:' . response.error.code);

            playerComplete = true;
            hideVideoContainer(selector);

            const errorCode = response.error.code;

            if (errorCode == '402') {
              // Ad didn't start playing in time
              mitreDebugger('vast error 402. closing.');
              video.play();
              return;
            }

            if (errorCode == '303') {
              // Invalid or empty VAST
            }

            msg = btoa('Sent:' + window['vast_url_with_correlator_' + hash] + 'Error:' + errorCode);
            videoDebugger(msg);

            // console.log('Vast Error ' + errorCode + '. Closing: ' + selector);
            mitreDebugger('vast error ' + errorCode);
          });
          video.on('error', function() {
            mitreDebugger('play error. closing.');
            hideVideoContainer(selector);
          });

          video.on('pause', function() {
            if (playerComplete == true) return;
            mitreDebugger('pause event');
          });

          if (autoPlay) {
            setAdDisplayState();
          } else {
            $(window).scroll(throttle(setAdDisplayState, 250));
          }
        });
      }
    }, 750);
  }

  return { showVideo: displayVideo };
})();
