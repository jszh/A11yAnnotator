import { Link } from 'react-router-dom';
import ProgressWidget from '../components/ProgressWidget';
import LearningModeCard from '../components/LearningModeCard';
import { Book, LayoutGrid, Clock, Settings, FileText, CheckSquare, Target, ChevronRight } from 'lucide-react';

function Study() {
    return (
        <div className="flex min-h-[calc(100vh-4rem)] bg-slate-50">
            {/* Mini Sidebar */}
            <div className="w-20 lg:w-64 bg-white border-r border-slate-200 flex flex-col py-6">
                <nav className="flex-grow space-y-2 px-3">
                    <Link to="/study" className="flex items-center gap-3 p-3 rounded-lg bg-brand-50 text-brand-700 font-medium">
                        <LayoutGrid className="w-5 h-5 flex-shrink-0" />
                        <span className="hidden lg:block">Dashboard</span>
                    </Link>
                    <Link to="#" className="flex items-center gap-3 p-3 rounded-lg text-slate-600 hover:bg-slate-50 font-medium">
                        <Book className="w-5 h-5 flex-shrink-0" />
                        <span className="hidden lg:block">My Library</span>
                    </Link>
                    <Link to="#" className="flex items-center gap-3 p-3 rounded-lg text-slate-600 hover:bg-slate-50 font-medium">
                        <Clock className="w-5 h-5 flex-shrink-0" />
                        <span className="hidden lg:block">Recent</span>
                    </Link>
                </nav>
                <div className="px-3">
                    <Link to="#" className="flex items-center gap-3 p-3 rounded-lg text-slate-600 hover:bg-slate-50 font-medium">
                        <Settings className="w-5 h-5 flex-shrink-0" />
                        <span className="hidden lg:block">Settings</span>
                    </Link>
                </div>
            </div>

            <div className="flex-grow p-6 lg:p-10">
                <div className="max-w-6xl mx-auto">
                    <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome back, Student 👋</h1>
                            <p className="text-slate-600">You're on a 5-day streak! Keep up the great work.</p>
                        </div>
                        <button className="bg-brand-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-brand-700 transition-colors shadow-sm">
                            Resume Learning
                        </button>
                    </header>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="md:col-span-2 space-y-8">
                            {/* Recent Items */}
                            <section>
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-bold text-slate-900">Jump back in</h2>
                                    <a href="#" className="text-sm font-medium text-brand-600 hover:text-brand-700">View all</a>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Active Study Set */}
                                    <Link to="/study/flashcards" className="bg-white border text-left border-slate-200 rounded-xl p-5 flex items-start gap-4 hover:shadow-md hover:border-brand-300 transition-all cursor-pointer group">
                                        <div className="bg-blue-50 text-blue-600 p-3 rounded-lg flex-shrink-0">
                                            <Book className="w-6 h-6" />
                                        </div>
                                        <div className="flex-grow">
                                            <h3 className="font-bold text-slate-900 group-hover:text-brand-600 transition-colors">Biology 101: Cell Structure</h3>
                                            <p className="text-xs text-slate-500 mt-1 mb-3">45 Terms • Last studied 2h ago</p>
                                            <div className="w-full bg-slate-100 rounded-full h-1.5">
                                                <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '60%' }}></div>
                                            </div>
                                        </div>
                                    </Link>

                                    {/* Course Progress */}
                                    <Link to="/curriculum" className="bg-white border text-left border-slate-200 rounded-xl p-5 flex items-start gap-4 hover:shadow-md hover:border-brand-300 transition-all cursor-pointer group">
                                        <div className="bg-purple-50 text-purple-600 p-3 rounded-lg flex-shrink-0">
                                            <Target className="w-6 h-6" />
                                        </div>
                                        <div className="flex-grow">
                                            <h3 className="font-bold text-slate-900 group-hover:text-brand-600 transition-colors">Advanced Algebra</h3>
                                            <p className="text-xs text-slate-500 mt-1 mb-3">Topic: Quadratic Equations</p>
                                            <div className="w-full bg-slate-100 rounded-full h-1.5">
                                                <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: '30%' }}></div>
                                            </div>
                                        </div>
                                    </Link>
                                </div>
                            </section>

                            {/* Modes */}
                            <section>
                                <h2 className="text-xl font-bold text-slate-900 mb-4">Study Modes</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <Link to="/study/flashcards">
                                        <LearningModeCard
                                            title="Flashcards"
                                            description="Review definitions and concepts quickly."
                                            icon={<FileText className="w-5 h-5" />}
                                        />
                                    </Link>
                                    <Link to="/study/test">
                                        <LearningModeCard
                                            title="Practice Test"
                                            description="Evaluate your knowledge with dynamic tests."
                                            icon={<CheckSquare className="w-5 h-5" />}
                                        />
                                    </Link>
                                    <div className="opacity-50 pointer-events-none">
                                        <LearningModeCard
                                            title="AI Tutor"
                                            description="Get personalized help from AI."
                                            icon={<Target className="w-5 h-5" />}
                                            isPremium={true}
                                        />
                                    </div>
                                </div>
                            </section>
                        </div>

                        <div className="md:col-span-1 border-t md:border-none border-slate-200 pt-8 md:pt-0">
                            <ProgressWidget />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Study;
