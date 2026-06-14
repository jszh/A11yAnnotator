import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function HeroTaskSection() {
    return (
        <section className="bg-gov-blue-900 text-white relative py-16 lg:py-24 overflow-hidden">
            {/* Abstract Background Graphic */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
                <svg className="absolute right-0 top-0 h-full w-1/2" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <polygon fill="currentColor" points="50,0 100,0 100,100 0,100" />
                </svg>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="max-w-3xl">
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                        Access government services and information online.
                    </h1>
                    <p className="text-lg sm:text-xl text-gov-blue-100 mb-10 max-w-2xl leading-relaxed">
                        Find resources, apply for benefits, and connect with the services you need—securely and easily.
                    </p>

                    <div className="bg-white rounded-lg p-2 sm:p-3 flex flex-col sm:flex-row shadow-lg max-w-2xl transform transition hover:shadow-xl">
                        <input
                            type="text"
                            placeholder="What are you looking for today?"
                            className="flex-grow px-4 py-3 sm:py-0 text-gov-neutral-900 focus:outline-none focus:ring-2 focus:ring-gov-blue-500 rounded-md text-base sm:text-lg w-full"
                            aria-label="Search for services"
                        />
                        <button className="mt-2 sm:mt-0 sm:ml-2 bg-gov-blue-700 hover:bg-gov-blue-800 text-white px-8 py-3 rounded-md font-semibold transition-colors focus-ring flex items-center justify-center w-full sm:w-auto">
                            Search
                            <ArrowRight className="ml-2 w-5 h-5 hidden sm:inline" />
                        </button>
                    </div>

                    <div className="mt-8 flex flex-wrap gap-3">
                        <span className="text-sm font-medium text-gov-blue-200 py-1">Popular searches:</span>
                        <Link to="/services/benefits" className="text-sm bg-gov-blue-800/50 hover:bg-gov-blue-700 px-3 py-1 rounded-full transition-colors focus-ring">Unemployment</Link>
                        <Link to="/services/taxes" className="text-sm bg-gov-blue-800/50 hover:bg-gov-blue-700 px-3 py-1 rounded-full transition-colors focus-ring">Tax Filing</Link>
                        <Link to="/services/licenses" className="text-sm bg-gov-blue-800/50 hover:bg-gov-blue-700 px-3 py-1 rounded-full transition-colors focus-ring">Renew License</Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
