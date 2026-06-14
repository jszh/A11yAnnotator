import { BookOpen, Award, Clock, Calendar } from 'lucide-react';
import ProgressWidget from '../components/ProgressWidget';

function Dashboard() {
    return (
        <div className="bg-slate-50 min-h-[calc(100vh-4rem)] p-4 md:p-8">
            <div className="container mx-auto max-w-7xl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 mb-2">My Dashboard</h1>
                        <p className="text-slate-600">Welcome back! Here's what's happening with your learning.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                            <BookOpen className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 font-medium">Active Courses</p>
                            <p className="text-2xl font-bold text-slate-900">4</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
                            <Clock className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 font-medium">Hours Learned</p>
                            <p className="text-2xl font-bold text-slate-900">128</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                            <Award className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 font-medium">Certificates</p>
                            <p className="text-2xl font-bold text-slate-900">2</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                            <Calendar className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 font-medium">Current Streak</p>
                            <p className="text-2xl font-bold text-slate-900">5 <span className="text-sm font-normal text-slate-500">Days</span></p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        {/* Course Overview */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                                <h2 className="text-lg font-bold text-slate-900">In Progress</h2>
                                <a href="#" className="text-sm font-medium text-brand-600 hover:text-brand-700">View all</a>
                            </div>
                            <div className="divide-y divide-slate-100">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="p-6 flex flex-col sm:flex-row gap-6 items-center">
                                        <div className="w-full sm:w-32 h-20 bg-slate-200 rounded-lg flex-shrink-0 animate-pulse"></div>
                                        <div className="flex-grow w-full">
                                            <h3 className="font-bold text-slate-900 mb-1">Advanced React Patterns</h3>
                                            <p className="text-sm text-slate-500 mb-3">University of Example</p>
                                            <div className="flex items-center gap-4">
                                                <div className="flex-grow bg-slate-100 rounded-full h-2">
                                                    <div className="bg-brand-500 h-2 rounded-full" style={{ width: `${i * 25 + 10}%` }}></div>
                                                </div>
                                                <span className="text-sm font-medium text-slate-700">{i * 25 + 10}%</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-1 space-y-8">
                        <ProgressWidget />

                        {/* Upcoming Deadlines */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-slate-500" /> Upcoming
                            </h2>
                            <div className="space-y-4">
                                <div className="flex gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-slate-200">
                                    <div className="w-12 flex-shrink-0 text-center">
                                        <div className="text-xs font-bold text-red-500 uppercase tracking-wide">Oct</div>
                                        <div className="text-xl font-black text-slate-900">24</div>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-900 text-sm">Module 3 Quiz Due</h4>
                                        <p className="text-xs text-slate-500 mt-1">Advanced React Patterns</p>
                                    </div>
                                </div>
                                <div className="flex gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-slate-200">
                                    <div className="w-12 flex-shrink-0 text-center text-slate-400">
                                        <div className="text-xs font-bold uppercase tracking-wide">Oct</div>
                                        <div className="text-xl font-black">28</div>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-900 text-sm">Final Project Submission</h4>
                                        <p className="text-xs text-slate-500 mt-1">Data Science Fundamentals</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
