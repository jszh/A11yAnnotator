import { useState } from 'react';
import { ChevronDown, ChevronUp, Lock } from 'lucide-react';

export default function TrustBanner() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="bg-gov-neutral-100 text-gov-neutral-900 text-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="py-2 flex items-center justify-between lg:justify-start">
                    <div className="flex items-center space-x-2">
                        <svg
                            className="w-4 h-4 text-gov-neutral-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                        </svg>
                        <span className="font-semibold">An official website of the Government</span>
                    </div>
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="ml-4 flex items-center text-gov-blue-700 hover:text-gov-blue-800 hover:underline focus-ring"
                        aria-expanded={isOpen}
                        aria-controls="trust-banner-content"
                    >
                        Here's how you know
                        {isOpen ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
                    </button>
                </div>

                {isOpen && (
                    <div id="trust-banner-content" className="py-4 border-t border-gov-neutral-200 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex items-start">
                            <div className="flex-shrink-0 pt-1">
                                <svg className="w-8 h-8 text-gov-neutral-600" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="font-semibold mb-1">Official websites use .gov</p>
                                <p className="text-gov-neutral-600">
                                    A <strong>.gov</strong> website belongs to an official government organization in the United States.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start">
                            <div className="flex-shrink-0 pt-1">
                                <Lock className="w-8 h-8 text-gov-neutral-600" />
                            </div>
                            <div className="ml-4">
                                <p className="font-semibold mb-1">Secure .gov websites use HTTPS</p>
                                <p className="text-gov-neutral-600">
                                    A <strong>lock</strong> ( <Lock className="inline w-3 h-3" /> ) or <strong>https://</strong> means you've safely connected to the .gov website. Share sensitive information only on official, secure websites.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
