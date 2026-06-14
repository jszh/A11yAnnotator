import { Link } from 'react-router-dom';
import AnnouncementBar from '../components/AnnouncementBar';
import HeroCourseDiscovery from '../components/HeroCourseDiscovery';
import LogoTrustStrip from '../components/LogoTrustStrip';
import CategoryQuickGrid from '../components/CategoryQuickGrid';

function Home() {
    return (
        <div className="flex flex-col min-h-screen">
            <AnnouncementBar />
            <HeroCourseDiscovery />
            <LogoTrustStrip />
            <CategoryQuickGrid />

            {/* Recommended for you section placeholder */}
            <section className="py-16 bg-slate-50 border-t border-slate-200">
                <div className="container mx-auto px-4">
                    <h2 className="text-2xl font-bold text-slate-900 mb-8">Recommended for you</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                                <div className="h-32 bg-slate-200 w-full animate-pulse"></div>
                                <div className="p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded">COURSE</span>
                                        <span className="text-xs text-slate-500">Yale University</span>
                                    </div>
                                    <h3 className="font-bold text-slate-900 leading-tight mb-2 line-clamp-2 hover:text-brand-600 transition-colors">Introduction to Psychology</h3>
                                    <p className="text-sm text-slate-500 mb-4">4.8 ⭐ (120k reviews)</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}

export default Home;
