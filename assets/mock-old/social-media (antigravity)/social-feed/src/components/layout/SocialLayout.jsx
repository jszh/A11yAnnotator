import React from 'react';
import SidebarNav from './SidebarNav';
import RightSidebar from './RightSidebar';
import { Home, Search, Bell, Mail } from 'lucide-react';

export default function SocialLayout({ children }) {
    return (
        <div className="mx-auto flex w-full max-w-7xl justify-center">
            {/* Left Sidebar (Desktop & Tablet) */}
            <header className="sticky top-0 hidden h-screen w-[88px] xl:w-[275px] flex-col sm:flex">
                <SidebarNav />
            </header>

            {/* Main Content Area */}
            <main className="flex min-h-screen w-full max-w-[600px] flex-col border-x border-border-light dark:border-border-dark pb-16 sm:pb-0">
                {children}
            </main>

            {/* Right Sidebar (Desktop only) */}
            <aside className="sticky top-0 hidden h-screen w-[350px] flex-col px-6 py-1 lg:flex overflow-y-auto no-scrollbar">
                <RightSidebar />
            </aside>

            {/* Mobile Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-14 w-full items-center justify-around border-t border-border-light bg-panel-light/90 backdrop-blur-md dark:border-border-dark dark:bg-panel-dark/90 sm:hidden">
                <a href="#" className="flex h-full w-full items-center justify-center text-text-light dark:text-text-dark hover:bg-gray-200/50 dark:hover:bg-gray-800/50">
                    <Home className="h-6 w-6" />
                </a>
                <a href="#" className="flex h-full w-full items-center justify-center text-text-muted-light dark:text-text-muted-dark hover:bg-gray-200/50 dark:hover:bg-gray-800/50">
                    <Search className="h-6 w-6" />
                </a>
                <a href="#" className="flex h-full w-full items-center justify-center text-text-muted-light dark:text-text-muted-dark hover:bg-gray-200/50 dark:hover:bg-gray-800/50">
                    <Bell className="h-6 w-6" />
                </a>
                <a href="#" className="flex h-full w-full items-center justify-center text-text-muted-light dark:text-text-muted-dark hover:bg-gray-200/50 dark:hover:bg-gray-800/50">
                    <Mail className="h-6 w-6" />
                </a>
            </nav>
        </div>
    );
}
