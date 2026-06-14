import { Search, Menu, Globe, User } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Header() {
    return (
        <header className="bg-white border-b border-gov-neutral-200 sticky top-0 z-40 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-20">
                    {/* Logo / Brand */}
                    <div className="flex items-center">
                        <Link to="/" className="flex items-center gap-3 focus-ring p-1">
                            <div className="w-10 h-10 bg-gov-blue-700 rounded-full flex items-center justify-center text-white font-bold text-xl">
                                US
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gov-neutral-900 leading-tight">
                                    United States <br />
                                    <span className="text-sm font-normal text-gov-neutral-600 block">Department of Digital Services</span>
                                </h1>
                            </div>
                        </Link>
                    </div>

                    {/* Desktop Utilities */}
                    <div className="hidden md:flex items-center space-x-6">
                        <button className="flex items-center text-sm font-medium text-gov-neutral-700 hover:text-gov-blue-700 focus-ring py-2 px-3 rounded-md transition-colors">
                            <Globe className="w-4 h-4 mr-2" />
                            Español
                        </button>
                        <button className="flex items-center text-sm font-medium text-gov-neutral-700 hover:text-gov-blue-700 focus-ring py-2 px-3 rounded-md transition-colors">
                            <User className="w-4 h-4 mr-2" />
                            Sign in
                        </button>

                        {/* Search Bar */}
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search..."
                                className="w-48 lg:w-64 pl-4 pr-10 py-2 border border-gov-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gov-blue-500 focus:border-transparent text-sm"
                                aria-label="Search government portal"
                            />
                            <button
                                className="absolute right-0 top-0 h-full px-3 text-gov-neutral-500 hover:text-gov-blue-600 bg-transparent rounded-r-md focus-ring"
                                aria-label="Submit search"
                            >
                                <Search className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="flex items-center md:hidden">
                        <button
                            className="p-2 -mr-2 text-gov-neutral-600 hover:text-gov-neutral-900 focus-ring hover:bg-gov-neutral-100 rounded-md"
                            aria-label="Open main menu"
                            aria-expanded="false"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
}
