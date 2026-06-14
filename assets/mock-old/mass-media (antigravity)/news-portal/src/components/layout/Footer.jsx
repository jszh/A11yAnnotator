import { Link } from 'react-router-dom';

export default function Footer() {
    return (
        <footer className="bg-white border-t-4 border-gray-900 mt-16 pt-12 pb-8 font-sans">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 mb-12">
                    <div className="col-span-2 lg:col-span-2">
                        <h2 className="text-2xl font-serif font-black mb-4">THE DAILY BUGLE</h2>
                        <p className="text-gray-600 text-sm mb-6 max-w-xs">
                            Delivering independent, high-quality journalism to empower readers and hold power accountable.
                        </p>
                        <Link to="/subscribe" className="inline-block bg-brand-red text-white font-bold py-2 px-6 rounded hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600">
                            Subscribe Now
                        </Link>
                    </div>

                    <div>
                        <h3 className="font-bold uppercase text-xs tracking-wider mb-4 text-gray-900">Sections</h3>
                        <ul className="space-y-3 text-sm text-gray-600">
                            <li><Link to="/world" className="hover:text-brand-red">World</Link></li>
                            <li><Link to="/politics" className="hover:text-brand-red">Politics</Link></li>
                            <li><Link to="/business" className="hover:text-brand-red">Business</Link></li>
                            <li><Link to="/tech" className="hover:text-brand-red">Tech</Link></li>
                            <li><Link to="/science" className="hover:text-brand-red">Science</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-bold uppercase text-xs tracking-wider mb-4 text-gray-900">Opinion</h3>
                        <ul className="space-y-3 text-sm text-gray-600">
                            <li><Link to="/opinion/editorials" className="hover:text-brand-red">Editorials</Link></li>
                            <li><Link to="/opinion/columnists" className="hover:text-brand-red">Columnists</Link></li>
                            <li><Link to="/opinion/contributors" className="hover:text-brand-red">Contributors</Link></li>
                            <li><Link to="/opinion/letters" className="hover:text-brand-red">Letters</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-bold uppercase text-xs tracking-wider mb-4 text-gray-900">More</h3>
                        <ul className="space-y-3 text-sm text-gray-600">
                            <li><Link to="/video" className="hover:text-brand-red">Video</Link></li>
                            <li><Link to="/podcasts" className="hover:text-brand-red">Podcasts</Link></li>
                            <li><Link to="/newsletters" className="hover:text-brand-red">Newsletters</Link></li>
                            <li><Link to="/magazine" className="hover:text-brand-red">Magazine</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-bold uppercase text-xs tracking-wider mb-4 text-gray-900">About Us</h3>
                        <ul className="space-y-3 text-sm text-gray-600">
                            <li><Link to="/about" className="hover:text-brand-red">Our Company</Link></li>
                            <li><Link to="/careers" className="hover:text-brand-red">Careers</Link></li>
                            <li><Link to="/contact" className="hover:text-brand-red">Contact Us</Link></li>
                            <li><Link to="/help" className="hover:text-brand-red">Help Center</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500">
                    <div className="mb-4 md:mb-0">
                        &copy; {new Date().getFullYear()} The Daily Bugle Company. All rights reserved.
                    </div>
                    <div className="flex flex-wrap justify-center space-x-4">
                        <Link to="/privacy" className="hover:text-gray-900">Privacy Policy</Link>
                        <Link to="/terms" className="hover:text-gray-900">Terms of Service</Link>
                        <Link to="/cookie-policy" className="hover:text-gray-900">Cookie Policy</Link>
                        <Link to="/accessibility" className="hover:text-gray-900">Accessibility Statement</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
