(function () {
  var body = document.body;
  var prefix = body.getAttribute('data-prefix') || '.';
  var current = body.getAttribute('data-current') || 'home';

  function p(path) {
    return prefix === '.' ? path : prefix + '/' + path;
  }

  var header = document.getElementById('header-slot');
  var footer = document.getElementById('footer-slot');

  function active(key) {
    return current === key ? 'active' : '';
  }

  if (header) {
    header.innerHTML =
      '<header class="site-header">' +
      '  <div class="container header-row">' +
      '    <a href="' + p('index.html') + '" class="brand">' +
      '      <span class="logo-badge">MH</span>' +
      '      <span class="brand-copy"><small>Deliver to Seattle 98101</small><strong>MarketHub</strong></span>' +
      '    </a>' +
      '    <form class="search-wrap" action="' + p('products/products.html') + '">' +
      '      <select><option>All</option><option>Electronics</option><option>Fashion</option></select>' +
      '      <input type="search" placeholder="Search products, brands and more" />' +
      '      <button type="submit">🔍</button>' +
      '    </form>' +
      '    <div class="header-actions">' +
      '      <a class="header-link" href="javascript:void(0)"><span>Language</span><strong>EN</strong></a>' +
      '      <a class="header-link" href="' + p('about/about.html') + '"><span>Hello, Sign in</span><strong>Account</strong></a>' +
      '      <a class="header-link" href="' + p('products/products.html') + '"><span>Returns</span><strong>Orders</strong></a>' +
      '      <a class="cart-pill" href="' + p('products/detail.html') + '">🛒 Cart <span class="cart-count">3</span></a>' +
      '    </div>' +
      '  </div>' +
      '  <nav class="secondary-nav" aria-label="Main">' +
      '    <div class="container nav-row">' +
      '      <a class="nav-item ' + active('home') + '" href="' + p('index.html') + '">All</a>' +
      '      <a class="nav-item ' + active('products') + '" href="' + p('products/products.html') + '">Today\'s Deals</a>' +
      '      <a class="nav-item" href="' + p('contact/contact.html') + '">Customer Service</a>' +
      '      <a class="nav-item" href="' + p('products/products.html') + '">Best Sellers</a>' +
      '      <a class="nav-item" href="' + p('products/products.html') + '">New Releases</a>' +
      '      <a class="nav-item prime ' + active('about') + '" href="' + p('about/about.html') + '">Prime Membership</a>' +
      '      <a class="nav-item ' + active('contact') + '" href="' + p('contact/contact.html') + '">Gift Cards</a>' +
      '      <a class="nav-item" href="' + p('contact/contact.html') + '">Sell</a>' +
      '    </div>' +
      '  </nav>' +
      '</header>';
  }

  if (footer) {
    footer.innerHTML =
      '<footer class="site-footer">' +
      '  <div class="container footer-inner">' +
      '    <span>© 2026 MarketHub. All rights reserved.</span>' +
      '    <div class="footer-links">' +
      '      <a href="' + p('about/about.html') + '">About</a>' +
      '      <a href="' + p('products/products.html') + '">Products</a>' +
      '      <a href="' + p('products/detail.html') + '">Product Detail</a>' +
      '      <a href="' + p('contact/contact.html') + '">Contact</a>' +
      '    </div>' +
      '  </div>' +
      '</footer>';
  }
})();
