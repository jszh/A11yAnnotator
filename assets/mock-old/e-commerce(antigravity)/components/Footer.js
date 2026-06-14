const Footer = () => {
    return (
        <footer className="bg-navy text-white mt-12 border-t border-gray-700">
            {/* Back to top */}
            <a href="#top" className="block w-full bg-[#232f3e] hover:bg-gray-700 text-center py-4 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-cta focus:ring-inset" aria-label="Back to top">
                Back to top
            </a>

            {/* Footer Links */}
            <div className="container mx-auto px-4 py-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
                    <div>
                        <h3 className="font-bold text-lg mb-4">Get to Know Us</h3>
                        <ul className="space-y-2 text-sm text-gray-300">
                            <li><a href="/about/about.html" className="hover:underline focus:outline-none focus:ring-2 focus:ring-cta rounded p-1">Careers</a></li>
                            <li><a href="/about/about.html" className="hover:underline focus:outline-none focus:ring-2 focus:ring-cta rounded p-1">Blog</a></li>
                            <li><a href="/about/about.html" className="hover:underline focus:outline-none focus:ring-2 focus:ring-cta rounded p-1">About E-Market</a></li>
                            <li><a href="/contact/contact.html" className="hover:underline focus:outline-none focus:ring-2 focus:ring-cta rounded p-1">Investor Relations</a></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-bold text-lg mb-4">Make Money with Us</h3>
                        <ul className="space-y-2 text-sm text-gray-300">
                            <li><a href="#" className="hover:underline focus:outline-none focus:ring-2 focus:ring-cta rounded p-1">Sell products on E-Market</a></li>
                            <li><a href="#" className="hover:underline focus:outline-none focus:ring-2 focus:ring-cta rounded p-1">Sell on E-Market Business</a></li>
                            <li><a href="#" className="hover:underline focus:outline-none focus:ring-2 focus:ring-cta rounded p-1">Become an Affiliate</a></li>
                            <li><a href="#" className="hover:underline focus:outline-none focus:ring-2 focus:ring-cta rounded p-1">Advertise Your Products</a></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-bold text-lg mb-4">Payment Products</h3>
                        <ul className="space-y-2 text-sm text-gray-300">
                            <li><a href="#" className="hover:underline focus:outline-none focus:ring-2 focus:ring-cta rounded p-1">E-Market Business Card</a></li>
                            <li><a href="#" className="hover:underline focus:outline-none focus:ring-2 focus:ring-cta rounded p-1">Shop with Points</a></li>
                            <li><a href="#" className="hover:underline focus:outline-none focus:ring-2 focus:ring-cta rounded p-1">Reload Your Balance</a></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-bold text-lg mb-4">Let Us Help You</h3>
                        <ul className="space-y-2 text-sm text-gray-300">
                            <li><a href="/account/account.html" className="hover:underline focus:outline-none focus:ring-2 focus:ring-cta rounded p-1">Your Account</a></li>
                            <li><a href="/orders/orders.html" className="hover:underline focus:outline-none focus:ring-2 focus:ring-cta rounded p-1">Your Orders</a></li>
                            <li><a href="/contact/contact.html" className="hover:underline focus:outline-none focus:ring-2 focus:ring-cta rounded p-1">Shipping Rates & Policies</a></li>
                            <li><a href="/contact/contact.html" className="hover:underline focus:outline-none focus:ring-2 focus:ring-cta rounded p-1">Returns & Replacements</a></li>
                            <li><a href="/contact/contact.html" className="hover:underline focus:outline-none focus:ring-2 focus:ring-cta rounded p-1">Help</a></li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Bottom Legal */}
            <div className="bg-[#131a22] py-6 text-center text-xs text-gray-400">
                <p className="mb-2 space-x-4">
                    <a href="#" className="hover:underline focus:outline-none focus:ring-1 focus:ring-cta p-1 rounded">Conditions of Use</a>
                    <a href="#" className="hover:underline focus:outline-none focus:ring-1 focus:ring-cta p-1 rounded">Privacy Notice</a>
                    <a href="#" className="hover:underline focus:outline-none focus:ring-1 focus:ring-cta p-1 rounded">Your Ads Privacy Choices</a>
                </p>
                <p>&copy; 2026 E-Market, Inc. or its affiliates</p>
            </div>
        </footer>
    );
};

window.Footer = Footer;
