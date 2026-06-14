import { Link, useLocation } from 'react-router-dom';
import { Menu, Search } from 'lucide-react';

const CATEGORIES = [
    { path: '/world', label: 'World' },
    { path: '/politics', label: 'Politics' },
    { path: '/business', label: 'Business' },
    { path: '/tech', label: 'Tech' },
    { path: '/culture', label: 'Culture' },
    { path: '/opinion', label: 'Opinion' },
    { path: '/video', label: 'Video' },
];

export default function CategoryNav() {
    const location = useLocation();

    return (
        <nav className="border-b-4 border-black sticky top-0 z-40 bg-white shadow-sm" aria-label="Main Navigation">
            <div className="container mx-auto flex items-center justify-between px-4 h-12">
                {/* Mobile menu button */}
                <button className="md:hidden p-2 -ml-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-red rounded" aria-label="Open Menu">
                    <Menu size={24} />
                </button>

                {/* Desktop category links */}
                <ul className="hidden md:flex items-center justify-center space-x-6 lg:space-x-8 flex-grow">
                    {CATEGORIES.map((category) => {
                        const isActive = location.pathname.startsWith(category.path);
                        return (
                            <li key={category.path}>
                                <Link
                                    to={category.path}
                                    className={`text-sm font-bold tracking-wide uppercase transition-colors px-1 py-3 block border-b-2
                    ${isActive
                                            ? 'text-black border-black border-opacity-100'
                                            : 'text-gray-600 border-transparent hover:text-black hover:border-black'}
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-red rounded-sm
                  `}
                                    aria-current={isActive ? 'page' : undefined}
                                >
                                    {category.label}
                                </Link>
                            </li>
                        );
                    })}
                </ul>

                {/* Search button */}
                <button className="p-2 -mr-2 text-gray-800 hover:text-brand-red transition-colors focus:outline-none focus:ring-2 focus:ring-brand-red rounded" aria-label="Search">
                    <Search size={20} />
                </button>
            </div>
        </nav>
    );
}
