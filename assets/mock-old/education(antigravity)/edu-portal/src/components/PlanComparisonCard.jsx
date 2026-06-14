import { Check } from 'lucide-react';

function PlanComparisonCard({ title, price, description, features, isPopular, buttonText }) {
    return (
        <div className={`rounded-2xl p-8 flex flex-col h-full bg-white relative ${isPopular ? 'border-2 border-brand-500 shadow-xl' : 'border border-slate-200 shadow-sm'}`}>
            {isPopular && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-brand-500 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                    Most Popular
                </div>
            )}
            <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
            <p className="text-slate-500 text-sm mb-6 h-10">{description}</p>
            <div className="mb-6">
                <span className="text-4xl font-extrabold text-slate-900">{price}</span>
                {price !== 'Free' && <span className="text-slate-500 font-medium">/month</span>}
            </div>
            <button className={`w-full py-3 rounded-lg font-bold transition-colors mb-8 ${isPopular ? 'bg-brand-600 text-white hover:bg-brand-700' : 'bg-slate-100 text-slate-900 hover:bg-slate-200'}`}>
                {buttonText || 'Get Started'}
            </button>
            <div className="flex-grow">
                <h4 className="text-sm font-semibold text-slate-900 mb-4 uppercase tracking-wider">What's included</h4>
                <ul className="space-y-3">
                    {features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-3">
                            <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-slate-600">{feature}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

export default PlanComparisonCard;
