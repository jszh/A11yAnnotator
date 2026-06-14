import { Trophy, TrendingUp, Target } from 'lucide-react';

function ProgressWidget() {
    return (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" /> Your Progress
            </h3>

            <div className="space-y-6">
                <div>
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-sm font-semibold text-slate-700">Daily Goal</span>
                        <span className="text-xs text-slate-500">2/4 lessons</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5">
                        <div className="bg-brand-500 h-2.5 rounded-full" style={{ width: '50%' }}></div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="w-4 h-4 text-amber-600" />
                            <span className="text-xs font-semibold text-amber-900 uppercase tracking-wider">Streak</span>
                        </div>
                        <div className="text-2xl font-black text-amber-700">
                            5 <span className="text-sm font-medium text-amber-600">days</span>
                        </div>
                    </div>

                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                        <div className="flex items-center gap-2 mb-2">
                            <Target className="w-4 h-4 text-blue-600" />
                            <span className="text-xs font-semibold text-blue-900 uppercase tracking-wider">Score</span>
                        </div>
                        <div className="text-2xl font-black text-blue-700">
                            850 <span className="text-sm font-medium text-blue-600">xp</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProgressWidget;
