import React from 'react';
import { Search } from 'lucide-react';

export default function RightSidebar() {
    return (
        <div className="flex flex-col gap-4">
            {/* Search Bar */}
            <div className="sticky top-0 bg-transparent py-1 z-10 backdrop-blur-md">
                <div className="group relative flex items-center">
                    <div className="pointer-events-none absolute left-4 flex items-center text-gray-500 group-focus-within:text-primary-500">
                        <Search className="h-5 w-5" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search"
                        className="w-full rounded-full border border-transparent bg-gray-100 dark:bg-gray-800 py-3 pl-12 pr-4 text-sm focus:border-primary-500 focus:bg-transparent focus:outline-none dark:text-white"
                    />
                </div>
            </div>

            {/* Trending Box */}
            <div className="rounded-2xl border border-border-light bg-gray-50 dark:border-border-dark dark:bg-panel-dark">
                <h2 className="px-4 py-3 text-xl font-bold">What's happening</h2>

                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="cursor-pointer px-4 py-3 hover:bg-gray-200/50 dark:hover:bg-gray-800/50 transition-colors">
                        <div className="flex items-center justify-between text-xs text-text-muted-light dark:text-text-muted-dark">
                            <span>Trending in Tech</span>
                        </div>
                        <p className="mt-0.5 font-bold">#ReactJS {i}</p>
                        <p className="text-xs text-text-muted-light dark:text-text-muted-dark">10.{i}K posts</p>
                    </div>
                ))}

                <button className="w-full rounded-b-2xl p-4 text-left text-[15px] font-medium text-primary-500 hover:bg-gray-200/50 dark:hover:bg-gray-800/50 transition-colors">
                    Show more
                </button>
            </div>

            {/* Who to follow */}
            <div className="rounded-2xl border border-border-light bg-gray-50 dark:border-border-dark dark:bg-panel-dark">
                <h2 className="px-4 py-3 text-xl font-bold">Who to follow</h2>

                {[1, 2].map((i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-200/50 dark:hover:bg-gray-800/50 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-purple-400 to-pink-500" />
                            <div className="flex flex-col text-[15px]">
                                <span className="font-bold leading-5 hover:underline">Cool Person {i}</span>
                                <span className="text-text-muted-light dark:text-text-muted-dark leading-5">@coolperson_{i}</span>
                            </div>
                        </div>
                        <button className="rounded-full bg-black px-4 py-1.5 font-bold text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 transition-colors">
                            Follow
                        </button>
                    </div>
                ))}

                <button className="w-full rounded-b-2xl p-4 text-left text-[15px] font-medium text-primary-500 hover:bg-gray-200/50 dark:hover:bg-gray-800/50 transition-colors">
                    Show more
                </button>
            </div>
        </div>
    );
}
