const Header = () => {
    return (
        <header className="bg-navy text-white sticky top-0 z-50">
            <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                {/* Left: Logo + delivery location */}
                <div className="flex items-center space-x-4">
                    <a href="/index.html" className="text-2xl font-bold hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-cta rounded px-2 py-1" aria-label="E-Market Home">
                        E-Market
                    </a>
                    <div className="hidden lg:flex flex-col items-start hover:border-white border border-transparent p-1 rounded cursor-pointer focus-within:ring-2 focus-within:ring-cta" tabIndex="0" aria-label="Deliver to New York 10001">
                        <span className="text-xs text-gray-300 px-1">Deliver to</span>
                        <div className="flex items-center font-bold text-sm px-1">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                            New York 10001
                        </div>
                    </div>
                </div>

                {/* Center: Large search bar + category dropdown */}
                <div className="hidden md:flex flex-1 max-w-3xl mx-6">
                    <form className="flex w-full" role="search" aria-label="Site Search">
                        <select className="bg-gray-100 text-gray-700 text-sm rounded-l-md px-2 border-r border-gray-300 focus:outline-none focus:ring-2 focus:ring-cta cursor-pointer" aria-label="Search within category">
                            <option value="all">All Departments</option>
                            <option value="electronics">Electronics</option>
                            <option value="computers">Computers</option>
                            <option value="home">Home & Kitchen</option>
                        </select>
                        <input type="text" className="w-full px-4 py-2 text-black focus:outline-none focus:ring-2 focus:ring-cta border-none" placeholder="Search..." aria-label="Search query" />
                        <button type="submit" className="bg-cta hover:bg-cta-hover text-black px-4 py-2 rounded-r-md transition-colors focus:outline-none focus:ring-2 focus:ring-cta" aria-label="Submit search">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        </button>
                    </form>
                </div>

                {/* Right: Language selector, Account menu, Orders, Cart */}
                <nav className="flex items-center space-x-2 md:space-x-4">
                    <div className="hidden md:flex items-center hover:border-white border border-transparent p-2 rounded cursor-pointer focus-within:ring-2 focus-within:ring-cta" tabIndex="0" aria-label="Change language">
                        <span className="font-bold text-sm">EN</span>
                        <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
                    </div>

                    <a href="/account/account.html" className="hidden sm:flex flex-col items-start hover:border-white border border-transparent p-2 rounded focus:outline-none focus:ring-2 focus:ring-cta" aria-label="Sign in">
                        <span className="text-xs text-gray-300">Hello, sign in</span>
                        <div className="flex items-center font-bold text-sm">
                            Account & Lists
                            <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
                        </div>
                    </a>

                    <a href="/orders/orders.html" className="hidden lg:flex flex-col items-start hover:border-white border border-transparent p-2 rounded focus:outline-none focus:ring-2 focus:ring-cta" aria-label="Returns and Orders">
                        <span className="text-xs text-gray-300">Returns</span>
                        <span className="text-sm font-bold whitespace-nowrap">& Orders</span>
                    </a>

                    <a href="/cart/cart.html" className="flex items-end hover:border-white border border-transparent p-2 rounded focus:outline-none focus:ring-2 focus:ring-cta" aria-label="1 item in Shopping Cart">
                        <div className="relative flex items-center">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                            <span className="absolute -top-1 left-4 text-cta font-bold">1</span>
                            <span className="text-sm font-bold hidden md:inline ml-1 mb-1">Cart</span>
                        </div>
                    </a>
                </nav>
            </div>
        </header>
    );
};

window.Header = Header;
