;(function () {
  var util = {
    calculateFinalPrice: function(items, callback, initValue) {
      price = items?.reduce((pre, cur) => pre + callback(cur), initValue || 0);
      return [price.toFixed(2), ...price.toFixed(2).split('.')];
    },
    setSessionStorage: function (name, value) {
      const storage = JSON.parse(sessionStorage['NV_NeweggSessionStorage']);
      storage[name] = value;
      sessionStorage['NV_NeweggSessionStorage'] = JSON.stringify(storage);
    },
    setLocalStorage: function (name, value) {
      const storage = JSON.parse(localStorage['NV_NeweggLocalStorage']);
      storage[name] = value;
      localStorage['NV_NeweggLocalStorage'] = JSON.stringify(storage);
      
    },
    getLocalStorage: function (name) {
        return JSON.parse(localStorage['NV_NeweggLocalStorage'])[name];
    },
    ng_getCookie: function (name) {
      var nameEQ = name + '=';
      var cookies = document.cookie.split(';');
      for (var i = 0; i < cookies.length; i++) {
          var cookie = cookies[i];
          while (cookie.charAt(0) === ' ') {
              cookie = cookie.substring(1, cookie.length);
          }
          if (cookie.indexOf(nameEQ) === 0) {
              var decodedCookie = decodeURIComponent(cookie.substring(nameEQ.length, cookie.length));
              return decodedCookie;
          }
      }
      return null;
    },
    useImpression: (node, callback) => {
      if (node) {
          const observer = new IntersectionObserver(function(entries){
              if (entries[0].isIntersecting) {
                  observer.unobserve(node);
                  callback && callback(node);
              }
          });
          observer.observe(node);
      }
    },
    sendGa4Fc: (event, name, products) => {
      window?.__ga_push({
        event: event,
        module_name: name,
        products: products,
      })
    },
  };

  function PopularRank(props) {}
  PopularRank.prototype = {
    data: {
      config: __SITE__.homeConfig.NewBentoHero.personalCard?.find(card => card?.Type == 'pcBuilds'),
      popularRank: null
    },

    render: function () {
      var callBack = (products) => {
        const { Items, DynamicComboDiscount, PCodeDiscount } = this.data.popularRank;
        const displayOrder = [2, 3, 4, 5, 6, 0, 1];
        const itemsMap = new Map(Items?.map(item => [Number(item?.ComponentId), item]));
        const savePrice = +DynamicComboDiscount + +PCodeDiscount;
        const foramtSavePrice = savePrice.toFixed(2).split('.');
        const wasPrice =  util?.calculateFinalPrice(Items, (item) => (item?.['UnitCost'] - item?.['InstantRebateAmount']), 0);
        const currentPrice = (+wasPrice?.[0] - savePrice).toFixed(2).split('.');

        var html = `
          ${this.addStyle()}
          <div class="masker opacity-30" style="display: none;" id="popularRankLoading">
              <div class="loading">
                  <i class="ico ico-spinner ico-spin"></i>
              </div>
          </div>
          <div data-macy-complete="1"  class="grid-col goods-list-pcb" id="PopularRankInGuessYouLike">
            <div class="black-pcb">
							<div class="black-pcb-title">
								${this.data?.config?.Title ?? 'Black Friday’s Ultimate PC Builds'}
						   </div>
						   <a class="black-pcb-link">
							  <span>Shop now</span> <i class="ico ico-caret-right-solid" aria-label="more"></i>
						   </a>
						   <div class="black-pcb-con">
								<div class="left">
									<div class="goods-price is-vertical font-s">
										<div class="goods-price-current">
											<span class="goods-price-symbol">$</span>
											<span class="goods-price-value"><strong>${currentPrice?.[0]}</strong><sup>.${currentPrice?.[1]}</sup></span>
										</div>
										<div class="goods-price-was text-gray font-s">$${wasPrice?.[0]}</div>
									</div>
									<div class="black-pcb-save">
										<strong>Save</strong>
										<div class="black-pcb-save-price">
											$<span>${foramtSavePrice?.[0]}</span><sup>.${foramtSavePrice?.[1]}</sup>
										</div>
									</div>
								</div>
								<div class="right">
									<div class="black-pcb-items">
                    ${
                      displayOrder.map((index) => {
                        const item = itemsMap.get(this?.data.config?.ComponentsPosition?.[index]);
                        return (
                          `<div class="black-pcb-item">
                            <img src='https://c1.neweggimages.com/nobgproductcompressall300/${item.ImageName}' alt='${item?.Description?.Title}' title='${item?.Description?.Title}' />
                          </div>`
                        )
                      }).join('')
                    }
									</div>
								</div>
						   </div>
						</div>
          </div>
        `;
        $('#Guess_You_Like').children().first().after(html);
        util.useImpression(jQuery('#PopularRankInGuessYouLike').get(0), function() {
          util.sendGa4Fc('modules_view', 'homepage-pers-home pc builds-recommend', products?.map(item => item?.ItemNumber)?.join('|'));
        });
        jQuery('#PopularRankInGuessYouLike').on('click', () => {
          util.sendGa4Fc('modules_click', 'homepage-pers-home pc builds-recommend', products?.map(item => item?.ItemNumber)?.join('|'));
          this.handleClick();
        });
      };
      !!this.data.popularRank ? callBack(this.data.popularRank?.Items) : this.getPopularRankList((popularRank) => {
        this.data.popularRank = popularRank;
        callBack(this.data.popularRank?.Items);
      })
    },

    getPopularRankList: function (callback) {
      jQuery.ajax({
        url: document.location.origin +'/api/Common/PopularRankOfDIY',
        cache: false,
        type: 'GET',
        success: function (source) {
          var data = JSON.parse(source);
          if (!data?.PopularRankings?.[0]?.Items?.length) {
            return
          }
          callback(data?.PopularRankings?.[0]);
        }.bind(this),
        error: function (e) {
          console.log(e);
        }.bind(this),
      })
    },

    handleClick: function () {
      $('#popularRankLoading').show();
      this.addNew();
    },

    addNew: function () {
      const CustomerNumber = JSON.parse(util.ng_getCookie('CustomerLogin'))?.CustomerNumber;
      const currentData = {
        Title: this.data?.config?.Title ?? 'Black Friday’s Ultimate PC Builds',
        DiyListNumber: 0,
        CreateDate: '',
        ReferenceToken: 'OrdK4_-h3tTSbJHfr-4zmQ',
        Items: this.data?.popularRank?.Items?.map(item => ({
          ItemNumber: item?.ItemNumber?.toUpperCase(),
          SubcategoryId: item?.Subcategory.SubcategoryId,
          Qty: 1,
          Price: (item.UnitCost - item.InstantRebateAmount).toFixed(2)
        })),
      };

      jQuery.ajax({
        url:  `${document.location.origin}/tools/api/ADDNEWLISTWITHTEMP?CustomerNumber=${ CustomerNumber ? 'x' : '0' }&DiyListNumber=0`,
        cache: false,
        type: 'POST',
        data: currentData,
        dataType: 'json',
        success: function (response) {
          const jumpUrl = document.location.protocol + '//' + document.location.host + '/tools/custom-pc-builder/pl/ID-343';
          const loginUrl = document.location.protocol + '//' + __neweggState__.domains.SSL + `/login/signin?nextpage=${jumpUrl}`;
          if (response.ResultCode === 100000) {
            util?.setLocalStorage('rightbar', {date: Date.now(), value: JSON.stringify({status: true})});
            $('#popularRankLoading').hide();
            window.location.href = jumpUrl;
          } else if (response?.ResultCode === -2) {
            this.cacheTerminatedFunction('addNewWithTemp', { params: {CustomerNumber, DiyListNumber: 0}, currentData });
            window.location.href = loginUrl;
          } else {
            $('#popularRankLoading').hide();
          }
        }.bind(this),
        error: function (e) {
          $('#popularRankLoading').hide();
          console.log(e);
        }.bind(this),
      })
    },

    cacheTerminatedFunction: function (type, data) {
      const now = new Date();
      const futureTime = new Date(now.getTime() + 30 * 60 * 1000);
      const expirationTime = futureTime.getTime();
      sessionData = {
        type,
        data,
        pathname: window.location.pathname,
        expirationTime,
        userId: data?.params?.CustomerNumber,
      };
      util.setSessionStorage('REPLAY_STORAGE_KEY', {date: now.getTime(), value: JSON.stringify(sessionData)});
    },

    addStyle: function () {
      return `
      <style>
      /* also like pcb */
      .goods-list-pcb .black-pcb {
        padding: 15px;
      }
      .goods-list-pcb .black-pcb-con {
        flex-direction: column;
        margin-top: 15px;
      }
      .goods-list-pcb .black-pcb-title,
      .goods-list-pcb .black-pcb-link {
        padding-right: 0;
      }
      .goods-list-pcb .black-pcb-con .left {
        margin-right: 0;
        display: flex;
        justify-content: space-between;
        position: relative;
        margin-bottom: 60px;
      }
      .goods-list-pcb .black-pcb-save {
        position: absolute;
        right: 0;
        top: -55px;
        margin-top: 0;
        width: 80px;
        height: 80px;
      }
      .goods-list-pcb .black-pcb-con .right .black-pcb-items .black-pcb-item:nth-child(-n+2) {
        margin-bottom: 3px;
      }
      .goods-list-pcb .black-pcb-con .right .black-pcb-items .black-pcb-item {
        padding: 10px 2px;
        width: 45.5%;
      }
      .goods-list-pcb .black-pcb-con .right .black-pcb-items .black-pcb-item {
        margin-left: 3px;
      }
      .black-pcb-con .right .black-pcb-items .black-pcb-item:nth-child(5) {
        width: 38.6%;
      }
      .goods-list-pcb .black-pcb-con .right .black-pcb-items .black-pcb-item:nth-child(6) {
        bottom: calc(100% + 3px);
        width: 30%;
        right: 40%;
        padding: 10px 2px;
      }
      .goods-list-pcb .black-pcb-con .right .black-pcb-items .black-pcb-item:nth-child(7) {
        bottom: calc(100% + 3px);
        width: 38.4%;
        right: 0;
        padding: 3px 2px;
      }
      @media (max-width: 1699px) {
        .goods-list-pcb .black-pcb-save {
          top: -40px;
        }
      }
      @media (max-width: 1599px) {
        .goods-list-pcb .black-pcb-con .right .black-pcb-items .black-pcb-item:nth-child(6) {
          padding: 9px 2px;
        }
      }
      @media (max-width: 1399px) {
        .goods-list-pcb .black-pcb-con .right .black-pcb-items .black-pcb-item:nth-child(6) {
          padding: 12px 2px;
          width: 29.2%;
        }
        .goods-list-pcb .black-pcb-con .right .black-pcb-items .black-pcb-item:nth-child(7) {
          padding: 2px;
          width: 39%;
        }
        .goods-list-pcb .black-pcb-save {
          top: -46px;
        }
        .black-pcb-con .right .black-pcb-items .black-pcb-item:nth-child(5) {
          width: 39.2%;
        }
      }
      @media (max-width: 1299px) {
        .goods-list-pcb .black-pcb-con .right .black-pcb-items .black-pcb-item:nth-child(6) {
          padding: 11px 2px;
        }
      }
      @media (max-width: 1199px) {
        .goods-list-pcb .black-pcb-con .goods-price {
          position: relative;
          font-size: 12px;
        }
        .goods-list-pcb .black-pcb-con .right .black-pcb-items .black-pcb-item:nth-child(6) {
          padding: 8px 2px;
          width: 29%;
        }
        .goods-list-pcb .black-pcb-con .right .black-pcb-items .black-pcb-item:nth-child(7) {
          padding: 2px;
          width: 38%;
        }
        .black-pcb-con .right .black-pcb-items .black-pcb-item:nth-child(5) {
          width: 38%;
        }
        .goods-list-pcb .black-pcb-save {
          top: -40px;
        }
      }
      @media (max-width: 999px) {
        .goods-list-pcb .black-pcb-con .left {
          margin-bottom: 80px;
        }
        .goods-list-pcb .black-pcb-con .right .black-pcb-items .black-pcb-item:nth-child(6) {
          padding: 11px 2px;
        }
        .black-pcb-con .right .black-pcb-items .black-pcb-item:nth-child(5) {
          width: 38.8%;
        }
        .goods-list-pcb .black-pcb-con .right .black-pcb-items .black-pcb-item:nth-child(7) {
          width: 38.8%;
        }
      }
      @media (max-width: 899px) {
        .goods-list-pcb .black-pcb-con .right .black-pcb-items .black-pcb-item:nth-child(6) {
          padding: 10px 2px;
        }
      }
      </style>
      `;
    },
  };

  $(function () {
    try {

      $.cachedScript = function (url, options) {
        options = $.extend(options || {}, {
          dataType: 'script',
          cache: true,
          url: url,
        });
        return $.ajax(options);
      };
      PopularRank.prototype.getPopularRankList((popularRank) => {
        PopularRank.prototype.data.popularRank = popularRank
      });
      if(!!$('#Guess_You_Like').get(0)){
        new PopularRank({}).render();
        return;
      };
      const targetNode = document.getElementById('newHomePageContent');
      var observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList' && mutation.target.id == 'You_May_Also_Like') {
            if(Array.from(mutation.addedNodes).some(node => node.className === 'page-content-inner')){
              observer.disconnect();
              new PopularRank({}).render();
            }  
          }
        });
      });
      var config = { childList: true, subtree: true, attributes: true };
      observer.observe(targetNode, config);
    } catch (e) {
      console.error(e);
    }
  })
})()
