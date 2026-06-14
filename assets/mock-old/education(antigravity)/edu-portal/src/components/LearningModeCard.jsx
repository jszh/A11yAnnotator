function LearningModeCard({ title, description, icon, isPremium }) {
    return (
        <div className="bg-white border text-left border-slate-200 rounded-xl p-6 hover:shadow-md hover:border-brand-300 transition-all cursor-pointer relative overflow-hidden group">
            {isPremium && (
                <div className="absolute top-4 right-4 text-xs font-bold uppercase tracking-wider text-amber-600 bg-amber-100 px-2 py-1 rounded">
                    Premium
                </div>
            )}
            <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center mb-4 group-hover:bg-brand-600 group-hover:text-white transition-colors">
                {icon}
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
            <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
        </div>
    );
}

export default LearningModeCard;
