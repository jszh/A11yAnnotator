import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

export default function ServiceNav() {
    const [activeMenu, setActiveMenu] = useState(null);

    const navItems = [
        { name: 'Home', path: '/' },
        { name: 'Services', path: '/services', hasDropdown: true },
        { name: 'Benefits', path: '/services/benefits' },
        { name: 'Taxes', path: '/services/taxes' },
        { name: 'Licenses', path: '/services/licenses' },
        { name: 'About', path: '/about' },
        { name: 'Contact', path: '/contact' },
    ];

    return (
        <nav className="bg-gov-blue-800 text-white relative z-30" aria-label="Primary navigation">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <ul className="flex space-x-1 overflow-x-auto pb-1 md:pb-0">
                    {navItems.map((item) => (
                        <li key={item.name} className="flex-shrink-0">
                            {item.hasDropdown ? (
                                <button
                                    className="flex items-center px-4 py-3 text-sm font-medium hover:bg-gov-blue-700 focus-ring text-white transition-colors"
                                    aria-expanded={activeMenu === item.name}
                                    onClick={() => setActiveMenu(activeMenu === item.name ? null : item.name)}
                                >
                                    {item.name}
                                    <ChevronDown className={`ml-1 w-4 h-4 transition-transform ${activeMenu === item.name ? 'rotate-180' : ''}`} />
                                </button>
                            ) : (
                                <Link
                                    to={item.path}
                                    className="block px-4 py-3 text-sm font-medium hover:bg-gov-blue-700 focus-ring text-white transition-colors"
                                >
                                    {item.name}
                                </Link>
                            )}
                        </li>
                    ))}
                </ul>
            </div>

            {/* Mega Menu Dropdown */}
            {activeMenu === 'Services' && (
                <div className="absolute top-full left-0 w-full bg-gov-blue-50 border-t border-gov-blue-200 shadow-xl overflow-y-auto max-h-[80vh]">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div>
                                <h2 className="text-lg font-bold text-gov-blue-900 mb-4 border-b border-gov-blue-200 pb-2">Benefits & Assistance</h2>
                                <ul className="space-y-3">
                                    <li><Link to="/services/benefits" className="text-gov-blue-700 hover:text-gov-blue-900 hover:underline focus-ring px-1 block py-1">Healthcare Benefits</Link></li>
                                    <li><Link to="/services/benefits" className="text-gov-blue-700 hover:text-gov-blue-900 hover:underline focus-ring px-1 block py-1">Unemployment Help</Link></li>
                                    <li><Link to="/services/benefits" className="text-gov-blue-700 hover:text-gov-blue-900 hover:underline focus-ring px-1 block py-1">Housing Assistance</Link></li>
                                </ul>
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gov-blue-900 mb-4 border-b border-gov-blue-200 pb-2">Working & Taxes</h2>
                                <ul className="space-y-3">
                                    <li><Link to="/services/taxes" className="text-gov-blue-700 hover:text-gov-blue-900 hover:underline focus-ring px-1 block py-1">File Return</Link></li>
                                    <li><Link to="/services/taxes" className="text-gov-blue-700 hover:text-gov-blue-900 hover:underline focus-ring px-1 block py-1">Payment Plans</Link></li>
                                    <li><Link to="/services/licenses" className="text-gov-blue-700 hover:text-gov-blue-900 hover:underline focus-ring px-1 block py-1">Business Licenses</Link></li>
                                </ul>
                            </div>
                            <div className="bg-gov-blue-100 p-6 rounded-lg">
                                <h3 className="font-bold text-gov-blue-900 mb-2">Need Immediate Help?</h3>
                                <p className="text-gov-blue-800 text-sm mb-4">Find resources for disaster relief, emergencies, and crisis support.</p>
                                <Link to="/contact" className="inline-block bg-gov-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gov-blue-800 transition shadow-sm focus-ring">
                                    Find Support
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}
