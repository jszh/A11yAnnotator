import { ArrowRight } from 'lucide-react';

function HeroEnterpriseSaaS() {
    return (
        <div className="bg-white py-20 border-b border-slate-200">
            <div className="container mx-auto px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="inline-block px-4 py-1.5 rounded-full bg-brand-50 text-brand-700 font-semibold text-sm mb-6 border border-brand-100">
                        EduPortal for Enterprise
                    </div>
                    <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6 tracking-tight">
                        Empower your workforce with targeted skill building
                    </h1>
                    <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
                        Transform your organization with world-class learning and development programs designed to close skill gaps and drive business impact.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-3.5 rounded-lg font-semibold transition-colors text-lg flex items-center justify-center gap-2">
                            Request Demo <ArrowRight className="w-5 h-5" />
                        </button>
                        <button className="bg-white border border-slate-300 hover:border-slate-400 text-slate-700 px-8 py-3.5 rounded-lg font-semibold transition-colors text-lg">
                            Explore Solutions
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default HeroEnterpriseSaaS;
