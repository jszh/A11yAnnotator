var month3Ltr = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function assignIframeClassW(iframeID) {
    var iframeW = jQuery('iframe#'+iframeID).width();
    //console.log('iframeW',iframeW);
    var selClass = '';
    if(iframeW < 500) {
        selClassNum = 'sm';
    } else if (iframeW >= 500) {
        selClassNum = 'md';
    }
    jQuery('iframe#'+iframeID).attr('data-size',selClassNum);
}

function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    var expires = "expires="+d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

function checkCookie() {
    var user = getCookie("username");
    if (user != "") {
        alert("Welcome again " + user);
    } else {
        user = prompt("Please enter your name:", "");
        if (user != "" && user != null) {
            setCookie("username", user, 365);
        }
    }
}

function isJson(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

function getTodayDate() {
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    var yyyy = today.getFullYear();

    return mm + '/' + dd + '/' + yyyy;
}

function getTodayDateOrUrlParam(urlParam) {
    var selUrlParam = decodeURIComponent(getUrlParam(urlParam,''));
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    var yyyy = today.getFullYear();

    return selUrlParam.length ? selUrlParam : mm + '/' + dd + '/' + yyyy;
}

var formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
});

function getUrlVars() {
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        vars[key] = value;
    });
    return vars;
}

function getUrlParam(parameter, defaultvalue){
    var urlparameter = defaultvalue;
    if(window.location.href.indexOf(parameter) > -1){
        urlparameter = getUrlVars()[parameter];
    }
    return urlparameter;
}

function addOnClickAnchor(id) {
    jQuery( '#' + id + ' a.anchor-to-deck' ).on('click', function(e) {
        e.preventDefault();
        if (this.hash !== "") {
            //console.log('jQuery(this.hash)',jQuery(this.hash));
            jQuery('html, body').animate({
                scrollTop: jQuery(this.hash).offset().top - document.getElementById('masthead').offsetHeight - 50
            }, 800, function(e){
            });
        }
    });
}

var defaultOWStagingJson = {
  "ON_DEMAND": {
    "originAirportFilteredIds": null,
    "destinationAirportFilteredIds": null,
    "tripType": "ROUND_TRIP",
    "flight": {},
    "originLocation": {
      "coords": [
        -118.8376,
        34.1706
      ],
      "displayName": "Thousand Oaks, California",
      "country": "US"
    }
  },
  "SCHEDULED": {
	"seatsFilters": {
      "adults": 0,
      "children": 0,
      "lapInfants": 0
    },
    "dateTimeFilters": {
      "departureDate": "2024-09-27"
    },
    "originAirportFilteredIds": [],
    "destinationAirportFilteredIds": [],
    "tripType": "ONE_WAY",
    "selectedFlightIds": [],
    "selectedFlights": [],
    "flightSelectionIndex": 0,
    "originLocation": {
      "code": "ORD",
      "coords": [
        -87.90480042,
        41.97859955
      ],
      "displayName": "Chicago, IL",
      "country": "United States"
    },
    "destinationLocation": {
      "code": "UIN",
      "coords": [
        -91.19460297,
        39.94269943
      ],
      "displayName": "Quincy, IL",
      "country": "United States"
    }
  },
  "serviceType": "SCHEDULED"
};

var defaultRTStagingJson = {
  "ON_DEMAND": {
    "originAirportFilteredIds": null,
    "destinationAirportFilteredIds": null,
    "tripType": "ROUND_TRIP",
    "flight": {},
    "originLocation": {
      "coords": [
        -118.8376,
        34.1706
      ],
      "displayName": "Thousand Oaks, California",
      "country": "US"
    }
  },
  "SCHEDULED": {
	"seatsFilters": {
      "adults": 0,
      "children": 0,
      "lapInfants": 0
    },
    "dateTimeFilters": {
      "departureDate": "2024-10-10",
      "returnDate": "2024-10-11"
    },
    "tripType": "ROUND_TRIP",
    "selectedFlightIds": [],
    "selectedFlights": [],
    "flightSelectionIndex": 0,
    "originLocation": {
      "code": "ORD",
      "coords": [
        -87.90480042,
        41.97859955
      ],
      "displayName": "Chicago, IL",
      "country": "United States"
    },
    "destinationLocation": {
      "code": "IAD",
      "coords": [
        -91.19460297,
        39.94269943
      ],
      "displayName": "Dulles, IL",
      "country": "United States"
    }
  },
  "serviceType": "SCHEDULED"
};

(function ($) {
    'use strict';

    $(document).ready(function () {
		
		AOS.init();
		// data-aos="fade-up" data-aos-delay="50" data-aos-duration="1000"
		AOS.init({
			// Global settings:
			disable: false, // accepts following values: 'phone', 'tablet', 'mobile', boolean, expression or function
			startEvent: "DOMContentLoaded", // name of the event dispatched on the document, that AOS should initialize on
			initClassName: "aos-init", // class applied after initialization
			animatedClassName: "aos-animate", // class applied on animation
			useClassNames: false, // if true, will add content of `data-aos` as classes on scroll
			disableMutationObserver: false, // disables automatic mutations' detections (advanced)
			debounceDelay: 50, // the delay on debounce used while resizing window (advanced)
			throttleDelay: 99, // the delay on throttle used while scrolling the page (advanced)
			// Settings that can be overridden on per-element basis, by `data-aos-*` attributes:
			offset: 120, // offset (in px) from the original trigger point
			delay: 0, // values from 0 to 3000, with step 50ms
			duration: 400, // values from 0 to 3000, with step 50ms
			easing: "ease", // default easing for AOS animations
			once: true, // whether animation should happen only once - while scrolling down
			mirror: false, // whether elements should animate out while scrolling past them
			anchorPlacement: "top-bottom", // defines which position of the element regarding to window should trigger the animation
		});
		
		//console.log('app-js', $(".southern__slider")); 
		if($(".southern__slider").length) {
			$(".southern__slider").owlCarousel({
				items: 1,
				loop: true,
				margin: 25,
				nav: true,
				dots: false,
				smartSpeed: 1000,
				responsive: {
					0: {
						items: 1,
					},
					500: {
						items: 2,
					},
					1000: {
						items: 3,
					},
					1200: {
						items: 4,
					}
				},
			});
		}
		
		$(".affordable__slider").owlCarousel({
			items: 1,
			loop: true,
			margin: 26,
			nav: true,
			dots: false,
			smartSpeed: 1000,
			responsive: {
				0: {
					items: 1,
				},
				500: {
					items: 2,
				}
			},
		});
		
		$(".menu-close , .offcanvas-overlay").click(function () {
			$('body').removeClass("onepress-menu-mobile-opening");
			$('#nav-toggle').removeClass("nav-is-visible");
		});
		
        $(document).on('click', '[data-toggle="lightbox"]', function (event) {
            event.preventDefault();
            $(this).ekkoLightbox({
                alwaysShowClose: true
            });
        });
		
		$(window).click(function(event) {
			//console.log('clicking', $(event.target).parents());
			var inside = $(event.target).parents('.dropdown-passenger-open').length;
			if(!inside && $('.booking-middle .passenger').hasClass('active')) {
				$('.booking-middle .passenger').removeClass('active')
			}
		});
		
		$('nav.main-navigation').on('click', function(e) {
		});
		
		$('ul.onepress-menu li.mobile-close > a').on('click', function(e) {
			e.preventDefault();
			closeMobileNav();
			event.stopPropagation();
		});		
		
		var adultNumber = 1;
		var childNumber = 0;
		var infantNumber = 0;
		var totalNumber = adultNumber + childNumber + infantNumber;
		function updateTotalNumber(mode, num) {
			if(mode === 'adult') {
				adultNumber = num;
				$('input#hiddenADNum').val(num);
			}
			if(mode === 'child') {
				childNumber = num;
				$('input#hiddenCHDNum').val(num);
			}
			if(mode === 'infant') {
				infantNumber = num;
				$('input#hiddenINFNum').val(num);
			}
			totalNumber = adultNumber + childNumber + infantNumber;
			$('.passenger-current .num').html(totalNumber);
		}

		$('input#adultNumber').niceNumber({
			onIncrement: function($currentInput, amount, settings) {
				updateTotalNumber('adult', amount);
			},
			onDecrement: function($currentInput, amount, settings) {
				//console.log('decrement', {amount, settings})
				if(amount < 1) {
					amount = 1;
				}
				updateTotalNumber('adult', amount);
			},
		});
		$('input#childNumber').niceNumber({
			onIncrement: function($currentInput, amount, settings) {
				updateTotalNumber('child', amount);
			},
			onDecrement: function($currentInput, amount, settings) {
				updateTotalNumber('child', amount);
			},
		});
		$('input#infantNumber').niceNumber({
			onIncrement: function($currentInput, amount, settings) {
				/*let newAmount = amount;
				if(amount > adultNumber) {
					console.log('greater');
					newAmount = adultNumber;
				}*/
				//console.log('infant+', {amount, adultNumber, settings, newAmount})
				updateTotalNumber('infant', amount);
			},
			onDecrement: function($currentInput, amount, settings) {
				updateTotalNumber('infant', amount);
			},
		});


		$('.current-promo-code').click(function (e) {
            e.preventDefault();
            $(this).parent().toggleClass('active');
        });

        $('.passenger-current').click(function (e) {
            e.preventDefault();
            $(this).parent().toggleClass('active');
			e.stopPropagation();
        });
		
//         $('.login-btn-wrap a.btns.login').click(function (e) {
//             e.preventDefault();
//             $(this).parent().toggleClass('active');
//         });

        $('.grids-btn-wrap a.btns.grids').click(function (e) {
            e.preventDefault();
            $(this).parent().toggleClass('active');
        });

        $('label[for="lax"]').on('click', function() {
            // $('.destination-select .nice-select').addClass('open');
            $(this).parent().parent().find('.nice-select').toggleClass('open');
            return false;
        });

        $('label[for="to"]').on('click', function() {
            // $('.destination-select .nice-select').addClass('open');
            $(this).parent().parent().find('.nice-select').toggleClass('open');
            return false;
        });

        $('input[type="number"]').niceNumber({
            // auto resize the number input
            autoSize: true,
            // the number of extra character
            autoSizeBuffer: 1,
            // custom button text
            buttonDecrement: '-',
            buttonIncrement: "+",
            // 'around', 'left', or 'right'
            buttonPosition: 'around'
        });
		
		$('a.region-action').on('click', function(e) {
			e.preventDefault();
			console.log('activating');
			if(!$(this).hasClass('active')) {
				var thisRegion = $(this).attr('data-class');
				$('a.region-action').removeClass('active');
				$(this).addClass('active');
				$('.region-group').removeClass('open');
				$('.region-group.'+thisRegion).addClass('open');
			}
		});
			
		$('form#findBookingForm').on('submit', function(e) {
			var refNum = $('#tmpReferenceNumber').val();
			var tixNum = $('#ticketNumber').val();
			var lName = $('#travelerSurname').val();
			if(lName.length) {
				if(tixNum.length) {
					$('input[name=searchType]').val('TicketNumber');
					$('input[name=referenceNumber]').val(tixNum);
				} else {
					$('input[name=searchType]').val('PNR');
					$('input[name=referenceNumber]').val(refNum);
				}
				return true;
			} else {
				$('#travelerSurname').focus();
				$('#travelerSurname').addClass('required');
			}
			return false;
		});
		
		if($('#departReturn').length) {
			var startDate = new Date();
			var endDate = new Date();
			endDate = new Date(endDate.setDate(endDate.getDate() + 7));
			//var startDateStr1 = ( '0' + (startDate.getMonth() + 1) ).slice(-2) + '/' + ( '0' + startDate.getDate() ).slice(-2) + '/' + startDate.getFullYear();
			var startDateStr1 = month3Ltr[startDate.getMonth()] + ' ' + startDate.getDate();
			var minDateStr1 = startDateStr1;
			//var endDateStr1 = ( '0' + (endDate.getMonth() + 1) ).slice(-2) + '/' + ( '0' + endDate.getDate() ).slice(-2) + '/' + endDate.getFullYear();
			var endDateStr1 = month3Ltr[endDate.getMonth()] + ' ' + endDate.getDate();
			var startDateStr2 = startDate.getFullYear() + '-' + ( '0' + (startDate.getMonth() + 1) ).slice(-2) + '-' + ( '0' + startDate.getDate() ).slice(-2);
			var endDateStr2 = endDate.getFullYear() + '-' + ( '0' + (endDate.getMonth() + 1) ).slice(-2) + '-' + ( '0' + endDate.getDate() ).slice(-2);
			//console.log('dates', {startDateStr1,endDateStr1, startDateStr2, endDateStr2});
			$('#departReturn').daterangepicker({ 
				"singleDatePicker": false,
				"startDate": startDateStr1,
				"endDate": endDateStr1,
				"minDate": minDateStr1,
				"autoApply": true,
				"locale": {
					"format": 'MMM D'
				}
			}, function(start, end, label) { 
				console.log('auto-apply');
				startDateStr1 = start.format('MMM D');
				endDateStr1 = end.format('MMM D');
				startDateStr2 = start.format('YYYY-MM-DD');
				endDateStr2 = end.format('YYYY-MM-DD');
				var tripType = $('select#tripType').val();
				if(tripType === 'ow') {
					$(this).val(startDateStr1);
				} else {
					$(this).val(startDateStr1 + ' - ' + endDateStr1);
				}
			});
// 			$('#departReturn').on('apply.daterangepicker', function(ev, picker) {
// 				console.log('manual-apply');
// 				startDateStr1 = picker.startDate.format('MM/DD/YYYY');
// 				endDateStr1 = picker.endDate.format('MM/DD/YYYY');
// 				startDateStr2 = picker.startDate.format('YYYY-MM-DD');
// 				endDateStr2 = picker.endDate.format('YYYY-MM-DD');
// 				var tripType = $('select#tripType').val();
// 				if(tripType === 'ow') {
// 					$(this).val(startDateStr1);
// 				} else {
// 					$(this).val(startDateStr1 + ' - ' + endDateStr1);
// 				}
// 			});
		};
		
		$('select#tripType').on('change', function(e) {
			//console.log('change', $(this).val());
			var thisMode = $(this).val();
			var isSingle = true;
			if(thisMode === 'rt') {
				isSingle = false;
			} else if (thisMode === 'ow') {
				isSingle = true;
			} else if (thisMode === 'mc') {
				isSingle = false;
			}
			$('#departReturn').daterangepicker({ 
				"singleDatePicker": isSingle,
				"startDate": startDateStr1,
				"endDate": endDateStr1,
				"minDate": minDateStr1,
				"autoApply": true,
				"locale": {
					"format": 'MMM D'
				}
			}, function(start, end, label) { 
				console.log('auto-apply2');
				startDateStr1 = start.format('MMM D');
				endDateStr1 = end.format('MMM D');
				startDateStr2 = start.format('YYYY-MM-DD');
				endDateStr2 = end.format('YYYY-MM-DD');
				//console.log('picker', picker.startDate.format('MMM D'));
				var tripType = $('select#tripType').val();
				if(tripType === 'ow') {
					$(this).val(startDateStr1);
				} else {
					$(this).val(startDateStr1 + ' - ' + endDateStr1);
				}
			});
// 			$('#departReturn').on('apply.daterangepicker', function(ev, picker) {
// 				console.log('manual-apply2');
// 				startDateStr1 = picker.startDate.format('MM/DD/YYYY');
// 				endDateStr1 = picker.endDate.format('MM/DD/YYYY');
// 				startDateStr2 = picker.startDate.format('YYYY-MM-DD');
// 				endDateStr2 = picker.endDate.format('YYYY-MM-DD');
// 				//console.log('picker', picker.startDate.format('MMM D'));
// 				var tripType = $('select#tripType').val();
// 				if(tripType === 'ow') {
// 					$(this).val(startDateStr1);
// 				} else {
// 					$(this).val(startDateStr1 + ' - ' + endDateStr1);
// 				}
// 			});
		});
		
		$('select#tripType').select2({ minimumResultsForSearch: Infinity });
		
		
		$('button#searchFlight').on('click', function(e) {
			var tripType = $('select#tripType').val();
			var fromDest = $('select#OriginAirportCode').val();
			var fromLabel = $('select#OriginAirportCode option:selected').text();
			var toDest = $('select#DestinationAirportCode').val();
			var toLabel = $('select#DestinationAirportCode option:selected').text();
			var promoCode = $('input#promoCode').val();
			var isStaging = getUrlParam('staging', '') === '1';
			isStaging = typeof window.getTestVariant === 'function' && window.getTestVariant() === 'marketplace' ? true : isStaging;
			//var flex = document.getElementById("flexible-date").checked || document.getElementById("flexible-date-desktop").checked || false;
			//console.log('isStaging', isStaging);
			var flex = true;
			if(tripType === 'ow') {
				defaultOWStagingJson.SCHEDULED.dateTimeFilters.departureDate = startDateStr2;
				defaultOWStagingJson.SCHEDULED.originLocation.code = fromDest;
				defaultOWStagingJson.SCHEDULED.originLocation.displayName = fromLabel;
				defaultOWStagingJson.SCHEDULED.destinationLocation.code = toDest;
				defaultOWStagingJson.SCHEDULED.destinationLocation.displayName = toLabel;
				defaultOWStagingJson.SCHEDULED.seatsFilters.adults = adultNumber;
				defaultOWStagingJson.SCHEDULED.seatsFilters.children = childNumber;
				defaultOWStagingJson.SCHEDULED.seatsFilters.lapInfants = infantNumber;
				defaultOWStagingJson.SCHEDULED.promoCode = promoCode;
				var jOWString = encodeURIComponent(JSON.stringify(defaultOWStagingJson));
				$('#oac_ow').val(fromDest);
				$('#dac_ow').val(toDest);
				$('#od_ow').val(startDateStr2);
				$('#ttAD_ow').val(adultNumber);
				$('#ttCHD_ow').val(childNumber);
				$('#ttINF_ow').val(infantNumber);
				$('#flex_ow').val(flex);
				$('#dc_ow').val(promoCode);
				if(!isStaging) {
					$('form#searchResultFormOW').submit();
				} else {
					console.log('jOWString', {jOWString,defaultOWStagingJson});
					window.open('https://fly.staging.surfair.com/southern/explore/scheduled?s='+jOWString);
				}
			} else if(tripType === 'rt') {
				defaultRTStagingJson.SCHEDULED.dateTimeFilters.departureDate = startDateStr2;
				defaultRTStagingJson.SCHEDULED.dateTimeFilters.returnDate = endDateStr2;
				defaultRTStagingJson.SCHEDULED.originLocation.code = fromDest;
				defaultRTStagingJson.SCHEDULED.originLocation.displayName = fromLabel;
				defaultRTStagingJson.SCHEDULED.destinationLocation.code = toDest;
				defaultRTStagingJson.SCHEDULED.destinationLocation.displayName = toLabel;
				defaultRTStagingJson.SCHEDULED.seatsFilters.adults = adultNumber;
				defaultRTStagingJson.SCHEDULED.seatsFilters.children = childNumber;
				defaultRTStagingJson.SCHEDULED.seatsFilters.lapInfants = infantNumber;
				defaultRTStagingJson.SCHEDULED.promoCode = promoCode;
				var jTRString = encodeURIComponent(JSON.stringify(defaultRTStagingJson));
				$('#oac_rt').val(fromDest);
				$('#dac_rt').val(toDest);
				$('#od_rt').val(startDateStr2);
				$('#id_rt').val(endDateStr2);
				$('#ttAD_rt').val(adultNumber);
				$('#ttCHD_rt').val(childNumber);
				$('#ttINF_rt').val(infantNumber);
				$('#flex_rt').val(flex);
				$('#dc_rt').val(promoCode);
				if(!isStaging) {
					$('form#searchResultFormRT').submit();
				} else {
					console.log('jTRString', {jTRString,defaultRTStagingJson});
					window.open('https://fly.staging.surfair.com/southern/explore/scheduled?s='+jTRString);
				}
			} else {
				defaultRTStagingJson.SCHEDULED.dateTimeFilters.departureDate = startDateStr2;
				defaultRTStagingJson.SCHEDULED.dateTimeFilters.returnDate = endDateStr2;
				defaultRTStagingJson.SCHEDULED.originLocation.code = fromDest;
				defaultRTStagingJson.SCHEDULED.originLocation.displayName = fromLabel;
				defaultRTStagingJson.SCHEDULED.destinationLocation.code = toDest;
				defaultRTStagingJson.SCHEDULED.destinationLocation.displayName = toLabel;
				defaultRTStagingJson.SCHEDULED.seatsFilters.adults = adultNumber;
				defaultRTStagingJson.SCHEDULED.seatsFilters.children = childNumber;
				defaultRTStagingJson.SCHEDULED.seatsFilters.lapInfants = infantNumber;
				defaultRTStagingJson.SCHEDULED.promoCode = promoCode;
				var jTRString = encodeURIComponent(JSON.stringify(defaultRTStagingJson));
				$('#oac0_mc').val(fromDest);
				$('#dac0_mc').val(toDest);
				$('#od0_mc').val(startDateStr2);
				$('#oac1_mc').val(toDest);
				$('#dac1_mc').val(toDest);
				$('#od1_mc').val(endDateStr2);
				$('#ttAD_mc').val(adultNumber);
				$('#ttCHD_mc').val(childNumber);
				$('#ttINF_mc').val(infantNumber);
				$('#flex_mc').val(flex);
				$('#dc_mc').val(promoCode);
				if(!isStaging) {
					$('form#searchResultFormMC').submit();
				} else {
					window.open('https://fly.staging.surfair.com/southern/explore/scheduled?s='+jTRString);
				}
			}
			//console.log('departReturn', {fromDest,fromLabel,toDest,toLabel,tripType,promoCode,flex,startDateStr2,endDateStr2,adultNumber,childNumber,infantNumber,defaultOWStagingJson,jOWString});
			return false;
		});
		
		$('#flexible-date-desktop').on('change', function(e) {
			document.getElementById("flexible-date").checked = document.getElementById("flexible-date-desktop").checked;
		});
		$('#flexible-date').on('change', function(e) {
			document.getElementById("flexible-date-desktop").checked = document.getElementById("flexible-date").checked;
		});
		
		$('input#promoCode').on('change', function(e) {
			console.log('new-val', $(this).val());
			$('input#promoCodeMobile').val($(this).val());
		});
		$('input#promoCodeMobile').on('change', function(e) {
			console.log('new-val', $(this).val());
			$('input#promoCode').val($(this).val());
		});
		
		$('form#mc-embedded-subscribe-form').on('submit', function(e) {
			var email = $('input#MERGE0').val();
			if(email.length) {
				return true;
			}
			$('input#newEmail').focus();
			return false;
		});
		
		var airportData = [];
		
		function matchStart(params, data) {
			// If there are no search terms, return all of the data
			if ($.trim(params.term) === '') {
				return data;
			}
			// Skip if there is no 'children' property
			if (typeof data.children === 'undefined') {
				//return null;
			}
			
			//console.log('matchStart', {params, data}, params.term.length);
			if( params.term.length === 3) {
				if( (data.code || '').toLowerCase() === params.term.toLowerCase()) {
					return data;
				} else {
					return null;
				}
			} else {
				if ( data.text.toLowerCase().indexOf(params.term.toLowerCase()) >= 0 ) {
					return data;
				} else {
					return null;
				}
			}
			
			// Return `null` if the term should not be displayed
			return null;
		}
		function sortResult(result) {
			console.log('sortResult', result);
			return result.sort(function (a, b) {
				var numberToSortA = a.weight === null ? 0 : parseFloat(a.weight);
				var numberToSortB = b.weight === null ? 0 : parseFloat(b.weight);
				return numberToSortB - numberToSortA;
			})
			//return result;
		}
		function parseAirportJson(ap) {
			for(var i = 0; i < ap.length; i++) {
				var weight = ap[i].weight || 1;
				airportData.push({ id: ap[i].Code, text: ap[i].Label + ' ('+ap[i].Code+')', code: ap[i].Code, weight: weight });
				//airportData.push({ id: ap[i].Code, text: ap[i].Code + ' - ' + ap[i].Label });
			}
		}
		$.ajax({
			dataType:"json",
			url: "/wp-content/themes/iflysouthern/json/airports-list.json",
			success:function(airportList){
				//console.log('airportList', airportList);
				parseAirportJson(airportList);
				//console.log('airportData', airportData);
				$('select#OriginAirportCode').select2(
					{
						data: airportData,
						placeholder: 'Select from',
						//allowClear: true,
						dropdownParent: $('.popup-destination-from'),
						minimumInputLength: 3,
						//matcher: matchStart,
						sorter: sortResult,
						/*sorter: function(results) {
							console.log('sorter', results);
							return results;
						}*/
					}
				);
				$('select#DestinationAirportCode').select2(
					{
						data: airportData,
						placeholder: 'Select to',
						//allowClear: true,
						dropdownParent: $('.popup-destination-to'),
						minimumInputLength: 3,
					}
				);
			},error:function(jqXHR,error,errorThrown){
				if(jqXHR.status&&jqXHR.status==400){
					console.log(jqXHR.responseText)
				} else {
					console.log("Something went wrong - ",error)
				}
			}
		});
		
		$('.destination-left label').on('click', function(e) {
			//console.log('click-h4', $('.popup-destination-from .select2-container--open').length);
			$('select#OriginAirportCode').select2('open');
		});
		$('.destination-right label').on('click', function(e) {
			//console.log('click-h4');
			$('select#DestinationAirportCode').select2('open');
		});
		
		$('select#OriginAirportCode').on('select2:select', function (e) {
			var data = e.params.data;
			var airportId = data.id || 'FROM';
			$('.destination-left label').html(airportId);
			//console.log(data);
		});
		$('select#DestinationAirportCode').on('select2:select', function (e) {
			var data = e.params.data;
			var airportId = data.id || 'TO';
			$('.destination-right label').html(airportId);
			//console.log(data);
		});
		$('.close-banner').on('click', function(e) {
			e.preventDefault();
			$('.top-banner-wrapper').addClass('hide');
			$('.block-banner-wrapper').addClass('opacity-zero');
		});
		
		if(location.hostname === 'southernwordpress.surfairdev.com') {
			$('a.flight-lookup-cta').attr('href', 'https://fly.staging.surfair.com/southern/flight-lookup');
			$('li.flight-lookup-cta a').attr('href', 'https://fly.staging.surfair.com/southern/flight-lookup');
			/*$('a.flight-lookup-cta').on('click', function(e) {
				console.log('clicked1');
				e.preventDefault();
			});
			$('li.flight-lookup-cta a').on('click', function(e) {
				console.log('clicked2');
				e.preventDefault();
			});*/
		}
		
    });
})(jQuery);


