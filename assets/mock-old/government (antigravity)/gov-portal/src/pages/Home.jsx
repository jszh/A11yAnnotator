import HeroTaskSection from '../components/HeroTaskSection';
import QuickTaskGrid from '../components/QuickTaskGrid';
import AnnouncementModule from '../components/AnnouncementModule';

export default function Home() {
    return (
        <div>
            <HeroTaskSection />
            <QuickTaskGrid />
            <AnnouncementModule />

            {/* Information Section */}
            <section className="py-16 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="lg:flex lg:items-center lg:justify-between">
                        <div className="lg:w-1/2">
                            <h2 className="text-3xl font-bold text-gov-neutral-900 mb-6">Designed to help you find what you need.</h2>
                            <p className="text-lg text-gov-neutral-700 mb-6 leading-relaxed">
                                This portal serves as your primary gateway to government services. Whether you need to file taxes, apply for benefits, or renew a license, we've organized everything to be accessible, fast, and secure.
                            </p>
                            <ul className="space-y-4 text-gov-neutral-700">
                                <li className="flex items-start">
                                    <div className="flex-shrink-0 mt-1">
                                        <svg className="w-5 h-5 text-gov-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <p className="ml-3">Available 24/7 on any device</p>
                                </li>
                                <li className="flex items-start">
                                    <div className="flex-shrink-0 mt-1">
                                        <svg className="w-5 h-5 text-gov-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <p className="ml-3">Fully accessible and screen reader friendly</p>
                                </li>
                                <li className="flex items-start">
                                    <div className="flex-shrink-0 mt-1">
                                        <svg className="w-5 h-5 text-gov-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <p className="ml-3">Secure connection and privacy protected</p>
                                </li>
                            </ul>
                        </div>
                        <div className="mt-10 lg:mt-0 lg:w-5/12 ml-auto">
                            <div className="bg-gov-blue-50 p-8 rounded-lg border-2 border-gov-blue-100 flex flex-col items-center text-center">
                                <svg className="w-16 h-16 text-gov-blue-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                <h3 className="text-xl font-bold text-gov-blue-900 mb-2">Create an Account</h3>
                                <p className="text-gov-blue-800 mb-6">Track applications, view payment history, and manage your preferences in one secure place.</p>
                                <button className="w-full bg-gov-blue-700 hover:bg-gov-blue-800 text-white font-bold py-3 px-4 rounded focus-ring transition-colors">
                                    Sign In or Register
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
