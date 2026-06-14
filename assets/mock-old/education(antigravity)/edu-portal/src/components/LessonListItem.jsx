import { PlayCircle, FileText, CheckCircle, Lock } from 'lucide-react';

function LessonListItem({ title, duration, type, isCompleted, isLocked, active }) {
    const getIcon = () => {
        if (isCompleted) return <CheckCircle className="w-5 h-5 text-green-500" />;
        if (isLocked) return <Lock className="w-5 h-5 text-slate-400" />;
        if (type === 'video') return <PlayCircle className={`w-5 h-5 ${active ? 'text-brand-600' : 'text-slate-500'}`} />;
        return <FileText className={`w-5 h-5 ${active ? 'text-brand-600' : 'text-slate-500'}`} />;
    };

    return (
        <div className={`flex items-start gap-4 p-4 hover:bg-slate-50 transition-colors cursor-pointer border-l-4 ${active ? 'bg-brand-50 border-brand-500' : 'border-transparent'}`}>
            <div className="mt-1 flex-shrink-0">
                {getIcon()}
            </div>
            <div className="flex-grow">
                <h4 className={`text-sm font-medium ${isLocked ? 'text-slate-500' : 'text-slate-900'} ${active ? 'text-brand-700 font-semibold' : ''}`}>{title}</h4>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-500 capitalize">{type}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                    <span className="text-xs text-slate-500">{duration}</span>
                </div>
            </div>
        </div>
    );
}

export default LessonListItem;
