import React, { useState } from 'react';

export default function TopHeader() {
    const [activeTab, setActiveTab] = useState('for-you');

    return (
        <div className="sticky top-0 z-40 flex flex-col border-b border-border-light bg-panel-light/90 backdrop-blur-md dark:border-border-dark dark:bg-panel-dark/90">
            <div className="px-4 py-3 sm:hidden">
                <h1 className="text-xl font-bold">Home</h1>
            </div>

            <div className="flex w-full cursor-pointer">
                <button
                    onClick={() => setActiveTab('for-you')}
                    className="relative flex flex-1 items-center justify-center p-4 transition-colors hover:bg-gray-200/50 dark:hover:bg-gray-800/50"
                >
                    <span className={`font-semibold ${activeTab === 'for-you' ? 'text-gray-900 dark:text-white' : 'text-text-muted-light dark:text-text-muted-dark font-medium'}`}>
                        For you
                    </span>
                    {activeTab === 'for-you' && (
                        <div className="absolute bottom-0 h-1 w-16 rounded-full bg-primary-500" />
                    )}
                </button>

                <button
                    onClick={() => setActiveTab('following')}
                    className="relative flex flex-1 items-center justify-center p-4 transition-colors hover:bg-gray-200/50 dark:hover:bg-gray-800/50"
                >
                    <span className={`font-semibold ${activeTab === 'following' ? 'text-gray-900 dark:text-white' : 'text-text-muted-light dark:text-text-muted-dark font-medium'}`}>
                        Following
                    </span>
                    {activeTab === 'following' && (
                        <div className="absolute bottom-0 h-1 w-20 rounded-full bg-primary-500" />
                    )}
                </button>
            </div>
        </div>
    );
}
