import { Link } from 'react-router-dom';
import { Search, User, Menu } from 'lucide-react';

export default function GlobalUtilityBar() {
    return (
        <div className="bg-gray-900 text-white text-xs py-1.5 px-4 font-sans tracking-wide">
            <div className="container mx-auto flex justify-between items-center">
                <div className="flex items-center space-x-6">
                    <span className="hidden sm:inline font-bold">EDITION: U.S.</span>
                    <div className="hidden md:flex space-x-4">
                        <Link to="/world" className="hover:text-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-white rounded px-1">International</Link>
                        <Link to="/politics" className="hover:text-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-white rounded px-1">Politics</Link>
                    </div>
                </div>

                <div className="flex items-center space-x-4">
                    <Link to="/subscribe" className="text-yellow-400 font-bold hover:text-yellow-300 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-yellow-400 rounded px-1">
                        SUBSCRIBE FOR $1/MO
                    </Link>
                    <Link to="/account" className="flex items-center hover:text-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-white rounded px-1">
                        <User size={14} className="mr-1" />
                        <span className="hidden sm:inline">Log In</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
