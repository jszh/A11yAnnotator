(function() {
  function showEsgContent(esgSubHeaders) {
    esgSubHeaders.each(function() {
      $(this).toggleClass('shade-title');
      $(this)
        .next('.hidden-list')
        .toggle()
        .addClass('shade');
      $(this)
        .next('.hidden-list')
        .find('.data-column-esg')
        .toggleClass('shade');
      $(this)
        .find('.fa')
        .toggle();
    });
  }

  function toggleEsgSubHeaders(esgSubHeader) {
    esgSubHeader.siblings('.click-show-hide').toggle();
    esgSubHeader.find('.fa').toggle();
  }

  $('.click-show-hide').on('click', function() {
    showEsgContent($(this));
  });

  $(document).ready(function() {
    var esgNavSelector = '.esg_theme_tab > a.theme-link';
    var firstListItem = $(
      '.esg-theme-content > div.collapse.in.esg-theme-list .data-table-esg:first'
    );
    showEsgContent(firstListItem);
    $(esgNavSelector).on('click', function(e) {
      e.preventDefault();

      var $link = $(this);
      var target = $(this).attr('href');

      $('.esg-theme-content > div.esg-theme-list').each(function(_, elem) {
        var $elem = $(elem);
        if ('#' + elem.id == target) {
          $elem.collapse('show');
          firstListItem = $elem.find('.data-table-esg:first');
          if (!firstListItem.hasClass('shade-title')) {
            showEsgContent(firstListItem);
          }
        } else {
          $elem.collapse('hide');
        }
      });

      $(esgNavSelector).removeClass('active');
      $link.addClass('active');
    });
  });
})();
