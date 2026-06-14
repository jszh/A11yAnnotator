import React from 'react';
import { Home, Search, Bell, Mail, Bookmark, User, Settings, MoreHorizontal, PenTool } from 'lucide-react';

const navItems = [
    { icon: Home, label: 'Home', href: '#' },
    { icon: Search, label: 'Explore', href: '#' },
    { icon: Bell, label: 'Notifications', href: '#' },
    { icon: Mail, label: 'Messages', href: '#' },
    { icon: Bookmark, label: 'Bookmarks', href: '#' },
    { icon: User, label: 'Profile', href: '#' },
];

export default function SidebarNav() {
    return (
        <>
            <div className="flex h-full w-full flex-col justify-between py-4 xl:items-start lg:items-center items-center">
                {/* Top section: Logo and Nav Links */}
                <div className="flex flex-col items-center xl:items-start w-full gap-2 xl:px-4">
                    <a
                        href="#"
                        className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-transparent hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                        aria-label="App Logo"
                    >
                        <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-primary-500 to-indigo-500" />
                    </a>

                    {navItems.map((item) => (
                        <a
                            key={item.label}
                            href={item.href}
                            className="flex items-center gap-4 rounded-full p-3 text-xl hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors w-fit xl:pr-6"
                        >
                            <item.icon className="h-7 w-7" />
                            <span className="hidden xl:inline font-medium">{item.label}</span>
                        </a>
                    ))}

                    <a
                        href="#"
                        className="flex items-center gap-4 rounded-full p-3 text-xl hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors w-fit xl:pr-6"
                    >
                        <Settings className="h-7 w-7" />
                        <span className="hidden xl:inline font-medium">Settings</span>
                    </a>

                    <button className="mt-4 flex h-14 w-14 xl:w-full items-center justify-center rounded-full bg-primary-500 text-white hover:bg-primary-600 transition-colors shadow-sm font-bold xl:px-4">
                        <span className="hidden xl:inline">Post</span>
                        <PenTool className="h-6 w-6 xl:hidden" />
                    </button>
                </div>

                {/* Bottom section: User Profile Miniature */}
                <button className="flex items-center gap-3 rounded-full p-3 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors xl:w-full xl:justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500" />
                        <div className="hidden xl:flex flex-col items-start text-sm">
                            <span className="font-bold leading-5">John Doe</span>
                            <span className="text-text-muted-light dark:text-text-muted-dark leading-5">@johndoe</span>
                        </div>
                    </div>
                    <MoreHorizontal className="hidden xl:block h-5 w-5 text-gray-500" />
                </button>
            </div>
        </>
    );
}
