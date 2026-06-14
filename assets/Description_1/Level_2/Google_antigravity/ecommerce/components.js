const { useState, useEffect, useRef } = React;

// --- UTILITIES ---

// Accessibility: Announce changes to screen readers (Cat 7)
function announceToScreenReader(message) {
  const announcer = document.getElementById('a11y-announcer');
  if (announcer) {
    announcer.textContent = message;
    // Clear after a moment so the same message can be announced again if needed
    setTimeout(() => {
      if (announcer.textContent === message) {
        announcer.textContent = '';
      }
    }, 1000);
  }
}

// Accessibility: Trap focus within a modal/drawer (Cat 5)
function useFocusTrap(ref, isActive) {
  useEffect(() => {
    if (!isActive || !ref.current) return;

    const focusableElementsString = 'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex="0"], [contenteditable]';
    const focusableElements = ref.current.querySelectorAll(focusableElementsString);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (firstElement) {
       firstElement.focus();
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) { /* shift + tab */
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else { /* tab */
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      } else if (e.key === 'Escape') {
        // Handle escape outside this hook usually, but good practice to have it here
      }
    };

    ref.current.addEventListener('keydown', handleKeyDown);

    return () => {
      if (ref.current) {
        ref.current.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [isActive, ref]);
}


// --- SHARED COMPONENTS ---

const A11yAnnouncer = () => (
  <div
    id="a11y-announcer"
    className="sr-only"
    aria-live="polite"
    aria-atomic="true"
  ></div>
);

const Header = ({ activePage = 'home' }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef(null);
  
  // Close menu on escape
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
        // Return focus to menu button
        document.getElementById('mobile-menu-btn')?.focus();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isMobileMenuOpen]);

  useFocusTrap(mobileMenuRef, isMobileMenuOpen);

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-200 shadow-sm" role="banner">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo & Primary Nav */}
          <div className="flex items-center gap-8">
            <a href="index.html" className="flex-shrink-0 flex items-center gap-2" aria-label="NovaMart Homepage">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl leading-none">N</span>
              </div>
              <span className="font-bold text-xl tracking-tight text-gray-900 hidden sm:block">NovaMart</span>
            </a>
            
            <nav className="hidden md:flex space-x-6" aria-label="Primary navigation">
              <a href="index.html" className={`text-base font-medium hover:text-blue-600 transition-colors ${activePage === 'home' ? 'text-blue-600' : 'text-gray-700'}`} aria-current={activePage === 'home' ? 'page' : undefined}>Home</a>
              <a href="products.html" className={`text-base font-medium hover:text-blue-600 transition-colors ${activePage === 'products' ? 'text-blue-600' : 'text-gray-700'}`} aria-current={activePage === 'products' ? 'page' : undefined}>Deals & Products</a>
              <a href="#" className="text-base font-medium text-gray-700 hover:text-blue-600 transition-colors">Categories</a>
            </nav>
          </div>

          {/* Search Bar - Cat 1, 2, 4 */}
          <div className="flex-1 max-w-lg mx-8 hidden lg:block">
            <form className="relative" onSubmit={(e) => { e.preventDefault(); announceToScreenReader("Search submitted"); }}>
              <label htmlFor="global-search" className="sr-only">Search products</label>
              <input
                id="global-search"
                type="search"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Search for electronics, apparel, and more..."
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <button type="submit" className="sr-only">Submit search</button>
            </form>
          </div>

          {/* Secondary Actions */}
          <div className="flex items-center gap-4">
            <a href="account.html" className={`p-2 rounded-full hover:bg-gray-100 transition-colors relative ${activePage === 'account' ? 'text-blue-600' : 'text-gray-600'}`} aria-label="User Account" aria-current={activePage === 'account' ? 'page' : undefined}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
            </a>
            <a href="cart.html" className={`p-2 rounded-full hover:bg-gray-100 transition-colors relative ${activePage === 'cart' ? 'text-blue-600' : 'text-gray-600'}`} aria-label="Shopping Cart, 2 items" aria-current={activePage === 'cart' ? 'page' : undefined}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
              <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full" aria-hidden="true">2</span>
            </a>
            
            {/* Mobile menu button */}
            <button 
              id="mobile-menu-btn"
              type="button" 
              className="md:hidden p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500" 
              aria-controls="mobile-menu" 
              aria-expanded={isMobileMenuOpen}
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay - Cat 5 Trap */}
      {isMobileMenuOpen && (
        <div className="md:hidden relative z-50">
          <div className="fixed inset-0 bg-gray-900/50 transition-opacity" aria-hidden="true" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="fixed inset-y-0 left-0 flex max-w-xs w-full">
             <div ref={mobileMenuRef} id="mobile-menu" className="w-full bg-white shadow-xl flex flex-col h-full overflow-y-auto" role="dialog" aria-modal="true" aria-label="Mobile navigation">
               <div className="px-4 py-6 border-b border-gray-200 flex items-center justify-between">
                 <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-xl leading-none">N</span>
                    </div>
                    <span className="font-bold text-xl tracking-tight text-gray-900">NovaMart</span>
                 </div>
                 <button 
                   type="button" 
                   className="p-2 rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                   aria-label="Close menu"
                   onClick={() => {
                     setIsMobileMenuOpen(false);
                     document.getElementById('mobile-menu-btn')?.focus();
                   }}
                 >
                   <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                   </svg>
                 </button>
               </div>
               <nav className="px-4 py-6 space-y-4" aria-label="Mobile primary navigation">
                 <a href="index.html" className={`block text-base font-medium ${activePage === 'home' ? 'text-blue-600' : 'text-gray-900'}`} aria-current={activePage === 'home' ? 'page' : undefined}>Home</a>
                 <a href="products.html" className={`block text-base font-medium ${activePage === 'products' ? 'text-blue-600' : 'text-gray-900'}`} aria-current={activePage === 'products' ? 'page' : undefined}>Deals & Products</a>
                 <a href="#" className="block text-base font-medium text-gray-900">Categories</a>
                 
                 <div className="pt-6 border-t border-gray-200">
                    <form className="relative" onSubmit={(e) => { e.preventDefault(); announceToScreenReader("Mobile search submitted"); }}>
                      <label htmlFor="mobile-search" className="sr-only">Search products</label>
                      <input
                        id="mobile-search"
                        type="search"
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Search..."
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <button type="submit" className="sr-only">Search</button>
                    </form>
                 </div>
               </nav>
             </div>
          </div>
        </div>
      )}
    </header>
  );
};

const Footer = () => (
  <footer className="bg-gray-900 border-t border-gray-800 pt-16 pb-8" role="contentinfo">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
        <div className="col-span-1 md:col-span-1">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl leading-none">N</span>
            </div>
            <span className="font-bold text-xl tracking-tight text-white">NovaMart</span>
          </div>
          <p className="text-gray-400 text-sm mb-6">
            Your one-stop destination for electronics, home goods, and apparel. Discover quality products at unbeatable prices.
          </p>
          <div className="flex space-x-4">
             {/* Social Links with visible focus indicators and accessible names */}
            <a href="#" className="text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-sm" aria-label="NovaMart on Twitter">
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"/></svg>
            </a>
            <a href="#" className="text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-sm" aria-label="NovaMart on Facebook">
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd"/></svg>
            </a>
          </div>
        </div>
        
        <div>
          <h2 className="text-white text-sm font-semibold uppercase tracking-wider mb-4 border-b border-gray-800 pb-2">Shop</h2>
          <ul className="space-y-3" aria-label="Footer Shop Navigation">
            <li><a href="#" className="text-gray-400 hover:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-sm">Electronics</a></li>
            <li><a href="#" className="text-gray-400 hover:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-sm">Home & Kitchen</a></li>
            <li><a href="#" className="text-gray-400 hover:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-sm">Apparel</a></li>
            <li><a href="#" className="text-gray-400 hover:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-sm">Sports & Outdoors</a></li>
          </ul>
        </div>

        <div>
           <h2 className="text-white text-sm font-semibold uppercase tracking-wider mb-4 border-b border-gray-800 pb-2">Account</h2>
           <ul className="space-y-3" aria-label="Footer Account Navigation">
            <li><a href="account.html" className="text-gray-400 hover:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-sm">My Account</a></li>
            <li><a href="#" className="text-gray-400 hover:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-sm">Order History</a></li>
            <li><a href="#" className="text-gray-400 hover:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-sm">Wishlist</a></li>
            <li><a href="#" className="text-gray-400 hover:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-sm">Track Order</a></li>
           </ul>
        </div>

        <div>
           <h2 className="text-white text-sm font-semibold uppercase tracking-wider mb-4 border-b border-gray-800 pb-2">Support</h2>
           <ul className="space-y-3" aria-label="Footer Support Navigation">
            <li><a href="#" className="text-gray-400 hover:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-sm">Help Center</a></li>
            <li><a href="#" className="text-gray-400 hover:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-sm">Returns & Refunds</a></li>
            <li><a href="#" className="text-gray-400 hover:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-sm">Shipping Info</a></li>
            <li><a href="#" className="text-gray-400 hover:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-sm">Contact Us</a></li>
           </ul>
        </div>
      </div>
      
      <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-gray-500 text-sm text-center md:text-left">
          &copy; {new Date().getFullYear()} NovaMart. All rights reserved.
        </p>
        <div className="flex gap-6">
          <a href="#" className="text-gray-500 hover:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-sm">Privacy Policy</a>
          <a href="#" className="text-gray-500 hover:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-sm">Terms of Service</a>
          <a href="#" className="text-gray-500 hover:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-sm">Accessibility Statement</a>
        </div>
      </div>
    </div>
  </footer>
);

// Standard Product Card (Reusable)
const ProductCard = ({ product }) => {
  return (
    <article className="bg-white rounded-xl shadow-sm hover:shadow-md border border-gray-100 transition-all duration-300 flex flex-col group overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
      <a href={`product-detail.html?id=${product.id}`} className="relative block aspect-[4/3] bg-gray-50 overflow-hidden outline-none" aria-label={`View details for ${product.name}`}>
        {product.discount > 0 && (
          <div className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded shadow-sm z-10">
            {product.discount}% OFF
          </div>
        )}
        {product.isNew && (
          <div className="absolute top-3 left-3 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded shadow-sm z-10">
            NEW
          </div>
        )}
        <img 
          src={product.image} 
          alt="" /* Null alt for decorative image when link text provides name */
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        {/* Quick add overlay */}
        <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity bg-gradient-to-t from-black/60 to-transparent">
          <button 
            type="button"
            className="w-full bg-white text-gray-900 font-semibold py-2 rounded shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
            aria-label={`Quick add ${product.name} to cart`}
            onClick={(e) => {
              e.preventDefault();
              announceToScreenReader(`Added ${product.name} to cart`);
            }}
          >
            Quick Add
          </button>
        </div>
      </a>
      
      <div className="p-4 flex flex-col flex-grow">
        <div className="text-xs text-gray-500 mb-1 font-medium">{product.brand}</div>
        <h3 className="text-sm font-medium text-gray-900 mb-1 line-clamp-2 leading-tight">
          <a href={`product-detail.html?id=${product.id}`} className="hover:text-blue-600 outline-none">
            {product.name}
          </a>
        </h3>
        
        <div className="flex items-center gap-1 mb-2 mt-auto" aria-label={`Rated ${product.rating} out of 5 stars by ${product.reviews} reviewers`}>
          <div className="flex text-yellow-400" aria-hidden="true">
            {[...Array(5)].map((_, i) => (
              <svg key={i} className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <span className="text-xs text-blue-600 hover:underline" aria-hidden="true">({product.reviews})</span>
        </div>
        
        <div className="flex items-end gap-2 mt-1">
          <span className="text-lg font-bold text-gray-900">${product.price.toFixed(2)}</span>
          {product.originalPrice && (
            <span className="text-sm text-gray-500 line-through mb-0.5">${product.originalPrice.toFixed(2)}</span>
          )}
        </div>
      </div>
    </article>
  );
};

// Make sure React correctly loads
window.NovaMart = {
  Header,
  Footer,
  A11yAnnouncer,
  ProductCard,
  announceToScreenReader,
  useFocusTrap
};
