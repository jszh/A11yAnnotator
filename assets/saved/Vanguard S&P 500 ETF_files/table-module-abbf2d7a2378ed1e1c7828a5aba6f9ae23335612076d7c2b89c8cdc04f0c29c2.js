$(document).ready(function() {
  $('table.table-module2').bootstrapTable({
    formatShowingRows:    function() {},
    formatRecordsPerPage: function() {},
    paginationFirstText:  '&laquo; First',
    paginationLastText:   'Last &raquo;',
    paginationPreText:    '&lsaquo; Prev',
    paginationNextText:   'Next &rsaquo;',
    paginationHAlign:     'center',
    formatNoMatches:      function() { return this.emptyMsg; }
  });

  $('body').on('click', '.table-data-filter', function (e) {
    var data    = $(this).data();
    var table   = $(this).parents('.table-module').find('table');
    var options = table.bootstrapTable('getOptions');

    options.sortName  = data.field;
    options.sortOrder = data.order;

    if ($(this).parents('.table-module').find('.mobile-sort-container').length !== 0){
      $(".table-data-filter").removeClass("sort-active");
      $(this).addClass('sort-active');
      $('.mobile-sort-container .dropdown-toggle').html($(this).text() + '<span class="caret caret-right"></span>');
    }

    if (options.sideSort === 'server') {
      table.bootstrapTable('selectPage', 1);
    } else {
      table.bootstrapTable('load', table.bootstrapTable('getData'));
    }

    if (data.tab) {
      $("[href='"+ data.tab +"']").tab('show');
    }

    Mitre.Analytics.trackEvent('Table Sort', 'Button Click', $(e.target).text());
    Mitre.Analytics.trackPageview();
  });
});

$(document).on('click', 'ul.pagination > li > a', function (e) {
  Mitre.Analytics.trackEvent('Table Pagination', 'Click', $(e.target).text());
});

//Custom Sorters
function markupSorter(a, b) {
  // check if a or b is a string that begins with a html tag, if so
  // it probably is html markup so grab the text content inside
  if (/^<[a-z][\s\S]*>/i.test(a)) {
    a = $(a).text().toUpperCase();
  }

  if (/^<[a-z][\s\S]*>/i.test(b)) {
    b = $(b).text().toUpperCase();
  }

  if (a > b) return 1;
  if (a < b) return -1;
  return 0;
}

function numericSorter(a,b) {
  a = parseFloat(a.replace(/(<([^>]+)>)/ig, '').replace(/\$|%|,/g, ''));
  b = parseFloat(b.replace(/(<([^>]+)>)/ig, '').replace(/\$|%|,/g, ''));

  if (isNaN(a)) a = Number.NEGATIVE_INFINITY;
  if (isNaN(b)) b = Number.NEGATIVE_INFINITY;

  if (a > b) return 1;
  if (a < b) return -1;

  return 0;
}

function dateSorter(a, b) {
  a = Date.parse(a.replace(/(<([^>]+)>)/ig, '').replace(/\$|%|,/g, ''));
  b = Date.parse(b.replace(/(<([^>]+)>)/ig, '').replace(/\$|%|,/g, ''));

  if (isNaN(a)) a = Number.NEGATIVE_INFINITY;
  if (isNaN(b)) b = Number.NEGATIVE_INFINITY;

  if (a > b) return 1;
  if (a < b) return -1;
  return 0;
}

window.grades = {
  'A+': 9,
  'A':  8,
  'A-': 7,
  'B+': 6,
  'B':  5,
  'B-': 4,
  'C+': 3,
  'C':  2,
  'N/A':1,
  '':   0
};

function letterGradeSorter(a, b) {

  var letter_value_a = window.grades[a];
  var letter_value_b = window.grades[b];

  if (letter_value_a < letter_value_b) return 1;
  if (letter_value_a > letter_value_b) return -1;
  return 0;
}

function showEmptyMessage() {
  $('.table-module2 tr.no-records-found td').addClass('tab-table-show');
}

// Hide or Show table columns based on tabs <-> columns relationship
function initializeTabs() {
  var activeTabs = $('.table-tabs .nav-pills li.active a');

  $('.tab-table-show').removeClass('tab-table-show');
  activeTabs.each(function (index) {
    var thisRadioName;
    var href = $(this).attr('href').split('#')[1];

    if (href.indexOf('__') > 0) {
      thisRadioName = href.split('__')[1];
    } else {
      thisRadioName = href;
    }

    if(thisRadioName !== '' && thisRadioName !== undefined ){
      $("." + thisRadioName).addClass('tab-table-show');
    }
  });
  showEmptyMessage();
}

// Initialize table's tab if hash is provided
$(document).ready(function() {
  if (location.hash) {
    var hashInfo = extractHash();
    var tab      = hashInfo['table']
    if(!window.location.pathname.startsWith('/etf/')) {
      applyHash(hashInfo);
      return $("[href='"+ tab +"']").tab('show');
    }
  };
});

// Initialize table's tab when back/forword button is clicked
$(window).on('popstate', function() {
  if(location.hash) {
    return $("[href='"+ location.hash +"']").tab('show');
  }
});

// Show or hide tab columns after table data is ready & scroll to table
$('table').on('post-body.bs.table', function (e, name, order) {
  initializeTabs();

  var $el       = $(e.target);
  var hash      = location.hash;
  var tableHash = $el.data('hash');

  buildHash($el, null, null, null);

  if (hash.indexOf(tableHash) == 1) {
    var options = $('#' + tableHash).bootstrapTable('getOptions');
    var panel_body = $el.first().parents(".bootstrap-table").siblings(".panel-body");
    var scroll_to;
    if (panel_body.length > 0) {
      scroll_to = panel_body.offset().top - 125
    } else {
      scroll_to = $el.first().offset().top - 125
    }

    if (options.firstTimeRender === false && !options.doNotScroll) {
      $('html, body').animate({
        scrollTop: scroll_to
      }, 600);
    }
  }

  setTimeout(function(){ highlightColumn($el, null); }, 300);
});

$('table.table-module2').on('page-change.bs.table', function (e, number, size) {
  window.location.hash = buildHash($(e.target), null, null, number);
});

// Adjust current focus & Show or hide tab columns after tab is shown
$('.table-tabs .panel-body').on('shown.bs.tab', 'a[data-toggle="tab"]', function (e) {
  var yScroll = $(document).scrollTop();
  var table   = $(e.target).parent().parent().parent().parent().find('table.table-module2');
  var options = table.bootstrapTable('getOptions');

  options.currentTab = $(e.target).attr('href');

  location.hash =  buildHash(table, null, null, null);

  $(document).scrollTop(yScroll);

  initializeTabs();
});


$('table.table-module2').on('sort.bs.table', function (e, name, order) {
  var $el       = $(e.target);
  var tableHash = $el.attr('data-hash');

  removeHighlightColumn($el);
  location.hash = buildHash($el, name, order, null);

});

$('.table-module table').on('sort.bs.table', function (e, name, order) {
  Mitre.Analytics.trackEvent('Table Sort', 'Column Click', name);
  window._paq.push(['trackEvent', 'TableSort', e.target.id, name]);
});

function buildHash(table, sortName, sortOrder, page) {
  var hashStr    = '';
  var options    = table.bootstrapTable('getOptions');
  var pageNumber = options.pageNumber ? options.pageNumber : 1
  var currentSortName = options.sortName ? options.sortName : null

  sortName = sortName ? sortName : currentSortName

  if (sortName) {
    hashStr += '&sort_name=' + (sortName ? sortName : currentSortName);
    hashStr += '&sort_order=' + (sortOrder ? sortOrder : options.sortOrder);
  }

  hashStr += '&page=' + (page ? page : pageNumber);

  currentTab = options.currentTab;
  tableHash  = currentTab ? currentTab : '#' + table.attr('data-hash');

  var hash = tableHash  + hashStr;
  var url  = location.href.split('#')[0] + hash;

  table.trigger('hashchange.shareable.module', [url, hash]);

  return hash;
}

function extractHash() {
  var hashInfo = location.hash.split('&');

  var result = getQueryParameters(location.hash);

  result['table'] = hashInfo[0];

  return result
}

function getQueryParameters(str) {
  str = str || document.location.search;
  return str
           .replace(/(^\?)/,'')
           .split("&")
           .map(function(n) {
             return n = n.split("="), this[n[0]] = n[1], this
           }.bind({}))[0];
}

function applyHash(hashInfo) {
  var tableId = hashInfo['table'].split('__')[0]
  var table   = $(tableId)
  var options = table.bootstrapTable('getOptions')

  options.sortName  = hashInfo['sort_name'] || table.attr('data-sort-name');
  options.sortOrder = hashInfo['sort_order'] || table.attr('data-sort-order');

  $(tableId).bootstrapTable('selectPage', parseInt(hashInfo['page']));
}

function highlightColumn(table, columnName) {
  var highlightClass = 'highlight-column';
  var columnIndex = -1;
  var options = table.bootstrapTable('getOptions');
  var columns = options.columns;

  columnName = columnName ? columnName : options.sortName;

  for(var i = 0, len = columns.length; i < len; i++) {
    if (columns[i].field == columnName) {
      columnIndex = i + 1;
      break;
    }
  };

  table.find('th').removeClass(highlightClass);
  table.find('tr td').removeClass(highlightClass);
  table.find('th:nth-child(' + columnIndex + ')').addClass(highlightClass);
  table.find('tbody').find('tr td:nth-child(' + columnIndex + ')').addClass(highlightClass);
}

function removeHighlightColumn(table) {
  var highlightClass = 'highlight-column';

  table.find('th').removeClass(highlightClass);
  table.find('tr td').removeClass(highlightClass);
}
;
