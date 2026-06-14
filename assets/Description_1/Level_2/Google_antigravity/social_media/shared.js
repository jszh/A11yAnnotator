const { useState, useEffect } = React;

// --- SVG Icons ---
const Icons = {
    Home: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>,
    Search: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>,
    Bell: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>,
    Mail: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>,
    User: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
    Settings: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>,
    PlusCircle: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M8 12h8" /><path d="M12 8v8" /></svg>,
    MoreHorizontal: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></svg>,
    Heart: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>,
    MessageCircle: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /></svg>,
    Repeat: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m17 2 4 4-4 4" /><path d="M3 11v-1a4 4 0 0 1 4-4h14" /><path d="m7 22-4-4 4-4" /><path d="M21 13v1a4 4 0 0 1-4 4H3" /></svg>,
    Bookmark: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" /></svg>,
    Share2: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" x2="15.42" y1="13.51" y2="17.49" /><line x1="15.41" x2="8.59" y1="6.51" y2="10.49" /></svg>,
    ImageIcon: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>,
    Smile: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" x2="9.01" y1="9" y2="9" /><line x1="15" x2="15.01" y1="9" y2="9" /></svg>,
    CheckCircle: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>,
    MoreVertical: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" /></svg>,
    TrendingUp: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></svg>
};

window.Icons = Icons;

// Shared Navigation Links Data
const navLinks = [
    { name: 'Home', icon: 'Home', href: 'index.html' },
    { name: 'Explore', icon: 'Search', href: 'explore.html' },
    { name: 'Notifications', icon: 'Bell', href: 'notifications.html', badge: 3 },
    { name: 'Messages', icon: 'Mail', href: 'messages.html', badge: 1 },
    { name: 'Profile', icon: 'User', href: 'profile.html' },
    { name: 'Settings', icon: 'Settings', href: 'settings.html' },
];

/**
 * Main Layout Shell
 */
function SocialLayout({ children, activePage }) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-neutral-100 font-sans selection:bg-indigo-500/30">
            <div className="max-w-7xl mx-auto flex h-screen overflow-hidden">

                {/* Desktop Sidebar (Left) */}
                <header className="hidden sm:flex flex-col w-20 xl:w-64 h-full border-r border-neutral-800/60 p-4 justify-between shrink-0">
                    <div className="flex flex-col gap-4">
                        <a href="index.html" className="flex items-center gap-3 xl:px-4 py-3 text-white hover:text-indigo-400 transition-colors w-fit rounded-full hover:bg-white/5" aria-label="Pulse Home">
                            <svg className="w-8 h-8 xl:w-9 xl:h-9 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                            </svg>
                            <span className="hidden xl:block text-2xl font-black tracking-tight font-display">Pulse</span>
                        </a>

                        <nav className="flex flex-col gap-1 mt-2" aria-label="Main Navigation">
                            {navLinks.map((link) => {
                                const isActive = activePage === link.name;
                                const Icon = Icons[link.icon];
                                return (
                                    <a
                                        key={link.name}
                                        href={link.href}
                                        className={`flex items-center gap-4 p-3 xl:px-4 xl:py-3 rounded-full transition-all duration-200 group w-fit xl:w-full
                      ${isActive ? 'font-bold text-white' : 'text-neutral-400 hover:bg-white/5 hover:text-white'}`}
                                        aria-current={isActive ? 'page' : undefined}
                                    >
                                        <div className="relative">
                                            <Icon className={`w-7 h-7 transition-all group-hover:scale-110 ${isActive ? 'text-white drop-shadow-md' : ''}`} />
                                            {link.badge && (
                                                <span className="absolute -top-1 -right-1 bg-indigo-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 border-[#0a0a0a]">
                                                    {link.badge}
                                                </span>
                                            )}
                                        </div>
                                        <span className={`hidden xl:block text-xl ${isActive ? 'font-bold' : 'font-medium'}`}>{link.name}</span>
                                    </a>
                                );
                            })}
                        </nav>

                        <button className="hidden xl:flex bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 px-6 rounded-full w-full justify-center mt-2 transition-colors shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)] active:scale-95 text-lg">
                            Post
                        </button>
                        <button className="xl:hidden bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-full mt-2 transition-colors flex justify-center w-fit active:scale-95" aria-label="Compose Post">
                            <Icons.PlusCircle className="w-6 h-6" />
                        </button>
                    </div>

                    <button className="flex items-center gap-3 p-3 lg:px-4 rounded-full hover:bg-white/5 transition-colors mt-auto w-fit xl:w-full group">
                        <img src="https://i.pravatar.cc/150?u=alex" alt="Alex's avatar" className="w-10 h-10 rounded-full bg-neutral-800 object-cover ring-2 ring-transparent group-hover:ring-neutral-700 transition-all" />
                        <div className="hidden xl:flex flex-col items-start leading-tight min-w-0">
                            <span className="font-bold text-[15px] truncate w-full text-left text-white">Alex Rivers</span>
                            <span className="text-neutral-500 text-sm truncate w-full text-left">@alexrivers</span>
                        </div>
                        <Icons.MoreHorizontal className="hidden xl:block ml-auto w-5 h-5 text-neutral-500 group-hover:text-white transition-colors" />
                    </button>
                </header>

                {/* Main Content Area */}
                <div className="flex-1 flex min-w-0 h-full">
                    <main className="flex-1 min-w-0 h-full overflow-y-auto no-scrollbar relative border-r border-neutral-800/60 pb-16 sm:pb-0">
                        {children}
                    </main>

                    {/* Global Right Sidebar (Trends/Suggestions) */}
                    {activePage !== 'Messages' && activePage !== 'Settings' && (
                        <aside className="hidden lg:block w-80 xl:w-96 p-6 h-full overflow-y-auto no-scrollbar shrink-0 space-y-6">
                            <div className="sticky top-0 bg-[#0a0a0a]/90 backdrop-blur-md pt-1 pb-4 z-10 w-full">
                                <div className="relative group">
                                    <Icons.Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-indigo-400 transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Search Pulse"
                                        className="w-full bg-neutral-900 border border-neutral-800 rounded-full py-3.5 pl-12 pr-4 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                                        aria-label="Search"
                                    />
                                </div>
                            </div>

                            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
                                <h2 className="font-extrabold text-xl p-4 border-b border-neutral-800/60">Trending now</h2>
                                <div className="divide-y divide-neutral-800/60">
                                    {[
                                        { tag: 'ClimateWeek', posts: '84K', prefix: '🔥 #', context: 'Trending Worldwide' },
                                        { tag: 'TechLayoffs', posts: '52.1K', prefix: '#', context: 'Technology · Trending' },
                                        { tag: 'WorldCup2026', posts: '120K', prefix: '⚽ #', context: 'Sports · Trending' },
                                        { tag: 'React19', posts: '12.4K', prefix: '#', context: 'Web Development' }
                                    ].map((trend, i) => (
                                        <a key={i} href="#" className="block p-4 hover:bg-white/[0.03] transition-colors">
                                            <p className="text-xs text-neutral-500 font-medium mb-0.5">{trend.context}</p>
                                            <p className="font-bold text-[15px] {trend.prefix.includes('🔥') ? 'text-white' : 'text-neutral-200'}">{trend.prefix}{trend.tag}</p>
                                            <p className="text-xs text-neutral-500 mt-1">{trend.posts} posts</p>
                                        </a>
                                    ))}
                                </div>
                                <a href="explore.html" className="block p-4 text-indigo-400 hover:text-indigo-300 hover:bg-white/[0.03] transition-colors text-[15px] font-medium">Show more</a>
                            </div>

                            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
                                <h2 className="font-extrabold text-xl p-4 border-b border-neutral-800/60">Who to follow</h2>
                                <div className="divide-y divide-neutral-800/60">
                                    {[
                                        { name: 'Sarah Drasner', handle: '@sarah_edo', img: '12' },
                                        { name: 'Kent C. Dodds', handle: '@kentcdodds', img: '11' },
                                        { name: 'Figma', handle: '@figma', img: '41' }
                                    ].map((u, i) => (
                                        <div key={i} className="flex items-center justify-between p-4 hover:bg-white/[0.03] transition-colors cursor-pointer">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <img src={`https://i.pravatar.cc/150?u=${u.img}`} alt={u.name} className="w-10 h-10 rounded-full object-cover" />
                                                <div className="flex flex-col min-w-0">
                                                    <span className="font-bold text-[15px] truncate hover:underline">{u.name}</span>
                                                    <span className="text-neutral-500 text-[15px] truncate">{u.handle}</span>
                                                </div>
                                            </div>
                                            <button className="bg-white text-neutral-900 hover:bg-neutral-200 font-bold py-1.5 px-4 rounded-full text-sm transition-colors ml-2 shrink-0">
                                                Follow
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <footer className="px-4 text-xs text-neutral-500 space-x-2 leading-relaxed pb-8">
                                <a href="#" className="hover:underline">Terms of Service</a>
                                <a href="#" className="hover:underline">Privacy Policy</a>
                                <a href="#" className="hover:underline">Cookie Policy</a>
                                <a href="#" className="hover:underline">Accessibility</a>
                                <br />
                                <span>© 2026 Pulse Mockup</span>
                            </footer>
                        </aside>
                    )}
                </div>

                {/* Mobile Default Bottom Nav */}
                <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-[#0a0a0a]/90 backdrop-blur-md border-t border-neutral-800 flex justify-around p-2 z-50 env-pb">
                    {navLinks.filter(l => ['Home', 'Explore', 'Notifications', 'Messages'].includes(l.name)).map(link => {
                        const isActive = activePage === link.name;
                        const Icon = Icons[link.icon];
                        return (
                            <a
                                key={link.name}
                                href={link.href}
                                className={`p-3 relative flex items-center justify-center rounded-xl transition-colors ${isActive ? 'text-white' : 'text-neutral-500'}`}
                                aria-label={link.name}
                                aria-current={isActive ? 'page' : undefined}
                            >
                                <Icon className={`w-6 h-6 ${isActive ? 'drop-shadow-md' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
                                {link.badge && (
                                    <span className="absolute top-2 right-2 bg-indigo-500 text-white text-[10px] font-bold w-3.5 h-3.5 flex items-center justify-center rounded-full border-2 border-[#0a0a0a]"></span>
                                )}
                            </a>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// Global Export
window.SocialLayout = SocialLayout;
