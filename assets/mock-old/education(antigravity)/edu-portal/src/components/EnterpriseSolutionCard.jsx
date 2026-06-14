import { ArrowRight } from 'lucide-react';

function EnterpriseSolutionCard({ title, description, imageColorClass, linkText }) {
    return (
        <div className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className={`h-48 w-full ${imageColorClass} flex items-center justify-center`}>
                <span className="text-white/80 font-medium tracking-widest uppercase text-sm">Solution Feature</span>
            </div>
            <div className="p-8">
                <h3 className="text-2xl font-bold text-slate-900 mb-4">{title}</h3>
                <p className="text-slate-600 mb-6 leading-relaxed">
                    {description}
                </p>
                <button className="text-brand-600 font-medium flex items-center gap-2 group-hover:gap-3 transition-all hover:text-brand-700">
                    {linkText || 'Learn more'} <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

export default EnterpriseSolutionCard;
