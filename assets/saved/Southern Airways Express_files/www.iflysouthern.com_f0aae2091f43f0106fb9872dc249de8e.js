	var _cartstack = _cartstack || [];
	var cartstack_loaded = cartstack_loaded || 0;
		
	if (!cartstack_loaded)
	{
		cartstack_loaded = 1;
		
		_cartstack.push(['setSiteID', 'k49VW11aRg==']); /* required */
		_cartstack.push(['setDomain', '.iflysouthern.com']);
		_cartstack.push(['setEmailAddressInput', 'cartstack_noinput']);
		_cartstack.push(['setAPI', 'capture']);
		
		var cartstack_cartPageURL = '/checkout/';
		var cartstack_checkoutPageURLs = ['','',''];
		var cartstack_successPageURL = '/confirmation';
		var cartstack_isconfirmation = 0;
		var cartstack_debug = 0;
		var cartstack_trackVisitor = 1;
		var cartstack_pageurl = window.location.href.toLowerCase();
		var cartstack_cartTotal = '';
		var cartstack_dataItems = [];
		var cartstack_tracking = 1;
		
		function cartstack_getTracking()
		{   
			(function(){
				
				if (typeof cartstack_livecallback != 'undefined' && typeof cartstack_updatecart != 'undefined' && typeof cartstack_regex != 'undefined')
				{
					var _currentPageURL = '';
					var _emailValue = '';
					
					setTimeout((function executeInterval(){
						var _pageURL = window.location.href.toLowerCase();
						var _confirmation = 0;
						if (_currentPageURL != _pageURL)
						{
							_currentPageURL = _pageURL;
							
							if (cartstack_successPageURL.length > 0 && _pageURL.indexOf(cartstack_successPageURL.toLowerCase()) >= 0)
							{
								_confirmation = 1;
								
								var _update = [];
								_update.push(['setSiteID', 'k49VW11aRg==']);
								_update.push(['setAPI', 'confirmation']);
								cartstack_updatecart(_update);
							}
							else if (cartstack_cartPageURL.length > 0 && _pageURL.indexOf(cartstack_cartPageURL.toLowerCase()) >= 0)
							{
								var _emailInput = document.getElementById('email');
								if (_emailInput && _emailInput.value.trim().length > 0 && cartstack_regex.test(_emailInput.value.trim())) { _emailValue = _emailInput.value.trim(); }
								
								var _update = [];
								_update.push(['setSiteID', 'k49VW11aRg==']);
								_update.push(['setAPI', _emailValue.length > 0 ? 'tracking' : 'tracking-cart']);
								if (_emailValue.length > 0) { _update.push(['setEmail', _emailValue]); }
								
								var _cartTotal = '';
								if (typeof dataLayer != 'undefined')
								{
									for(var i=dataLayer.length-1; i>=0; i--)
									{
										if (typeof dataLayer[i].event != 'undefined' && dataLayer[i].event == 'SET_ON_DEMAND_FLIGHT' && typeof dataLayer[i].flight != 'undefined')
										{
											var _manufacturerDisplay = '';
											var _modelDisplay = '';
											if (typeof dataLayer[i].flight.originAirportCode != 'undefined') { _update.push(['setDataItem', {'originairportcode':dataLayer[i].flight.originAirportCode}]); _update.push(['setAttribute', {'originairportcode':dataLayer[i].flight.originAirportCode}]); }
											if (typeof dataLayer[i].flight.destinationAirportCode != 'undefined') { _update.push(['setDataItem', {'destinationairportcode':dataLayer[i].flight.destinationAirportCode}]); _update.push(['setAttribute', {'destinationairportcode':dataLayer[i].flight.destinationAirportCode}]); }
											if (typeof dataLayer[i].flight.passengerSeatCount != 'undefined') { _update.push(['setDataItem', {'passengerseatcount':dataLayer[i].flight.passengerSeatCount}]); _update.push(['setAttribute', {'passengerseatcount':dataLayer[i].flight.passengerSeatCount}]); }
											if (typeof dataLayer[i].flight.aircraftModel != 'undefined' && typeof dataLayer[i].flight.aircraftModel.manufacturerDisplay != 'undefined') { _manufacturerDisplay = dataLayer[i].flight.aircraftModel.manufacturerDisplay; }
											if (typeof dataLayer[i].flight.aircraftModel != 'undefined' && typeof dataLayer[i].flight.aircraftModel.modelDisplay != 'undefined') { _modelDisplay = dataLayer[i].flight.aircraftModel.modelDisplay; }
											if (typeof dataLayer[i].flight.totalWithTaxesAndFees != 'undefined') { _cartTotal = dataLayer[i].flight.totalWithTaxesAndFees; }
											if (_manufacturerDisplay.length > 0 && _modelDisplay.length > 0) { _update.push(['setDataItem', {'aircrafttype':_manufacturerDisplay+' '+_modelDisplay}]); _update.push(['setAttribute', {'aircrafttype':_manufacturerDisplay+' '+_modelDisplay}]); }
											break;
										}
									}
								}
								_update.push(['setCartTotal', _cartTotal]);
								_update.push(["setDataItem", { "returnurl" : window.location.href }]);
								
								cartstack_updatecart(_update);
							}
							else
							{
								/* Do nothing... */
							}
						}                 
						if (!_confirmation) { setTimeout(executeInterval, 1500); }
					})(), 1500);
				
					cartstack_livecallback("blur", "input", "id", "value", function (event) {
						if (cartstack_regex.test(this.value) && _emailValue != this.value)
						{
							_emailValue = this.value;
							
							var _update = [];
							_update.push(['setSiteID', 'k49VW11aRg==']);
							_update.push(['setEmail', _emailValue]);
							
							var _cartTotal = '';
							if (typeof dataLayer != 'undefined')
							{
								for(var i=dataLayer.length-1; i>=0; i--)
								{
									if (typeof dataLayer[i].event != 'undefined' && dataLayer[i].event == 'SET_ON_DEMAND_FLIGHT' && typeof dataLayer[i].flight != 'undefined')
									{
										var _manufacturerDisplay = '';
										var _modelDisplay = '';
										if (typeof dataLayer[i].flight.originAirportCode != 'undefined') { _update.push(['setDataItem', {'originairportcode':dataLayer[i].flight.originAirportCode}]); _update.push(['setAttribute', {'originairportcode':dataLayer[i].flight.originAirportCode}]); }
										if (typeof dataLayer[i].flight.destinationAirportCode != 'undefined') { _update.push(['setDataItem', {'destinationairportcode':dataLayer[i].flight.destinationAirportCode}]); _update.push(['setAttribute', {'destinationairportcode':dataLayer[i].flight.destinationAirportCode}]); }
										if (typeof dataLayer[i].flight.passengerSeatCount != 'undefined') { _update.push(['setDataItem', {'passengerseatcount':dataLayer[i].flight.passengerSeatCount}]); _update.push(['setAttribute', {'passengerseatcount':dataLayer[i].flight.passengerSeatCount}]); }
										if (typeof dataLayer[i].flight.aircraftModel != 'undefined' && typeof dataLayer[i].flight.aircraftModel.manufacturerDisplay != 'undefined') { _manufacturerDisplay = dataLayer[i].flight.aircraftModel.manufacturerDisplay; }
										if (typeof dataLayer[i].flight.aircraftModel != 'undefined' && typeof dataLayer[i].flight.aircraftModel.modelDisplay != 'undefined') { _modelDisplay = dataLayer[i].flight.aircraftModel.modelDisplay; }
										if (typeof dataLayer[i].flight.totalWithTaxesAndFees != 'undefined') { _cartTotal = dataLayer[i].flight.totalWithTaxesAndFees; }
										if (_manufacturerDisplay.length > 0 && _modelDisplay.length > 0) { _update.push(['setDataItem', {'aircrafttype':_manufacturerDisplay+' '+_modelDisplay}]); _update.push(['setAttribute', {'aircrafttype':_manufacturerDisplay+' '+_modelDisplay}]); }
										break;
									}
								}
							}
							_update.push(['setCartTotal', _cartTotal]);
							_update.push(["setDataItem", { "returnurl" : window.location.href }]);
							
							cartstack_updatecart(_update);
						}
					});
				}
			})();
		}
		(function(){var y = document.getElementsByTagName('script');var l=1;for(var i=0; i < y.length; i++){if (y[i].src == 'https://api.cartstack.com/js/cartstack_utility.js'){l=0;}}if(l){var s = document.createElement('script');s.type = 'text/javascript';s.async = true;s.src = 'https://api.cartstack.com/js/cartstack_utility.js';var x = document.getElementsByTagName('script')[0];x.parentNode.insertBefore(s, x);}})();
		(function(){function cartstack_load(){var y = document.getElementsByTagName('script');var l=1;for(var i=0; i < y.length; i++){if (y[i].src == 'https://api.cartstack.com/js/cartstack.js'){l=0;}}if(l){var s = document.createElement('script');s.type = 'text/javascript';s.async = true;s.src = 'https://api.cartstack.com/js/cartstack.js';var x = document.getElementsByTagName('script')[0];x.parentNode.insertBefore(s, x);}}if(cartstack_isconfirmation){setTimeout(cartstack_load, 1500);}else{var checkStateCount=0;setTimeout(function checkState(){if(document.readyState==='complete'||checkStateCount>10){cartstack_load();}else{checkStateCount++;setTimeout(checkState, 1500);}},1500);}})();
	}