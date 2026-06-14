import { Link } from 'react-router-dom';

export default function FeatureBanner() {
    return (
        <section className="my-16 bg-gray-900 text-white overflow-hidden relative group cursor-pointer">
            <Link to="/article/special-report" className="block focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white rounded">
                <div className="absolute inset-0 opacity-40 group-hover:opacity-50 transition-opacity duration-500">
                    <img
                        src="https://images.unsplash.com/photo-1555848962-6e79363ec58f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80"
                        alt="Feature background"
                        className="w-full h-full object-cover grayscale"
                    />
                </div>
                <div className="relative container mx-auto px-4 py-16 md:py-24 z-10 text-center flex flex-col items-center">
                    <span className="text-brand-red font-bold uppercase tracking-widest text-sm mb-4 bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm border border-white/20">
                        Special Report
                    </span>
                    <h2 className="text-4xl md:text-5xl lg:text-7xl font-serif font-black mb-6 max-w-4xl tracking-tight leading-none group-hover:scale-[1.02] transition-transform duration-500">
                        The Next Frontier in Space Exploration
                    </h2>
                    <p className="text-lg md:text-xl font-serif text-gray-300 max-w-2xl mb-8">
                        A comprehensive investigation into the private companies and international agencies racing to establish a permanent human presence on Mars by 2035.
                    </p>
                    <div className="inline-flex items-center text-sm font-bold uppercase tracking-widest border-b-2 border-brand-red pb-1 group-hover:text-brand-red transition-colors">
                        Read The Full Investigation
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                    </div>
                </div>
            </Link>
        </section>
    );
}
