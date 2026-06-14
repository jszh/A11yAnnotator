import CurriculumSidebar from '../components/CurriculumSidebar';

function Curriculum() {
    return (
        <div className="flex h-[calc(100vh-4rem)] bg-slate-50 overflow-hidden">
            <CurriculumSidebar />
            <div className="flex-grow flex flex-col items-center justify-center p-8 bg-black text-white relative">
                <div className="absolute top-4 left-4 bg-slate-800 text-slate-300 px-3 py-1 rounded text-sm font-medium">
                    Module 1: Getting Started
                </div>
                {/* Main content area (video player placeholder) */}
                <div className="w-full max-w-4xl aspect-video bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex items-center justify-center mb-8 relative group cursor-pointer overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/20 transition-all">
                        <div className="w-20 h-20 bg-brand-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                            <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[16px] border-l-white border-b-[10px] border-b-transparent ml-2"></div>
                        </div>
                    </div>
                    <span className="text-slate-500 font-medium">Video Player Placeholder</span>
                </div>
                <div className="w-full max-w-4xl">
                    <h1 className="text-3xl font-bold mb-4">First Quiz</h1>
                    <p className="text-slate-400 mb-6">Test your knowledge on the basics of the platform environment.</p>
                    <div className="flex gap-4">
                        <button className="bg-white text-black px-6 py-2 rounded font-semibold hover:bg-slate-200 transition-colors">Start Quiz</button>
                        <button className="bg-slate-800 text-white px-6 py-2 rounded font-semibold hover:bg-slate-700 transition-colors">Review Material</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Curriculum;
