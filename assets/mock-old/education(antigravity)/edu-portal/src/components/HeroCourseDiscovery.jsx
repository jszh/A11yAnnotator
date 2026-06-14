function HeroCourseDiscovery() {
    return (
        <div className="bg-slate-900 text-white py-20 relative overflow-hidden">
            {/* Background Graphic placeholder */}
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-brand-600/20 to-transparent pointer-events-none"></div>

            <div className="container mx-auto px-4 relative z-10 grid md:grid-cols-2 gap-12 items-center">
                <div>
                    <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight leading-tight">
                        Learn without <span className="text-brand-400">limits</span>
                    </h1>
                    <p className="text-xl text-slate-300 mb-8 max-w-lg">
                        Start, switch, or advance your career with more than 5,000 courses, Professional Certificates, and degrees from world-class universities and companies.
                    </p>
                    <div className="flex flex-wrap gap-4">
                        <button className="bg-brand-500 hover:bg-brand-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
                            Explore Courses
                        </button>
                        <button className="bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-lg font-semibold transition-colors backdrop-blur-sm">
                            View Path
                        </button>
                    </div>
                </div>
                <div className="hidden md:block">
                    <div className="bg-slate-800 rounded-2xl aspect-video border border-slate-700 shadow-2xl flex items-center justify-center">
                        <span className="text-slate-500 font-medium">Platform Interface Preview</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default HeroCourseDiscovery;
