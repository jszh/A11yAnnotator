function HeroProductPlans() {
    return (
        <div className="bg-slate-900 text-white py-20 text-center">
            <div className="container mx-auto px-4 max-w-3xl">
                <h1 className="text-4xl md:text-5xl font-bold mb-6">Choose the right plan for your learning journey</h1>
                <p className="text-xl text-slate-400 mb-10">Whether you're learning for fun or advancing your career, we have a plan that fits your goals and budget.</p>

                {/* Toggle (Monthly/Yearly) placeholder */}
                <div className="inline-flex items-center p-1 bg-slate-800 rounded-lg">
                    <button className="px-6 py-2 rounded-md bg-brand-600 text-white font-medium shadow">Monthly</button>
                    <button className="px-6 py-2 rounded-md text-slate-400 hover:text-white font-medium transition-colors">Annually (Save 20%)</button>
                </div>
            </div>
        </div>
    );
}

export default HeroProductPlans;
