import { Link } from 'react-router-dom';
import { BookOpen, Search, User, Menu } from 'lucide-react';

function GlobalHeader() {
    return (
        <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                {/* Logo area */}
                <div className="flex items-center gap-6">
                    <Link to="/" className="flex items-center gap-2 text-brand-600 font-bold text-xl tracking-tight">
                        <BookOpen className="w-6 h-6" />
                        <span>EduPortal</span>
                    </Link>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex gap-6 items-center">
                        <Link to="/courses" className="text-sm font-medium text-slate-600 hover:text-slate-900">Explore</Link>
                        <Link to="/subjects" className="text-sm font-medium text-slate-600 hover:text-slate-900">Subjects</Link>
                        <Link to="/study" className="text-sm font-medium text-slate-600 hover:text-slate-900">Study Tools</Link>
                        <Link to="/plans" className="text-sm font-medium text-slate-600 hover:text-slate-900">Plans</Link>
                    </nav>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-4">
                    <div className="hidden lg:flex items-center bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200 focus-within:ring-2 focus-within:ring-brand-500 focus-within:border-transparent transition-all">
                        <Search className="w-4 h-4 text-slate-400 mr-2" />
                        <input type="text" placeholder="What do you want to learn?" className="bg-transparent text-sm border-none focus:outline-none w-48 text-slate-900 placeholder:text-slate-500" />
                    </div>

                    <Link to="/enterprise" className="hidden sm:block text-sm font-medium text-slate-600 hover:text-slate-900">Enterprise</Link>

                    <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block"></div>

                    <Link to="/account" className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-brand-600">
                        <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center border border-brand-200">
                            <User className="w-4 h-4" />
                        </div>
                        <span className="hidden sm:block">Sign In</span>
                    </Link>

                    <button className="md:hidden text-slate-500 hover:text-slate-900">
                        <Menu className="w-6 h-6" />
                    </button>
                </div>
            </div>
        </header>
    );
}

export default GlobalHeader;
