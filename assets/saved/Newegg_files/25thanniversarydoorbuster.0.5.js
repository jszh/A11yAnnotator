jQuery(document).ready(function () {
  let initialized = false;
  let mainStoreLink = "";
  let landingPageLink = "https://www.newegg.com/doorbuster";
  const eventConfig = [
    {
      phase: "Newegg 25th Anniversary",
      title: "MAR 25",
      startDate: "2026-03-25T09:00:00-07:00",
      endDate: "2026-03-25T23:59:59-07:00",
      startTime: "09:00",
      description: "Check Newegg.com for the 25th Anniversary Day 25 Doorbuster Deals!",
      upcomingDes: "Something big is about to drop.<br/>Check back soon!",
      discount: "91%",
      activeDes: "Doorbuster Unlocked!",
      endedDes:"This event has ended. Stay tuned for the next drop!",
      icsUrl:
        "https://c1.neweggimages.com/webresource/Scripts/Others/doorbuster/newegg_deals_single_month_0325.ics",
      activeImage:"https://c1.neweggimages.com/webresource/themes/Nest/holidays/anniversary/item225.png",
    }
  ];

  let pageBarStatus = {
    upcoming: "upcoming",
    started: "started",
  };

  let actionType = {
    buyNow: "buy-now",
    shopAll: "shop-all-deals",
  };

  let buttonDataAttribute = {
    shopNow: "shop-now",
    shopEnded: "shop-ended",
    upcoming: "upcoming",
  };
  function createUTCCountdown(options = {}) {
    const { leftTime, targetDate, interval = 1000, onEnd } = options;

    const isNumber = (v) => typeof v === "number" && !isNaN(v);

    const calcLeft = (target) => {
      if (!target) return 0;
      const targetMs = typeof target === "string" ? Date.parse(target) : target;
      const diff = targetMs - Date.now();
      return diff > 0 ? diff : 0;
    };

    const parseMs = (ms) => ({
      days: Math.floor(ms / 86400000),
      hours: Math.floor(ms / 3600000) % 24,
      minutes: Math.floor(ms / 60000) % 60,
      seconds: Math.floor(ms / 1000) % 60,
      milliseconds: Math.floor(ms) % 1000,
    });

    const target =
      isNumber(leftTime) && leftTime > 0
        ? Date.now() + leftTime
        : targetDate || null;

    let timeLeft = calcLeft(target);
    let timer = null;
    let listeners = [];

    const notify = () => {
      const formatted = parseMs(timeLeft);
      listeners.forEach((fn) => fn(timeLeft, formatted));
    };

    const start = () => {
      if (!target) {
        timeLeft = 0;
        notify();
        return;
      }
      notify();
      timer = setInterval(() => {
        timeLeft = calcLeft(target);
        notify();
        if (timeLeft === 0) {
          stop();
          onEnd && onEnd();
        }
      }, interval);
    };

    const stop = () => {
      if (timer) clearInterval(timer);
      timer = null;
    };

    const onTick = (fn) => {
      if (typeof fn === "function") listeners.push(fn);
      return () => (listeners = listeners.filter((f) => f !== fn));
    };

    start();

    return {
      start,
      stop,
      onTick,
      getTimeLeft: () => timeLeft,
      getFormatted: () => parseMs(timeLeft),
    };
  }

  async function initializeModal() {
    const modalHtml = await buildDoorbusterCalendar();
    $("body").append(modalHtml);
  }

  function shouldShowDailyModal() {
    if (window?.location?.pathname !== "/") {
      return false;
    }

    const today = new Date().toDateString();
    const lastShownDate = localStorage.getItem(
      "blacknovember_modal_shown_date"
    );

    if (lastShownDate === today) {
      return false;
    }

    return true;
  }

  let previousActiveElement = null;

  function showDailyModal() {
    if (shouldShowDailyModal()) {
      const today = new Date().toDateString();
      localStorage.setItem("blacknovember_modal_shown_date", today);

      setTimeout(() => {
        previousActiveElement = document.activeElement;
        
        $("#modal-BlackNovember").addClass("show");
        $(".BlackNovember-mask").addClass("show");
        $("body").addClass("modal-open");
        
        $("#modal-BlackNovember").attr("aria-hidden", "false");

        const closeButton = $("#modal-BlackNovember .close")[0];
        if (closeButton) {
          closeButton.focus();
        }
      }, 1000);
    }
  }
  
  function closeModal() {
    $("#modal-BlackNovember").removeClass("show");
    $(".BlackNovember-mask").removeClass("show");
    $("body").removeClass("modal-open");

    $("#modal-BlackNovember").attr("aria-hidden", "true");

    if (previousActiveElement && previousActiveElement.focus) {
      try {
        previousActiveElement.focus();
      } catch (e) {
        document.body.focus();
      }
    }
    previousActiveElement = null;
  }

  function bindModalEvents() {
    $(document).on("click", ".page-bar-btn", function () {
      const action = $(this).data("action");
      const dataLink = $(this).data("link");

      if (action === actionType.buyNow) {
        window.open(dataLink || landingPageLink, "_blank");
      } else if (action === actionType.shopAll) {
        window.open(dataLink || mainStoreLink || "/", "_blank");
      } else {
        previousActiveElement = document.activeElement;

        $("#modal-BlackNovember").addClass("show");
        $(".BlackNovember-mask").addClass("show");
        $("body").addClass("modal-open");

        $("#modal-BlackNovember").attr("aria-hidden", "false");

        setTimeout(() => {
          const closeButton = $("#modal-BlackNovember .close")[0];
          if (closeButton) {
            closeButton.focus();
          }
        }, 100);

        window?.__ga_push({
          event: "legacy_click",
          legacy_element_value: "product-group buy-preview calendar",
        });
      }
    });

    $(document).on(
      "click",
      "#modal-BlackNovember .close, .BlackNovember-mask",
      function () {
        closeModal();
      }
    );

    $(document).on("keydown", function (e) {
      const modal = $("#modal-BlackNovember");
      if (!modal.hasClass("show")) {
        return;
      }

      if (e.key === "Escape" || e.keyCode === 27) {
        e.preventDefault();
        closeModal();
        return;
      }

      if (e.key === "Tab" || e.keyCode === 9) {
        const modalElement = modal[0];
        const focusableElements = modalElement.querySelectorAll(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstFocusable) {
            e.preventDefault();
            lastFocusable.focus();
          }
        } else {
          if (document.activeElement === lastFocusable) {
            e.preventDefault();
            firstFocusable.focus();
          }
        }
      }
    });

    $(document).on("click", ".chest-deals", function () {
      const eventIndex = $(this).data("event-index");
      const action = $(this).data("action");
      const dataLink = $(this).data("link");

      if (action == buttonDataAttribute.shopEnded && dataLink) {
        window.open(dataLink, "_blank");
        return;
      }
      if(action === buttonDataAttribute.upcoming && dataLink){
        window.open(dataLink, "_blank");
        return;
      }
      if (action === buttonDataAttribute.shopNow && dataLink) {
        window?.__ga_push({
          event: "legacy_click",
          legacy_element_value: "product-group buy-shop now",
        });
        window.open(dataLink, "_blank");
        return;
      }

      if (eventIndex !== undefined && eventConfig[eventIndex]) {
        window?.__ga_push({
          event: "legacy_click",
          legacy_element_value: "product-group buy-add to calendar",
        });
        downloadICSFile(eventConfig[eventIndex]);

        const originalText = $(this).text();
        $(this).text("Downloaded!");
        $(this).addClass("downloaded");

        setTimeout(() => {
          $(this).text(originalText);
          $(this).removeClass("downloaded");
        }, 2000);
      }
    });
  }

  function buildStartedPageBar(inventoryStatus) {
    const activeEvent = eventConfig.find(function (e) {
      const eventStatus = getEventStatus(e.startDate, e.endDate);
      return eventStatus === "active";
    });

    const isGapPeriod = !activeEvent;

    let actionButtons = "";
    let pageBar = "";

    if (!inventoryStatus || isGapPeriod) {
      actionButtons = `<div class="page-bar-actions">
          <div class="page-bar-btn buy-now-btn" data-action="${actionType.buyNow}" data-link="${landingPageLink}">
            <span>See schedule</span>
            <i class="ico ico-caret-right-solid"></i>
          </div>
        </div>`;
      pageBar = `<div class="page-content-inner">
          <div class="page-bar-text">
            <strong>Newegg's 25th Anniversary Doorbuster Event</strong>
            <span>This event has ended. Stay tuned for the next drop!</span>
            ${actionButtons}
          </div>
        </div>`;
    } else {
      actionButtons = `<div class="page-bar-actions">
          <div class="page-bar-btn buy-now-btn" data-action="${actionType.buyNow}" data-link="${landingPageLink}">
            <span>Learn more</span>
            <i class="ico ico-caret-right-solid"></i>
          </div>
        </div>`;
      pageBar = `<div class="page-content-inner">
          <div class="page-bar-text">
            <strong>Newegg's 25th Anniversary Doorbuster Event</strong>
            <span>Unlock new deals at 9am PT on the 25th of every month, all year long!</span>
            ${actionButtons}
          </div>
        </div>`;
    }

    return pageBar;
  }

  function buildPageBar(
    status,
    days,
    hours,
    minutes,
    seconds,
    milliseconds,
    inventoryStatus = false
  ) {
    let existingPageBar = $("#doorbuster_page_bar .section-countdown");
    let doorbuster_page_bar = $("#doorbuster_page_bar");

    const now = new Date();
    const eventStartDate = new Date(eventConfig[0].startDate);
    const isEventStarted = now > eventStartDate;

    if (days > 0) {
      hours += days * 24;
    }
    const formatTwoDigits = (num) => String(num).padStart(2, "0");
    const hoursStr = formatTwoDigits(hours);
    const minutesStr = formatTwoDigits(minutes);
    const secondsStr = formatTwoDigits(seconds);

    if (existingPageBar.length === 0) {
      let countdownHtml = "";
      let pageBar = "";
      let actionButtons = "";
      let previewTitle = "";
      let buttonText = "";
      const currentEventForLinks = (function () {
        const nowTime = new Date();
        const active = eventConfig.find(function (e) {
          return (
            nowTime >= new Date(e.startDate) && nowTime < new Date(e.endDate)
          );
        });
        if (active) return active;
        const upcoming = eventConfig.find(function (e) {
          return nowTime < new Date(e.startDate);
        });
        return upcoming || eventConfig[eventConfig.length - 1];
      })();

      const shopAllLink =
        (currentEventForLinks && currentEventForLinks.mainStoreLink) ||
        mainStoreLink ||
        "";

      if (status === pageBarStatus.upcoming) {
        const formatStartDate = (startDateStr) => {
          if (!startDateStr) return "9am PT";
          const datePart = startDateStr.split("T")[0]; 
          const [year, month, day] = datePart.split("-");
          const yearShort = year.slice(-2); 
          return `${parseInt(month)}/${parseInt(day)}/${yearShort} at 9am PT`;
        };
        const formattedDate = currentEventForLinks?.startDate 
          ? formatStartDate(currentEventForLinks.startDate) 
          : "9am PT";
        
        if(days >= 1){
          countdownHtml = `<div class="section-countdown">
                  <span class="days-display">${days + 1} Days</span>
                </div>`;
          previewTitle = `Unlock exclusive savings on ${formattedDate}.`;
          buttonText = "Learn more";
        }else{
          countdownHtml = `<div class="section-countdown">
                  <span class="hh1">${hoursStr[0]}</span>
                  <span class="hh2">${hoursStr[1]}</span>
                  <i class="colon">:</i>
                  <span class="mm1">${minutesStr[0]}</span>
                  <span class="mm2">${minutesStr[1]}</span>
                  <i class="colon">:</i>
                  <span class="ss1">${secondsStr[0]}</span>
                  <span class="ss2">${secondsStr[1]}</span>
                </div>`;
          previewTitle = `Unlock exclusive savings at 9am PT.`;
          buttonText = "Preview deals";
        }
        actionButtons = `<div class="page-bar-actions">
                <div class="page-bar-btn" data-action="${actionType.buyNow}" data-link="${landingPageLink}"><span>${buttonText}</span> <i class="ico ico-caret-right-solid"></i></div>
              </div>`;

        pageBar = `<div class="page-content-inner">
            <div class="page-bar-text">
              <strong>Newegg's 25th Anniversary Doorbuster Event Starts in:</strong>
              ${countdownHtml}
                <span>${previewTitle}</span>
                ${actionButtons}
              </div>
            </div>`;
      } else if (status === pageBarStatus.started) {
        pageBar = buildStartedPageBar(inventoryStatus);
      }

      doorbuster_page_bar.html(pageBar);
    } else {
      if (status === pageBarStatus.started) {
        const currentEventForLinks = (function () {
          const nowTime = new Date();
          const active = eventConfig.find(function (e) {
            return (
              nowTime >= new Date(e.startDate) && nowTime < new Date(e.endDate)
            );
          });
          if (active) return active;
          const upcoming = eventConfig.find(function (e) {
            return nowTime < new Date(e.startDate);
          });
          return upcoming || eventConfig[eventConfig.length - 1];
        })();
        const pageBar = buildStartedPageBar(inventoryStatus);

        doorbuster_page_bar.html(pageBar);
      } else if (status === "upcoming") {
        if(days >= 1){
          existingPageBar.find(".days-display").text((days + 1) + " Days");
        }else{
          existingPageBar.find(".hh1").text(hoursStr[0]);
          existingPageBar.find(".hh2").text(hoursStr[1]);
          existingPageBar.find(".mm1").text(minutesStr[0]);
          existingPageBar.find(".mm2").text(minutesStr[1]);
          existingPageBar.find(".ss1").text(secondsStr[0]);
          existingPageBar.find(".ss2").text(secondsStr[1]);
        }
      }
    }
  }

  function getEventStatus(startDate, endDate) {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (now < start) {
      return "upcoming";
    } else if (now >= start && now <= end) {
      return "active";
    } else {
      return "ended";
    }
  }

  function getChestImageUrl(status, eventConfig = null, isPreview = false) {
    const baseUrl =
      "https://c1.neweggimages.com/webresource/themes/Nest/holidays/anniversary/";

    if (isPreview) {
      if (eventConfig && eventConfig.activeImage) {
        return eventConfig.activeImage;
      }
      return `${baseUrl}item225.png`;
    }

    switch (status) {
      case "active":
        if (eventConfig && eventConfig.activeImage) {
          return eventConfig.activeImage;
        }
        return `${baseUrl}item225.png`;
      case "ended":
        return `${baseUrl}item1.png`;
      default:
        return `${baseUrl}item1.png`;
    }
  }

  function getICSFileUrl(event) {
    return event.icsUrl;
  }

  function downloadICSFile(event) {
    if (navigator.userAgent.match(/Newegg.+App/gi)) {
      const startDate = new Date(event.startDate);
      const endDate = new Date(event.endDate);
      const formatSDKDate = (date, isStartTime = false) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        let hours, minutes, seconds;
        if (isStartTime) {
          const timeParts = event.startTime.split(":");
          hours = timeParts[0].padStart(2, "0");
          minutes = timeParts[1].padStart(2, "0");
          seconds = "00";
        } else {
          hours = String(date.getHours()).padStart(2, "0");
          minutes = String(date.getMinutes()).padStart(2, "0");
          seconds = String(date.getSeconds()).padStart(2, "0");
        }

        return `${year}${month}${day}T${hours}${minutes}${seconds}`;
      };

      let sdkData = {
        title: `${event.phase} - ${event.title}`,
        description: event.description.replace(/<br>/g, "\n"),
        location: "Newegg.com",
        startTime: formatSDKDate(startDate, true),
        endTime: formatSDKDate(endDate, false),
      };
      const isIOS = navigator.userAgent.indexOf("iPhone") >= 0;
      const isAndroid = navigator.userAgent.indexOf("Android") >= 0;
      const versionRegex = /Newegg.+App \/ (\d+\.\d+\.\d+)/;
      const appVersionMatch = navigator.userAgent.match(versionRegex);
      if (
        (isIOS && appVersionMatch && parseFloat(appVersionMatch[1]) < 6.78) ||
        (isAndroid && appVersionMatch && parseFloat(appVersionMatch[1]) < 5.78)
      ) {
        window.NeweggJSSDK &&
          window.NeweggJSSDK.requestAppOpenSystemBrowser({
            url: window.location.href,
          });
        return;
      } else {
        window.NeweggJSSDK && window.NeweggJSSDK.requestAppAddCalendar(sdkData);
        return;
      }
    }

    const icsUrl = getICSFileUrl(event);
    window.open(icsUrl, "_blank");
  }

  async function buildDoorbusterCalendar() {
    const now = new Date();
    const eventStartDate = new Date(eventConfig[0].startDate);
    const isEventStarted = now >= eventStartDate;
    let chestsHtml = "";

    eventConfig.forEach((event, index) => {
      const status = getEventStatus(event.startDate, event.endDate);
      const eventStart = new Date(event.startDate);
      const timeDiff = eventStart.getTime() - now.getTime();
      const isPreview = status === "upcoming" && timeDiff > 0 && timeDiff <= 24 * 60 * 60 * 1000;
      const imageUrl = getChestImageUrl(status, event, isPreview);
      const discount = event?.discount;

      let discountHtml = "";
      if (!!discount) {
        discountHtml = `<div class="chest-discount">
                                          <div class="discount-label">UP TO</div>
                                          <div class="discount-value"><strong>${discount}</strong><span class="discount-off">Off</span></div>
                                      </div>`;
      }

      let giftHtml = "";
      if (event.giftCardHtml) {
        giftHtml = event.giftCardHtml;
      }

      let chestDealsHtml = "";
      if (!isEventStarted && index === 0) {
        chestDealsHtml = `<div class="chest-deals bg-gold" data-action="${buttonDataAttribute.upcoming}" data-link="${landingPageLink}"><span>Preview deals</span> <i class="ico ico-caret-right-solid"></i></div>`;
      }

      let description = "";
      let buttonText = "Add to calendar";
      let buttonClass = "chest-deals";
      let buttonDataAction = "";
      let buttonDataLink = "";
      let hasCaret = false;

      if (status === "active") {
        description = event.activeDes;
        buttonClass = "chest-deals bg-gold";
        buttonText = "Shop now";
        hasCaret = true;
        buttonDataAction = buttonDataAttribute.shopNow;
        buttonDataLink = landingPageLink;
      } else if (status === "ended") {
        description = event.endedDes;
        buttonDataAction = buttonDataAttribute.shopEnded;
        buttonText = "See schedule";
        buttonDataLink = landingPageLink;
      } else if (status === "upcoming") {
        hasCaret = isPreview ? true : false;
        description = event.upcomingDes;
      }

      chestsHtml += `
                 <div class="chest-item">
                   <div class="chest-phase">${event.title}</div>
                   <div class="chest-desc">${
                     description || event.description
                   }</div>
                  
                   ${hasCaret ? discountHtml : ""}
                   <div class="chest-actions">
                      ${chestDealsHtml}
                      <div class="${buttonClass}" data-event-index="${index}" data-action="${buttonDataAction}" data-link="${buttonDataLink}">
                              <span>${buttonText}</span>
                              ${buttonDataAction !== buttonDataAttribute.shopEnded ? `<i class="ico ico-caret-right-solid"></i>` : ""}
                      </div>
                    </div>
                   <img class="chest-image" src="${imageUrl}" alt="Treasure Chest">
                 </div>`;
    });

    let calendarHtml = `<div id="modal-BlackNovember" class="modal-BlackNovember modal fade" tabindex="-1" role="dialog" aria-labelledby="modal-BlackNovember-title" aria-modal="true" aria-hidden="true">
              <div class="BlackNovember-mask" aria-label="Close modal"></div>
              <div class="modal-dialog modal-dialog-centered" role="document">
                  <div class="modal-content">
                      <button type="button" class="close" data-dismiss="modal" aria-label="Close  modal">
                          <i class="ico ico-times" aria-hidden="true"></i>
                      </button>
                      <div class="modal-body">
                          <div class="modal-header-custom">
                          <div class="modal-title-sub">
                            <img src="https://c1.neweggimages.com/webresource/themes/Nest/holidays/anniversary/25th_anniversary.png" alt="">
                          </div>
                          <div class="modal-title-main" id="modal-BlackNovember-title">EXCLUSIVE D<b>O</b><b>O</b>RBUSTERS</div>
                              <p class="modal-title-desc">Unlock new deals at <strong>9am</strong> PT on the 25th of every month, all year long!</p>
                          </div>
    
                          <div class="chest-swiper-container">
                              ${chestsHtml}
                          </div>
                      </div>
                  </div>
              </div>
          </div>`;

    return calendarHtml;
  }

  function fetchDoorbusterData() {
    let doorbusterStartDate = new Date(eventConfig[0].startDate);
    initializeCountdown(doorbusterStartDate);
  }

  async function checkInventoryStatus() {
    try {
      const response = await fetch(
        `${window.location.origin}/api/common/DoorBusterUpcoming`
      );
      if (!response.ok) {
        console.error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const now = new Date();
      let GroupBuyEndDate = new Date(data?.[0]?.GroupBuyEndDate);
      return data && data[0] && data[0].Instock && now <= GroupBuyEndDate;
    } catch (error) {
      return false;
    }
  }

  async function initializeCountdown(doorbusterStartDate) {
    let now = new Date();

    if (now < doorbusterStartDate) {
      const countdown = createUTCCountdown({
        targetDate: doorbusterStartDate,
        interval: 1000,
        onEnd: async () => {
          const inventoryStatus = await checkInventoryStatus();
          buildPageBar(pageBarStatus.started, 0, 0, 0, 0, 0, inventoryStatus);
        },
      });

      countdown.onTick((timeLeft, formatted) => {
        let days = formatted.days;
        let hours = formatted.hours;
        let minutes = formatted.minutes;
        let seconds = formatted.seconds;
        let milliseconds = formatted.milliseconds;

        buildPageBar(
          pageBarStatus.upcoming,
          days,
          hours,
          minutes,
          seconds,
          milliseconds
        );
      });
    } else {
      const inventoryStatus = await checkInventoryStatus();
      buildPageBar(pageBarStatus.started, 0, 0, 0, 0, 0, inventoryStatus);
    }
  }

  fetchDoorbusterData();
  bindModalEvents();

  if (!initialized) {
    initializeModal().then(() => {
      initialized = true;
      showDailyModal();
    });
  }
});
