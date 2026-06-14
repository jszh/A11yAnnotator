function HeroLearningTool() {
    return (
        <div className="bg-brand-50 py-16 md:py-24">
            <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
                <div className="order-2 md:order-1">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-brand-100 transform -rotate-2 hover:rotate-0 transition-transform">
                            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center mb-4 text-xl font-bold">A</div>
                            <h3 className="font-bold text-slate-900">Flashcards</h3>
                            <p className="text-sm text-slate-500 mt-1">Master key terms</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-brand-100 transform translate-y-8 rotate-2 hover:rotate-0 transition-transform">
                            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4 text-xl font-bold">?</div>
                            <h3 className="font-bold text-slate-900">Practice tests</h3>
                            <p className="text-sm text-slate-500 mt-1">Test your knowledge</p>
                        </div>
                    </div>
                </div>
                <div className="order-1 md:order-2">
                    <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight">
                        Study smarter, not harder
                    </h2>
                    <p className="text-lg text-slate-600 mb-8">
                        Create your own study sets or choose from millions created by other students. Our science-backed learning tools help you remember more, faster.
                    </p>
                    <button className="bg-brand-600 hover:bg-brand-700 text-white px-8 py-3 rounded-xl font-bold text-lg shadow-lg shadow-brand-500/30 transition-all hover:-translate-y-1">
                        Get Started for Free
                    </button>
                </div>
            </div>
        </div>
    );
}

export default HeroLearningTool;
