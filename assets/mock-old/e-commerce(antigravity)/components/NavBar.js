const NavBar = () => {
    return (
        <div className="bg-[#232f3e] text-sm py-2 px-4 shadow-sm">
            <nav className="container mx-auto flex space-x-4 overflow-x-auto items-center" aria-label="Secondary Navigation">
                <button className="flex items-center font-bold text-white hover:text-cta focus:outline-none focus:ring-2 focus:ring-cta rounded px-1" aria-label="Open Menu">
                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                    All
                </button>
                <a href="/deals/deals.html" className="text-white hover:text-gray-300 whitespace-nowrap border border-transparent hover:border-white rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-cta">Today's Deals</a>
                <a href="/products/products.html" className="text-white hover:text-gray-300 whitespace-nowrap border border-transparent hover:border-white rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-cta">Customer Service</a>
                <a href="#" className="font-bold text-cta hover:text-white whitespace-nowrap border border-transparent hover:border-white rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-cta transition-colors">Prime Membership</a>
                <a href="/contact/contact.html" className="text-white hover:text-gray-300 whitespace-nowrap border border-transparent hover:border-white rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-cta">Registry</a>
                <a href="#" className="text-white hover:text-gray-300 whitespace-nowrap border border-transparent hover:border-white rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-cta">Gift Cards</a>
                <a href="#" className="text-white hover:text-gray-300 whitespace-nowrap border border-transparent hover:border-white rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-cta">Sell</a>
            </nav>
        </div>
    );
};

window.NavBar = NavBar;
