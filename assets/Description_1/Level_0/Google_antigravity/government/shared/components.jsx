// --- Icons (using simple SVG for direct inline use without external icon libraries) ---
const SearchIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
);
const MenuIcon = ({ className = "w-6 h-6" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
);
const CloseIcon = ({ className = "w-6 h-6" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
);
const AlertTriangleIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
);
const PhoneIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
);
const BuildingIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
);
const LayoutGridIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
);
const ArrowRightIcon = ({ className = "w-4 h-4" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
);
const DocumentIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
);
const CreditCardIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
);
const ChevronDownIcon = ({ className = "w-4 h-4" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
);


// --- Shared Components ---

const EmergencyAlert = ({ title, message, active }) => {
    if (!active) return null;
    return (
        <div className="bg-orange-700 text-white font-sans text-sm py-3 px-4 shadow-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto flex items-start sm:items-center gap-3">
                <AlertTriangleIcon className="w-6 h-6 flex-shrink-0 text-orange-200 mt-0.5 sm:mt-0" />
                <div className="flex-1">
                    <span className="font-bold mr-2 uppercase tracking-wide">{title}:</span>
                    <span className="opacity-95">{message}</span>
                </div>
                <button className="text-white hover:text-orange-200 p-1 rounded transition-colors focus:ring-2 focus:ring-white">
                    <CloseIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

const Header = ({ currentPath = '/' }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

    const navLinks = [
        { label: 'Home', href: 'index.html' },
        { label: 'Services', href: 'services.html' },
        { label: 'About', href: 'about.html' },
        { label: 'Contact', href: 'contact.html' },
    ];

    return (
        <header className="bg-white border-b border-gov-neutral-200 font-sans shadow-soft sticky top-0 z-40 transition-all">
            {/* Top Utility Bar (Trust Banner style) */}
            <div className="bg-gov-blue-900 text-gov-blue-50 py-2 border-b border-gov-blue-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center text-xs sm:text-sm">
                    <div className="flex items-center gap-2">
                        <BuildingIcon className="w-4 h-4 text-gov-blue-300" />
                        <span>Official Portal of the City of Lakewood</span>
                    </div>
                    <div className="hidden sm:flex gap-6">
                        <a href="#" className="hover:text-white transition-colors flex items-center gap-1"><PhoneIcon className="w-3.5 h-3.5" /> 311 Support</a>
                        <a href="#" className="hover:text-white transition-colors">Pay Bills</a>
                        <div className="relative group">
                            <button className="flex items-center gap-1 hover:text-white transition-colors">
                                Translate <ChevronDownIcon />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Navigation Area */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-white">
                <div className="flex justify-between items-center h-20">
                    {/* Logo */}
                    <a href="index.html" className="flex items-center gap-3 group">
                        <div className="w-12 h-12 bg-gov-blue-700 rounded-full flex items-center justify-center text-white shadow-inner group-hover:bg-gov-blue-800 transition-colors">
                            <BuildingIcon className="w-6 h-6" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-serif text-2xl font-bold text-gov-blue-900 leading-tight">Lakewood</span>
                            <span className="text-gov-blue-600 text-sm font-medium tracking-wide uppercase">City Government</span>
                        </div>
                    </a>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-1 h-full">
                        {navLinks.map((link) => {
                            const isActive = currentPath.endsWith(link.href) || (currentPath === '/' && link.href === 'index.html');
                            return (
                                <a
                                    key={link.label}
                                    href={link.href}
                                    className={`px-4 py-2 font-medium rounded-md transition-all duration-200 ${isActive
                                            ? 'text-gov-blue-700 bg-gov-blue-50 ring-1 ring-inset ring-gov-blue-100'
                                            : 'text-gov-neutral-700 hover:text-gov-blue-700 hover:bg-gov-neutral-50'
                                        }`}
                                >
                                    {link.label}
                                </a>
                            );
                        })}
                        <div className="ml-4 pl-4 border-l border-gov-neutral-200 flex items-center">
                            <button className="text-gov-neutral-500 hover:text-gov-blue-700 p-2 rounded-full hover:bg-gov-neutral-50 transition-colors" aria-label="Search">
                                <SearchIcon />
                            </button>
                        </div>
                    </nav>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="text-gov-neutral-600 hover:text-gov-blue-700 p-2 rounded-md"
                        >
                            <MenuIcon />
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Nav Dropdown */}
            {isMobileMenuOpen && (
                <div className="md:hidden bg-white border-t border-gov-neutral-100 absolute w-full shadow-lg">
                    <div className="px-4 pt-2 pb-4 space-y-1">
                        {navLinks.map((link) => {
                            const isActive = currentPath.endsWith(link.href) || (currentPath === '/' && link.href === 'index.html');
                            return (
                                <a
                                    key={link.label}
                                    href={link.href}
                                    className={`block px-3 py-3 rounded-md text-base font-medium ${isActive
                                            ? 'text-gov-blue-700 bg-gov-blue-50'
                                            : 'text-gov-neutral-700 hover:text-gov-blue-700 hover:bg-gov-neutral-50'
                                        }`}
                                >
                                    {link.label}
                                </a>
                            );
                        })}
                        <div className="mt-4 pt-4 border-t border-gov-neutral-200">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <SearchIcon className="h-5 w-5 text-gov-neutral-400" />
                                </div>
                                <input
                                    type="text"
                                    className="block w-full pl-10 pr-3 py-2 border border-gov-neutral-300 rounded-md leading-5 bg-gov-neutral-50 placeholder-gov-neutral-500 focus:outline-none focus:placeholder-gov-neutral-400 focus:ring-1 focus:ring-gov-blue-500 focus:border-gov-blue-500 sm:text-sm"
                                    placeholder="Search lakewood.gov..."
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
};

const Footer = () => {
    return (
        <footer className="bg-gov-blue-900 border-t-4 border-gov-accent-500 text-gov-blue-200 font-sans mt-16 pb-8 pt-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 lg:gap-8 mb-12">
                    {/* Brand & Address */}
                    <div className="col-span-1 md:col-span-1">
                        <a href="index.html" className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gov-blue-900 shadow-md">
                                <BuildingIcon className="w-5 h-5" />
                            </div>
                            <span className="font-serif text-xl font-bold text-white tracking-wide">City of Lakewood</span>
                        </a>
                        <address className="not-italic text-sm text-gov-blue-300 space-y-2 mb-6 opacity-90">
                            <p>City Hall</p>
                            <p>4800 Lakewood Drive</p>
                            <p>Lakewood, OH 44107</p>
                            <p className="mt-4 font-medium text-white flex items-center gap-2">
                                <PhoneIcon className="w-4 h-4" /> General: (216) 555-0198
                            </p>
                        </address>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-white font-bold tracking-wider text-sm uppercase mb-4 mb-5 border-b border-gov-blue-800 pb-2">Government</h3>
                        <ul className="space-y-3 text-sm">
                            <li><a href="about.html" className="hover:text-white transition-colors relative group"><span className="absolute -left-3 opacity-0 group-hover:opacity-100 transition-opacity">›</span>Mayor & Council</a></li>
                            <li><a href="#" className="hover:text-white transition-colors relative group"><span className="absolute -left-3 opacity-0 group-hover:opacity-100 transition-opacity">›</span>City Departments</a></li>
                            <li><a href="#" className="hover:text-white transition-colors relative group"><span className="absolute -left-3 opacity-0 group-hover:opacity-100 transition-opacity">›</span>Agendas & Minutes</a></li>
                            <li><a href="#" className="hover:text-white transition-colors relative group"><span className="absolute -left-3 opacity-0 group-hover:opacity-100 transition-opacity">›</span>Municipal Code</a></li>
                            <li><a href="#" className="hover:text-white transition-colors relative group"><span className="absolute -left-3 opacity-0 group-hover:opacity-100 transition-opacity">›</span>Jobs & Careers</a></li>
                        </ul>
                    </div>

                    {/* Popular Services */}
                    <div>
                        <h3 className="text-white font-bold tracking-wider text-sm uppercase mb-4 mb-5 border-b border-gov-blue-800 pb-2">Services</h3>
                        <ul className="space-y-3 text-sm">
                            <li><a href="service-billing.html" className="hover:text-white transition-colors relative group"><span className="absolute -left-3 opacity-0 group-hover:opacity-100 transition-opacity">›</span>Pay Water Bill</a></li>
                            <li><a href="#" className="hover:text-white transition-colors relative group"><span className="absolute -left-3 opacity-0 group-hover:opacity-100 transition-opacity">›</span>Report an Issue (311)</a></li>
                            <li><a href="service-permits.html" className="hover:text-white transition-colors relative group"><span className="absolute -left-3 opacity-0 group-hover:opacity-100 transition-opacity">›</span>Building Permits</a></li>
                            <li><a href="#" className="hover:text-white transition-colors relative group"><span className="absolute -left-3 opacity-0 group-hover:opacity-100 transition-opacity">›</span>Trash & Recycling</a></li>
                            <li><a href="#" className="hover:text-white transition-colors relative group"><span className="absolute -left-3 opacity-0 group-hover:opacity-100 transition-opacity">›</span>Parks & Recreation</a></li>
                        </ul>
                    </div>

                    {/* Newsletter/Social */}
                    <div>
                        <h3 className="text-white font-bold tracking-wider text-sm uppercase mb-4 mb-5 border-b border-gov-blue-800 pb-2">Stay Connected</h3>
                        <p className="text-sm text-gov-blue-300 mb-4 opacity-90">Sign up for emergency alerts and weekly newsletters.</p>
                        <form className="mb-6 flex">
                            <input
                                type="email"
                                placeholder="Email address"
                                className="px-3 py-2 w-full text-sm rounded-l-md text-gov-neutral-900 border-none focus:ring-2 focus:ring-gov-blue-500 focus:outline-none"
                            />
                            <button type="submit" className="bg-gov-blue-600 hover:bg-gov-blue-500 text-white px-4 py-2 rounded-r-md text-sm font-medium transition-colors">
                                Subscribe
                            </button>
                        </form>
                        <div className="flex space-x-4">
                            {/* Social Icons Placeholder */}
                            <a href="#" className="text-gov-blue-400 hover:text-white transition-colors p-2 bg-gov-blue-800 rounded-full hover:bg-gov-blue-700">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" /></svg>
                            </a>
                            <a href="#" className="text-gov-blue-400 hover:text-white transition-colors p-2 bg-gov-blue-800 rounded-full hover:bg-gov-blue-700">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
                            </a>
                        </div>
                    </div>
                </div>

                <div className="pt-8 border-t border-gov-blue-800 flex flex-col md:flex-row justify-between items-center text-xs text-gov-blue-400 gap-4">
                    <p>&copy; {new Date().getFullYear()} City of Lakewood. All rights reserved.</p>
                    <div className="flex gap-4 sm:gap-6">
                        <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-white transition-colors">Accessibility Statement</a>
                        <a href="#" className="hover:text-white transition-colors">Terms of Use</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

// Expose components globally for our standalone React pages
window.SharedComponents = {
    Header,
    Footer,
    EmergencyAlert,
    Icons: {
        SearchIcon,
        MenuIcon,
        CloseIcon,
        AlertTriangleIcon,
        PhoneIcon,
        BuildingIcon,
        LayoutGridIcon,
        ArrowRightIcon,
        DocumentIcon,
        CreditCardIcon,
        ChevronDownIcon
    }
};
