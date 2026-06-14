// Copy link to clipboard

jQuery(document).ready(function ($) {
  $('#copy-edu-quote').on('click', function () {
    const textToCopy = $('#edu-quote-link').text();

    const tempInput = $('<textarea>');
    tempInput.val(textToCopy);
    $('body').append(tempInput);
    tempInput.select();
    document.execCommand('copy');
    tempInput.remove();

    $(this).text('Link copied');
    setTimeout(() => {
      $(this).text('Copy link');
    }, 1500);
  });

  if ($('#quoteForm').length ) {
    $('#quoteForm')[0].reset();

    const urlParams = new URLSearchParams(window.location.search);
    let planOptionParam = urlParams.get('plan_option');
    const planOptions = document.getElementById('plan_option');
      Array.from(planOptions.options).forEach((option) => {
        if (option.value === planOptionParam) {
          option.selected = true;
        }
      });

    let planCardIdParam = +urlParams.get('plan');
    const plan = document.getElementById('plan');
    Array.from(plan.options).forEach((option) => {
      if (+option.value === planCardIdParam) {
          option.selected = true;
      }
    });

    let quantityParam = +urlParams.get('plan_quantity');
    const quantity = document.getElementById('quantity');
    if (!isNaN(quantityParam) && quantityParam > 4) {
        quantity.value = quantityParam;
    } else {
      quantity.value = 5;
    }

    // Change plan option based on plan type
    const allPlanOptions = [];
    $('#plan option:not(:first-child)').each(function() {
      allPlanOptions.push($(this).clone());
    });

    $('#plan_option').on('change', function (e) {
      const className = e.target.value;
      const planSelect = $('#plan');
      planSelect.val('');
      $('#plan option:not(:first-child)').remove();
      if (className) {
        $('#plan option:first').text(kts('Select a plan'));
        allPlanOptions.forEach(function(option) {
          if (option.hasClass(className)) {
            planSelect.append(option.clone());
          }
        });
      } else {
        $('#plan option:first').text(kts('Select a plan type first'));
      }
    });
    
    $('#plan option:first').text(kts('Select a plan type first'));
    $('#plan option:not(:first-child)').remove();

    setTimeout(() => {
      $('#plan_option').trigger('change');
      $('#plan').trigger('change');
      $('#country').trigger('change');
    }, 1000);
    // Get the plan name and add it to a hidden field
    $('#plan').on('change', function () {
      const selectedOption = $(this).find('option:selected');
      const planType = selectedOption.text();
      const planCode = selectedOption.data('plan-code');
      $('input[name="plan_type"]').val(planType);
      $('input[name="plan_code"]').val(planCode);
    });
    $('#plan').on('focus', ()=>{
      if ( $('#plan_option')[0].selectedIndex == 0 ) {
        $('#plan option:first').text(kts('Select a plan type first'));
        $('#plan option:not(:first-child)').remove();
      }
    }).on('blur', ()=>{
      if ( $('#plan_option')[0].selectedIndex == 0 ) {
        $('#plan option:first').text(kts('Select a plan type first'));
      } else {
        $('#plan option:first').text(kts('Select a plan'));
      }
    });

    $('#country').on('change', function () {
      const country = $(this).val();
      if (country) {
        const countryName = $(this).find('option:selected').text();
        const countryCode = isInEurope(country) ? 'EU' : country;
        const countryCurrency = getCurrencySymbol(countryCode);
        $('input[name="currency_symbol"]').val(countryCurrency);
        $('input[name="country_name"]').val(countryName);
      }
    });

    function isInEurope(country = '') {
      const europeanCountries = [
        'AL', // Albania,AL
        'AD', // Andorra,AD
        'AT', // Austria,AT
        'AZ', // Azerbaijan,AZ
        'BY', // Belarus,BY
        'BE', // Belgium,BE
        'BA', // Bosnia and Herzegovina,BA
        'BG', // Bulgaria,BG
        'HR', // Croatia,HR
        'CY', // Cyprus,CY
        'CZ', // Czech Republic,CZ
        'DK', // Denmark,DK
        'EE', // Estonia,EE
        'FI', // Finland,FI
        'FR', // France,FR
        'GE', // Georgia,GE
        'DE', // Germany,DE
        'GR', // Greece,GR
        'HU', // Hungary,HU
        'IS', // Iceland,IS
        'IE', // Ireland,IE
        'IT', // Italy,IT
        'KZ', // Kazakhstan,KZ
        'XK', // Kosovo,XK
        'LV', // Latvia,LV
        'LI', // Liechtenstein,LI
        'LT', // Lithuania,LT
        'LU', // Luxembourg,LU
        'MK', // Macedonia,MK
        'MT', // Malta,MT
        'MD', // Moldova,MD
        'MC', // Monaco,MC
        'ME', // Montenegro,ME
        'NL', // Netherlands,NL
        'PL', // Poland,PL
        'PT', // Portugal,PT
        'RO', // Romania,RO
        'RU', // Russia,RU
        'SM', // San Marino,SM
        'RS', // Serbia,RS
        'SK', // Slovakia,SK
        'SI', // Slovenia,SI
        'ES', // Spain,ES
        'SE', // Sweden,SE
        'CH', // Switzerland,CH
        'TR', // Turkey,TR
        'UA', // Ukraine,UA
        'VA', // Vatican City,VA
      ];
      return europeanCountries.indexOf(country.toUpperCase()) >= 0;
    }

    function getCurrencySymbol(country = '') {
      country = country.toUpperCase();
      switch (country) {
        case 'GB':
          return '£';
        case 'NO':
          return 'kr';
        case 'EU':
          return '€';
        default:
          return '$';
      }
    }

    function convertCurrency(country, price) {
      switch (country) {
        case 'US':
        case 'GB':
        case 'EU':
          return price * 1.0;
        case 'AU':
        case 'CA':
        case 'NZ':
          return price * 1.5;
        case 'NO':
          return price * 10.0;
        default:
          return price * 1.0;
      }
    }

    function updatePricing() {
      const selectedOption = $('#plan').find('option:selected');
      if(selectedOption.val()) {
        const jsonUrl = window.location.origin+'/wp-json/wp/v2/pricing_card/' + selectedOption.val();
        const quantity = document.getElementById('quantity');
        const term = document.getElementById('term');
        const quantityValue = parseInt(quantity.value);
        const termValue = parseInt(term.value);
      
        $.ajax({
          url: jsonUrl,
          dataType: 'json',
          success: function (data) {
            const acfData = data.acf;
            acfData.slider_intervals.forEach(interval => {
              if (interval.slider_count <= quantityValue && quantityValue < 25) {
                const price = parseFloat(data.acf.pc_12_annual_price * quantityValue);
                const discountPrice = parseFloat(interval.slider_price_annual);
                const total = parseFloat((interval.slider_price_annual * quantityValue * termValue).toFixed(2));
                const country = $('#country').val();
                $('input[name="discount_code"]').val(interval.slider_coupon);
                $('input[name="price"]').val(convertCurrency(country, price));
                $('input[name="discount_price"]').val(convertCurrency(country, discountPrice));
                $('input[name="total_price"]').val(convertCurrency(country, total));
                return false;
              } else if (quantityValue >= 25) {
                $('input[name="discount_code"]').val('');
                $('input[name="discount_price"]').val('');
                $('input[name="total_price"]').val('');
                return false;
              }
            });
          },
          error: function (error) {
            console.error('Error:', error);
          }
        });
      }
    }
    updatePricing


    const quoteID = quoteIDGenerator(15);
    function updateQuoteLink() {
      const quantity = document.getElementById('quantity');
      const quantityValue = parseInt(quantity.value);
      $('#userId').val(quoteID);
      if (quantityValue <= 24) {
          $('#quote_link').val(window.location.origin + '/files/quotes/' + quoteID + '.pdf');
      } else {
          $('#quote_link').val('');
      }
    }  


    $('#plan, #term, #country, #quantity').on('change', function() {updatePricing();updateQuoteLink();});
  
    function quoteIDGenerator(length = 10) {
      const characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const charactersLength = characters.length;
      let quoteIdString = '';
      for (let i = 0; i < length; i++) {
          quoteIdString += characters[Math.floor(Math.random() * charactersLength)];
      }
      return quoteIdString;   
    }

    const updatePhoneDisplay = (selectElement) => {
      const $select = $(selectElement);
      const phoneCodeData = $select.find('option:selected').data('phone-code');
      if (!phoneCodeData) return;
      $select.find('.temp-display').remove();
      $select.prepend(`<option value="${$select.val()}" class="temp-display" selected style="display:none">${phoneCodeData}</option>`);
    };
      
    var $phoneSelects = $('.phone-country-code');
    var $countrySelect = $('#country');

    $phoneSelects.each(function () {
      updatePhoneDisplay(this);
    });

    $phoneSelects.on('change', function () {
      updatePhoneDisplay(this);
    })

    $countrySelect.on('change', function () {
      const countryVal = $(this).val();
      const phoneCode = $phoneSelects.eq(0).find(`[data-phone-code^="${countryVal} "]`).val();
      if (phoneCode) {
        $phoneSelects.val(phoneCode).each(function () {
          updatePhoneDisplay(this);
        });
      }
    });

    $('.control__field--phone').each(function () {
      const $phoneInput = $(this).find('input[type="tel"]');
      const $countryCodeSelect = $(this).find('.phone-country-code');
      if ($phoneInput.length && $countryCodeSelect.length) {
        $phoneInput.on('input', () => {
          let value = $phoneInput.val().replace(/[^\d\s\-()]/g, '');
          const code = $countryCodeSelect.val();
          if (value.startsWith(code.substring(1))) value = value.substring(code.length - 1);
          if (value.startsWith('0')) value = value.substring(1);
          $phoneInput.val(value);
        });
      }
    });

  $('#quoteForm').on('submit', function () {
    $('.control__field--phone').each(function () {
      const phoneInput = $(this).find('input[type="tel"]');
      const countryCodeSelect = $(this).find('.phone-country-code');
        const phoneVal = phoneInput.val().replace(/\s/g, '');
        const codeVal = countryCodeSelect.val();
        if (phoneVal && codeVal) {
          if (!phoneVal.startsWith(codeVal)) {
              phoneInput.val(codeVal + phoneVal);
            } else {
              phoneInput.val(phoneVal);
            }
          countryCodeSelect.prop('disabled', true);
        }
    });
  });

  }
});

// Hide finance Section Option
function toggleFinanceSection() {
  const checkbox = document.getElementById('different_info_checkbox');
  const financeSection = document.getElementById('finance_section');
  if (checkbox && financeSection) {
    financeSection.style.display = checkbox.checked ? 'none' : 'block';
  }
}
//Showing states if in US
function toggleStateField() {
  const countrySelect = document.getElementById('country');
  const stateControl = document.getElementById('state-control');
  const stateControlDiv = stateControl.closest('.control'); 
  
  if (countrySelect.value === 'US') {
      stateControl.style.display = 'block'; 
      stateControlDiv.setAttribute('data-required', 'required'); 
  } else {
      stateControl.style.display = 'none'; 
      stateControlDiv.removeAttribute('data-required');  
  }
}



