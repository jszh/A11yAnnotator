const { useState, useEffect } = React;

// --- REUSABLE UI COMPONENTS ---
window.Button = ({ children, variant = "primary", className = "", ...props }) => {
    const baseClass = "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";
    const variants = {
        primary: "bg-primary-600 text-white hover:bg-primary-700 shadow-md hover:shadow-lg focus:ring-primary-500",
        secondary: "bg-white text-surface-700 border border-surface-200 hover:bg-surface-50 hover:border-surface-300 focus:ring-primary-500",
        accent: "bg-accent-500 text-white hover:bg-accent-600 shadow-md hover:shadow-lg focus:ring-accent-500",
        ghost: "text-surface-600 hover:text-primary-600 hover:bg-primary-50 focus:ring-primary-500",
    };
    return (
        <button className={`${baseClass} ${variants[variant]} ${className}`} {...props}>
            {children}
        </button>
    );
};

window.Badge = ({ children, color = "primary", className = "" }) => {
    const colors = {
        primary: "bg-primary-100 text-primary-800",
        success: "bg-emerald-100 text-emerald-800",
        warning: "bg-amber-100 text-amber-800",
        surface: "bg-surface-100 text-surface-800",
    };
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${colors[color]} ${className}`}>
            {children}
        </span>
    );
};

window.CourseCard = ({ title, instructor, rating, duration, level, price, image, students, badge }) => (
    <div className="group flex flex-col bg-white rounded-2xl border border-surface-200 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
        <div className="relative aspect-video overflow-hidden">
            <img src={image} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            {badge && (
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-surface-900 shadow-sm">
                    {badge}
                </div>
            )}
        </div>
        <div className="flex flex-col flex-grow p-5">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-primary-600 tracking-wider uppercase">{level}</span>
                <div className="flex items-center text-amber-500 text-sm font-semibold">
                    <i className="fas fa-star mr-1"></i>
                    {rating}
                    {students && <span className="text-surface-400 font-normal ml-1 text-xs">({students})</span>}
                </div>
            </div>
            <h3 className="font-display font-bold text-lg text-surface-900 mb-2 leading-tight line-clamp-2">
                <a href="course-detail.html" className="hover:text-primary-600 transition-colors">{title}</a>
            </h3>
            <p className="text-surface-500 text-sm mb-4 line-clamp-1">{instructor}</p>

            <div className="mt-auto flex items-center justify-between pt-4 border-t border-surface-100">
                <div className="flex items-center text-surface-500 text-sm">
                    <i className="far fa-clock mr-1.5"></i>
                    {duration}
                </div>
                <div className="font-bold text-surface-900 text-lg">
                    {price === 'Free' ? <span className="text-emerald-600">Free</span> : price}
                </div>
            </div>
        </div>
    </div>
);

// --- GLOBAL LAYOUT COMPONENTS ---
window.Header = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/95 backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-5'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
                <div className="flex items-center gap-8">
                    <a href="index.html" className="flex items-center gap-2 group">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white shadow-lg group-hover:shadow-primary-500/30 transition-shadow">
                            <i className="fas fa-layer-group text-xl"></i>
                        </div>
                        <span className={`font-display font-bold text-2xl tracking-tight ${isScrolled ? 'text-surface-900' : 'text-surface-900 lg:text-white'}`}>
                            LearnPath
                        </span>
                    </a>
                    <nav className="hidden md:flex gap-1 items-center bg-white/10 rounded-full px-2 py-1 backdrop-blur-md border border-white/20">
                        {['Explore Courses', 'Pricing', 'Business'].map(item => {
                            const href = item === 'Explore Courses' ? 'courses.html' : item === 'Pricing' ? 'pricing.html' : '#';
                            return (
                                <a key={item} href={href} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${isScrolled ? 'text-surface-600 hover:text-surface-900 hover:bg-surface-100' : 'text-surface-800 lg:text-white/90 lg:hover:text-white lg:hover:bg-white/20'}`}>
                                    {item}
                                </a>
                            );
                        })}
                    </nav>
                </div>

                <div className="hidden md:flex items-center gap-3">
                    <a href="dashboard.html" className={`text-sm font-medium transition-colors ${isScrolled ? 'text-surface-600 hover:text-surface-900' : 'text-surface-800 lg:text-white/90 lg:hover:text-white'} px-4 py-2`}>
                        Sign In
                    </a>
                    <Button variant={isScrolled ? 'primary' : 'secondary'} className="px-5 py-2.5 rounded-full text-sm font-bold">
                        Start Free Trial
                    </Button>
                </div>

                <button className={`md:hidden p-2 text-2xl ${isScrolled ? 'text-surface-900' : 'text-surface-900'}`} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                    <i className={`fas ${mobileMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
                </button>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden absolute top-full left-0 w-full bg-white shadow-lg border-t border-surface-100 animate-slide-up">
                    <div className="flex flex-col p-4 space-y-2">
                        <a href="courses.html" className="p-3 text-surface-900 font-medium rounded-lg hover:bg-surface-50">Explore Courses</a>
                        <a href="pricing.html" className="p-3 text-surface-900 font-medium rounded-lg hover:bg-surface-50">Pricing</a>
                        <a href="dashboard.html" className="p-3 text-surface-900 font-medium rounded-lg hover:bg-surface-50">Dashboard</a>
                        <hr className="my-2 border-surface-100" />
                        <Button className="w-full py-3">Start Free Trial</Button>
                    </div>
                </div>
            )}
        </header>
    );
};

window.Footer = () => (
    <footer className="bg-surface-900 text-surface-300 pt-16 pb-8 border-t border-surface-800 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
                <div className="lg:col-span-2">
                    <a href="index.html" className="flex items-center gap-2 mb-6">
                        <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center text-white">
                            <i className="fas fa-layer-group"></i>
                        </div>
                        <span className="font-display font-bold text-xl text-white tracking-tight">LearnPath</span>
                    </a>
                    <p className="text-surface-400 mb-6 max-w-sm leading-relaxed">
                        Empowering the world to learn at their own pace. Discover structured pathways in tech, business, and design.
                    </p>
                    <div className="flex gap-4">
                        {['twitter', 'linkedin', 'github', 'youtube'].map(network => (
                            <a key={network} href="#" className="w-10 h-10 rounded-full bg-surface-800 flex items-center justify-center text-surface-400 hover:bg-primary-500 hover:text-white transition-colors">
                                <i className={`fab fa-${network}`}></i>
                            </a>
                        ))}
                    </div>
                </div>

                <div>
                    <h4 className="text-white font-semibold mb-5 uppercase text-sm tracking-wider">Explore</h4>
                    <ul className="space-y-3">
                        {['Courses', 'Paths', 'Certificates', 'Instructors'].map(link => (
                            <li key={link}><a href="#" className="hover:text-primary-400 transition-colors">{link}</a></li>
                        ))}
                    </ul>
                </div>

                <div>
                    <h4 className="text-white font-semibold mb-5 uppercase text-sm tracking-wider">Company</h4>
                    <ul className="space-y-3">
                        {['About Us', 'Careers', 'Blog', 'Contact'].map(link => (
                            <li key={link}><a href="#" className="hover:text-primary-400 transition-colors">{link}</a></li>
                        ))}
                    </ul>
                </div>

                <div>
                    <h4 className="text-white font-semibold mb-5 uppercase text-sm tracking-wider">Legal</h4>
                    <ul className="space-y-3">
                        {['Terms', 'Privacy Policy', 'Cookie Settings'].map(link => (
                            <li key={link}><a href="#" className="hover:text-primary-400 transition-colors">{link}</a></li>
                        ))}
                    </ul>
                </div>
            </div>

            <div className="pt-8 border-t border-surface-800 flex flex-col md:flex-row items-center justify-between gap-4">
                <p className="text-sm text-surface-500">© 2026 LearnPath. All rights reserved.</p>
                <div className="flex items-center gap-2 text-sm text-surface-500">
                    <span>🇺🇸 English (US)</span>
                    <span className="mx-2">•</span>
                    <span>$ USD</span>
                </div>
            </div>
        </div>
    </footer>
);

// Global wrapper to inject Inter and Outfit fonts into the head if not present
const setupFonts = () => {
    if (!document.getElementById('google-fonts')) {
        const link = document.createElement('link');
        link.id = 'google-fonts';
        link.rel = 'stylesheet';
        link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@400;500;700;800&display=swap';
        document.head.appendChild(link);
    }
};
setupFonts();
