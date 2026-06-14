(function() {
  jQuery(function() {
    var applyDatepicker, bindChart, btnOptions, chartOption, computeNetFlow, currentRangeButtonText, dateTimeLabelFormats, formatNumber, fundFlowChartContainer, fundFlowData, updateNetFlow;
    bindChart = function(container, data, options, legendContainer) {
      var chart_data, chart_margin, main_div_classes, mobile_layout, sliceIntoThreeChunks, sortedData, transpose;
      if (data.length === 0) {
        container.hide();
        container.siblings("h4").hide();
        return;
      }
      sliceIntoThreeChunks = function(arr) {
        var chunk, chunkSize, chunkSizeTwo, res;
        res = [];
        chunkSize = Math.ceil(arr.length / 3);
        chunk = arr.slice(0, chunkSize);
        res.push(chunk);
        chunkSizeTwo = Math.ceil((arr.length - chunkSize) / 2);
        chunk = arr.slice(chunkSize, chunkSize + chunkSizeTwo);
        res.push(chunk);
        chunk = arr.slice(chunkSize + chunkSizeTwo, chunkSize + chunkSizeTwo + chunkSizeTwo);
        res.push(chunk);
        return res;
      };
      transpose = function(original) {
        var copy, i, j;
        copy = [];
        i = 0;
        while (i < original.length) {
          j = 0;
          while (j < original[i].length) {
            if (original[i][j] === void 0) {
              ++j;
              continue;
            }
            if (copy[j] === void 0) {
              copy[j] = [];
            }
            copy[j][i] = original[i][j];
            ++j;
          }
          ++i;
        }
        return copy;
      };
      sortedData = function(arr, main_div_classes) {
        var value, x;
        value = arr;
        if (!(typeof main_div_classes.includes === "function" ? main_div_classes.includes('col-lg-12') : void 0)) {
          x = sliceIntoThreeChunks(arr);
          value = transpose(x).flat();
        }
        return value;
      };
      mobile_layout = options["mobile_layout"] || $(window).width() < 768;
      main_div_classes = options["main_div_classes"] || 'col-lg-4 col-md-4 col-xs-6 col-sm-4 row-no-gutters';
      if (typeof main_div_classes.includes === "function" ? main_div_classes.includes('col-lg-12') : void 0) {
        chart_margin = [30, 0, 0, 0];
      } else {
        chart_margin = [0, 0, 0, 120];
      }
      options = $.extend({
        title: "",
        colors: ["#1A7BBC", "#00D7A9", "#14B0E6", "#3E4A3C", "#98EC86", "#008E7F", "#00BCC6", "#009DCE", "#47B74A", "#005F73", "#A2AF9F", "#00A46B"]
      }, options);
      chart_data = {
        title: {
          text: options["title"],
          align: 'left',
          verticalAlign: 'top'
        },
        plotArea: {
          shadow: null,
          borderWidth: null,
          backgroundColor: null
        },
        tooltip: {
          headerFormat: '',
          pointFormat: '<b>{series.name}:</b> {series.yData}%'
        },
        plotOptions: {
          bar: {
            stacking: 'percent'
          },
          series: {
            borderWidth: 0,
            pointPadding: 0,
            groupPadding: 0
          }
        },
        legend: {
          enabled: false
        },
        colors: options["colors"],
        credits: {
          enabled: false
        },
        xAxis: {
          visible: false
        },
        yAxis: {
          visible: false,
          maxPadding: 0,
          reversedStacks: false
        },
        chart: {
          height: 100,
          type: options["chart_type"],
          margin: chart_margin,
          spacing: [10, 0, 0, 0],
          events: {
            load: function() {
              var chart;
              chart = this;
              $(sortedData(chart.series, main_div_classes)).each(function(i, serie) {
                return $('<div class="' + main_div_classes + '"><div class="col-md-9 col-xs-9">' + serie.name + '</div><div class="col-md-1 col-xs-1"><span class="symbol" style="background-color:' + serie.color + '"></span></div><div class="col-md-2 col-xs-2">' + serie.yData + '%</div></div>').click(function() {
                  if (serie.visible) {
                    serie.hide();
                  } else {
                    serie.show();
                  }
                }).appendTo(legendContainer);
              });
              return;
            }
          }
        },
        series: data
      };
      container.highcharts(chart_data);
    };
    $('table.chart').each(function(x, element) {
      var legendPlaceholder, placeholder;
      placeholder = $(this).parent().find('.chart-placeholder');
      legendPlaceholder = $(this).parent().find('.chart-legend');
      bindChart(placeholder, $(element).data('chart-series'), {
        chart_type: $(element).data('chart-type'),
        mobile_layout: $(element).data('mobile-layout'),
        chart_width: $(element).data('chart-width'),
        main_div_classes: $(element).data('main-div-classes'),
        title: $(element).data('title')
      }, legendPlaceholder);
      return $(this).hide();
    });
    fundFlowChartContainer = $('#fund-flow-chart-container');
    fundFlowData = fundFlowChartContainer.data('series');
    computeNetFlow = function(series) {
      return series.reduce((function(acc, obj) {
        return acc + obj.y;
      }), 0);
    };
    formatNumber = function(flow) {
      if (Math.abs(flow) > 1) {
        return Highcharts.numberFormat(flow, 2) + ' B';
      } else {
        return Highcharts.numberFormat(flow * 1000, 2) + ' M';
      }
    };
    updateNetFlow = function(targetClass) {
      $.each($('#fund-flows-collapse .net-fund-flow'), function(i, element) {
        if ($(element).hasClass(targetClass)) {
          return $(element).show();
        } else {
          return $(element).hide();
        }
      });
    };
    applyDatepicker = function() {
      $('#fund-flows-collapse input.highcharts-range-selector').attr('data-provide', 'datepicker');
      $('#fund-flows-collapse input.highcharts-range-selector').attr('data-date-format', 'yyyy-mm-dd');
      $('#fund-flows-collapse input.highcharts-range-selector').attr('data-date-autoclose', true);
      $('#fund-flows-collapse input.highcharts-range-selector').attr('data-date-container', '#fund-flows-collapse');
    };
    currentRangeButtonText = '';
    btnOptions = ['5 Day', '1 Month', '3 Month', '6 Month', '1 Year', '3 Year', '5 Year', '10 Year'];
    dateTimeLabelFormats = {
      day: ['Date: %Y-%m-%d', 'Date:  %Y-%m-%d', 'Date: %Y-%m-%d'],
      week: ['Week from %A, %b %e, %Y', '%A, %b %e', '-%A, %b %e, %Y'],
      month: ['%B %Y', '%B', '-%B %Y']
    };
    chartOption = {
      chart: {
        alignTicks: false,
        events: {
          load: function() {
            var netFlow;
            netFlow = computeNetFlow(this.series[0].points);
            updateNetFlow('1-month');
          }
        }
      },
      tooltip: {
        borderColor: 'gray',
        split: false,
        headerFormat: '',
        dateTimeLabelFormats: dateTimeLabelFormats,
        pointFormatter: function() {
          if (Math.abs(this.y) > 1) {
            return 'Flow: ' + Highcharts.numberFormat(this.y, 2) + ' B <br>' + this.key;
          } else {
            return 'Flow: ' + Highcharts.numberFormat(this.y * 1000, 2) + ' M <br>' + this.key;
          }
        }
      },
      credits: {
        enabled: false
      },
      xAxis: {
        minRange: 60000 * 60 * 24,
        events: {
          afterSetExtremes: function() {
            var max, min, netFlow, newMin, oneDay, pointLenDiff;
            if (currentRangeButtonText === '5 Day') {
              min = this.min;
              max = this.max;
              oneDay = 1000 * 60 * 60 * 24;
              pointLenDiff = this.series[0].points.length - 5;
              if (pointLenDiff !== 0) {
                newMin = min + pointLenDiff * oneDay;
                this.setExtremes(newMin, max);
                updateNetFlow('5-day');
                currentRangeButtonText = '5 Day';
              }
            } else {
              netFlow = computeNetFlow(this.series[0].points);
              if (btnOptions.indexOf(currentRangeButtonText) === -1) {
                updateNetFlow('custom-range');
                $('#fund-flows-collapse .net-fund-flow.custom-range').html('<b>Custom Range Net Flows: </b>' + formatNumber(netFlow));
              }
            }
            currentRangeButtonText = null;
          }
        }
      },
      yAxis: {
        offset: 35,
        labels: {
          formatter: function() {
            return this.value + ' B';
          }
        }
      },
      exporting: {
        enabled: false
      },
      navigator: {
        enabled: false
      },
      scrollbar: {
        enabled: false
      },
      rangeSelector: {
        selected: 1,
        inputDateFormat: '%Y-%m-%d',
        inputEditDateFormat: '%Y-%m-%d',
        inputBoxWidth: 85,
        buttonTheme: {
          width: 23
        },
        buttons: [
          {
            type: 'day',
            count: 5,
            text: '5D',
            events: {
              click: function() {
                currentRangeButtonText = '5 Day';
                updateNetFlow('5-day');
              }
            }
          }, {
            type: 'month',
            count: 1,
            text: '1M',
            events: {
              click: function() {
                currentRangeButtonText = '1 Month';
                updateNetFlow('1-month');
              }
            }
          }, {
            type: 'month',
            count: 3,
            text: '3M',
            events: {
              click: function() {
                currentRangeButtonText = '3 Month';
                updateNetFlow('3-month');
              }
            }
          }, {
            type: 'month',
            count: 6,
            text: '6M',
            events: {
              click: function() {
                currentRangeButtonText = '6 Month';
                updateNetFlow('6-month');
              }
            }
          }, {
            type: 'year',
            count: 1,
            text: '1Y',
            events: {
              click: function() {
                currentRangeButtonText = '1 Year';
                updateNetFlow('1-year');
              }
            }
          }, {
            type: 'year',
            count: 3,
            text: '3Y',
            events: {
              click: function() {
                currentRangeButtonText = '3 Year';
                updateNetFlow('3-year');
              }
            }
          }, {
            type: 'year',
            count: 5,
            text: '5Y',
            events: {
              click: function() {
                currentRangeButtonText = '5 Year';
                updateNetFlow('5-year');
              }
            }
          }, {
            type: 'year',
            count: 10,
            text: '10Y',
            events: {
              click: function() {
                currentRangeButtonText = '10 Year';
                updateNetFlow('10-year');
              }
            }
          }
        ]
      },
      series: [
        {
          type: 'column',
          data: fundFlowData,
          zones: [
            {
              value: 0,
              color: '#ff0000'
            }, {
              color: '#008000'
            }
          ]
        }
      ],
      responsive: {
        rules: [
          {
            condition: {
              callback: function() {
                setTimeout((function() {
                  applyDatepicker();
                }), 0);
                return $(window).width() < 1200;
              }
            },
            chartOptions: {
              rangeSelector: {
                inputPosition: {
                  align: 'left',
                  x: 5
                }
              }
            }
          }
        ]
      }
    };
    Highcharts.setOptions({
      lang: {
        rangeSelectorZoom: '',
        thousandsSep: ','
      }
    });
    fundFlowChartContainer.highcharts('StockChart', chartOption, function() {
      setTimeout((function() {
        applyDatepicker();
      }), 0);
    });
    return;
    $(document).on('click', 'a[href="#holdings-collapse"]', function() {
      return setTimeout(function() {
        return $.each($('.chart-placeholder'), function(i, v) {
          return $(v).highcharts().reflow();
        });
      }, 100);
    });
    return $(document).on('shown.bs.tab', 'a[data-target="#holdings"]', function() {
      return setTimeout(function() {
        return window.dispatchEvent(new Event('resize'));
      }, 100);
    });
  });

}).call(this);
