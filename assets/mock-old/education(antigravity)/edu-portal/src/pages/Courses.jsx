import { Link } from 'react-router-dom';
import { Filter, ChevronDown } from 'lucide-react';

function Courses() {
    return (
        <div className="flex bg-slate-50 min-h-screen">
            {/* Sidebar Filter Placeholder */}
            <div className="hidden lg:block w-64 flex-shrink-0 border-r border-slate-200 bg-white min-h-[calc(100vh-4rem)] p-6">
                <h3 className="font-bold text-slate-900 mb-6 pb-4 border-b border-slate-200">Filter By</h3>
                <div className="space-y-6">
                    <div>
                        <h4 className="font-semibold text-slate-800 mb-3">Topic</h4>
                        <div className="space-y-2 text-sm text-slate-600">
                            <label className="flex items-center gap-2 cursor-pointer hover:text-slate-900"><input type="checkbox" className="rounded text-brand-600" /> Data Science</label>
                            <label className="flex items-center gap-2 cursor-pointer hover:text-slate-900"><input type="checkbox" className="rounded text-brand-600" /> Business</label>
                            <label className="flex items-center gap-2 cursor-pointer hover:text-slate-900"><input type="checkbox" className="rounded text-brand-600" /> Computer Science</label>
                        </div>
                    </div>
                    <div>
                        <h4 className="font-semibold text-slate-800 mb-3">Level</h4>
                        <div className="space-y-2 text-sm text-slate-600">
                            <label className="flex items-center gap-2 cursor-pointer hover:text-slate-900"><input type="checkbox" className="rounded text-brand-600" /> Beginner</label>
                            <label className="flex items-center gap-2 cursor-pointer hover:text-slate-900"><input type="checkbox" className="rounded text-brand-600" /> Intermediate</label>
                            <label className="flex items-center gap-2 cursor-pointer hover:text-slate-900"><input type="checkbox" className="rounded text-brand-600" /> Advanced</label>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-grow p-4 md:p-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 mb-2">Explore 10,000+ Courses</h1>
                        <p className="text-slate-600">Learn from top universities and industry leaders.</p>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <button className="lg:hidden flex items-center justify-center gap-2 border border-slate-300 bg-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 flex-1">
                            <Filter className="w-4 h-4" /> Filters
                        </button>
                        <button className="flex items-center justify-between gap-4 border border-slate-300 bg-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 flex-1 md:w-48">
                            Sort by Most Popular <ChevronDown className="w-4 h-4 text-slate-400" />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {[...Array(9)].map((_, i) => (
                        <Link to="/courses/detail" key={i} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-xl transition-all cursor-pointer group flex flex-col h-full">
                            <div className="h-40 bg-slate-200 w-full flex items-center justify-center text-slate-400 relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-tr from-brand-600/20 to-transparent mix-blend-multiply opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                Course Preview Image
                            </div>
                            <div className="p-6 flex flex-col flex-grow">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-6 h-6 rounded bg-slate-200 flex-shrink-0"></div>
                                    <span className="text-xs font-semibold text-slate-600">University Partners</span>
                                </div>
                                <h3 className="font-bold text-lg text-slate-900 leading-tight mb-2 group-hover:text-brand-600 transition-colors">Complete Machine Learning Bootcamp</h3>
                                <p className="text-sm text-slate-500 mb-4 line-clamp-2">Master Python, analyze data, and build intelligent systems with practical projects and expert guidance.</p>
                                <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                                    <div className="text-sm font-semibold text-slate-800 flex items-center gap-1">
                                        4.9 <span className="text-amber-500">★</span> <span className="text-slate-500 font-normal">(18k)</span>
                                    </div>
                                    <span className="text-sm font-medium text-slate-500">Beginner • 3 Months</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default Courses;
