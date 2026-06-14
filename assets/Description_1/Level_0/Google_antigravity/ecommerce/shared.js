const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-search"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
);

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);

const ShoppingBagIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shopping-bag"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
);

window.Header = function Header({ active = 'home' }) {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm backdrop-blur-md bg-white/90">
      <div className="bg-indigo-600 text-white px-4 py-2 text-sm text-center font-medium tracking-wide">
        Free shipping on all orders over $50. Shop now!
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex items-center">
            <a href="index.html" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-indigo-600/30 shadow-lg">N</div>
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-indigo-500 tracking-tight">NovaMart</span>
            </a>
          </div>

          {/* Nav */}
          <nav className="hidden md:flex space-x-8">
            <a href="index.html" className={`text-base font-semibold hover:text-indigo-600 transition-colors ${active === 'home' ? 'text-indigo-600' : 'text-gray-700'}`}>Home</a>
            <a href="products.html" className={`text-base font-semibold hover:text-indigo-600 transition-colors ${active === 'products' ? 'text-indigo-600' : 'text-gray-700'}`}>Shop All</a>
            <a href="products.html" className="text-base font-semibold text-gray-700 hover:text-indigo-600 transition-colors">Deals</a>
            <a href="products.html" className="text-base font-semibold text-gray-700 hover:text-indigo-600 transition-colors">Categories</a>
          </nav>

          {/* Search bar & Icons */}
          <div className="flex items-center space-x-6">
            <div className="hidden lg:flex relative">
              <input type="text" placeholder="Search for products..." className="w-64 pl-4 pr-10 py-2.5 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 bg-gray-50 text-sm transition-all" />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                <SearchIcon />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <a href="account.html" className={`text-gray-600 hover:text-indigo-600 transition-colors ${active === 'account' ? 'text-indigo-600' : ''}`}>
                <UserIcon />
              </a>
              <a href="cart.html" className={`text-gray-600 hover:text-indigo-600 transition-colors relative flex items-center ${active === 'cart' ? 'text-indigo-600' : ''}`}>
                <ShoppingBagIcon />
                <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-white">2</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

window.Footer = function Footer() {
  return (
    <footer className="bg-gray-900 border-t border-gray-800 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-4">
            <a href="index.html" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-indigo-500/20 shadow-lg">N</div>
              <span className="text-xl font-bold text-white tracking-tight">NovaMart</span>
            </a>
            <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
              Your one-stop destination for the latest electronics, trendiest fashion, and finest home goods. Elevating your shopping experience globally.
            </p>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-6 uppercase tracking-wider text-sm">Shop</h3>
            <ul className="space-y-3">
              <li><a href="products.html" className="text-sm hover:text-white transition-colors">All Products</a></li>
              <li><a href="#" className="text-sm hover:text-white transition-colors">Electronics</a></li>
              <li><a href="#" className="text-sm hover:text-white transition-colors">Apparel</a></li>
              <li><a href="#" className="text-sm hover:text-white transition-colors">Home & Kitchen</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-6 uppercase tracking-wider text-sm">Support</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-sm hover:text-white transition-colors">Contact Us</a></li>
              <li><a href="#" className="text-sm hover:text-white transition-colors">FAQs</a></li>
              <li><a href="#" className="text-sm hover:text-white transition-colors">Shipping & Returns</a></li>
              <li><a href="#" className="text-sm hover:text-white transition-colors">Order Tracking</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-6 uppercase tracking-wider text-sm">Stay in the loop</h3>
            <p className="text-sm text-gray-400 mb-4">Subscribe to our newsletter for access to exclusive drops and insider info.</p>
            <div className="flex">
              <input type="email" placeholder="Enter your email" className="px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-l-lg text-sm flex-1 focus:outline-none focus:border-indigo-500 text-white" />
              <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-r-lg text-sm font-medium transition-colors">
                Subscribe
              </button>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} NovaMart Inc. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-white">Privacy Policy</a>
            <a href="#" className="hover:text-white">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
