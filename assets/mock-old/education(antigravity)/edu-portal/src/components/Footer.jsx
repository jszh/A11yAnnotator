import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';

function Footer() {
    return (
        <footer className="bg-slate-900 text-slate-300 py-12 border-t border-slate-800">
            <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="col-span-1 md:col-span-1">
                    <Link to="/" className="flex items-center gap-2 text-white font-bold text-xl tracking-tight mb-4">
                        <BookOpen className="w-6 h-6 text-brand-500" />
                        <span>EduPortal</span>
                    </Link>
                    <p className="text-sm text-slate-400">
                        Empowering lifelong learners with world-class education tools and resources.
                    </p>
                </div>

                <div>
                    <h4 className="text-white font-semibold mb-4">Learn</h4>
                    <ul className="space-y-2 text-sm">
                        <li><Link to="/courses" className="hover:text-white transition-colors">All Courses</Link></li>
                        <li><Link to="/subjects" className="hover:text-white transition-colors">Subjects</Link></li>
                        <li><Link to="/curriculum" className="hover:text-white transition-colors">Curriculum Info</Link></li>
                        <li><Link to="/study" className="hover:text-white transition-colors">Study Tools</Link></li>
                    </ul>
                </div>

                <div>
                    <h4 className="text-white font-semibold mb-4">Solutions</h4>
                    <ul className="space-y-2 text-sm">
                        <li><Link to="/enterprise" className="hover:text-white transition-colors">EduPortal for Business</Link></li>
                        <li><Link to="/enterprise" className="hover:text-white transition-colors">EduPortal for Schools</Link></li>
                        <li><Link to="/plans" className="hover:text-white transition-colors">Pricing & Plans</Link></li>
                    </ul>
                </div>

                <div>
                    <h4 className="text-white font-semibold mb-4">Support</h4>
                    <ul className="space-y-2 text-sm">
                        <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                        <li><Link to="/account" className="hover:text-white transition-colors">Account Settings</Link></li>
                        <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                        <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                    </ul>
                </div>
            </div>
            <div className="container mx-auto px-4 mt-12 pt-8 border-t border-slate-800 text-sm text-center md:text-left flex flex-col md:flex-row justify-between items-center text-slate-500">
                <p>&copy; {new Date().getFullYear()} EduPortal Mockup. All rights reserved.</p>
                <div className="flex gap-4 mt-4 md:mt-0">
                    {/* Social icons placeholders */}
                    <div className="w-6 h-6 rounded-full bg-slate-800 hover:bg-slate-700 transition"></div>
                    <div className="w-6 h-6 rounded-full bg-slate-800 hover:bg-slate-700 transition"></div>
                    <div className="w-6 h-6 rounded-full bg-slate-800 hover:bg-slate-700 transition"></div>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
